import { RTTP } from "../protocal";
import {
  ConnectionRole,
  type ConnectionIdentity,
  type ConnectionOptions,
  type Pair,
} from "../types/type";
import { RTTPMassageFrame } from "../core/RTTPFrame";
import { RTTPDecoder } from "../core/RTTPDecoder";
import { DomainException } from "../exception/exception";
import { RTTPEncoder } from "../core/RTTPEncoder";
import {
  type RTTPAckn,
  type RTTPHandler,
  type RTTPInform,
  type RTTPMessage,
  type RTTPMessageInput,
} from "../types/rttp";
import { RTTPOperation, RTTPType } from "../types/enum";

export class RTTPConnection {
  private static connection: RTTPConnection | null = null;
  private handlers = new Set<RTTPHandler>();
  private messageFrame: RTTPMassageFrame;
  private remoteIdentity: ConnectionIdentity | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (message: RTTPMessage) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(
    private socket: Bun.Socket,
    private _onMessage?: RTTPHandler,
    private localIdentity?: ConnectionIdentity,
    private connectionOptions?: ConnectionOptions,
  ) {
    this.messageFrame = new RTTPMassageFrame();
  }

  static async connect(connection: ConnectionOptions): Promise<RTTPConnection> {
    await Bun.connect({
      hostname: connection.host,
      port: connection.port,
      socket: {
        async open(socket) {
          RTTPConnection.connection = new RTTPConnection(
            socket,
            undefined,
            undefined,
            connection,
          );
        },
        data(socket, data) {
          RTTPConnection.connection?.receive(data);
        },
        close(socket) {
          RTTPConnection.connection = null;
        },
        error(socket, error) {
          console.error("Socket error:", error);
        },
      },
    });
    if (!RTTPConnection.connection)
      throw new Error("Fail to connect to server");

    return RTTPConnection.connection;
  }

  private send(message: string) {
    const encoded = RTTP.encode(message);
    this.socket.write(encoded);
  }

  private async sendLocation(message: string) {
    const encoded = RTTP.encode(message);
    const client = await Bun.udpSocket({});
    client.send(
      encoded,
      this.connectionOptions?.locationServer.port!,
      this.connectionOptions?.locationServer.host!,
    );
  }

  async reportLocation(location: { lat: string; lng: string }, token: string) {
    const identity = this.getIdentity();
    const requestId = crypto.randomUUID();
    const message: RTTPInform = {
      requestid: requestId,
      version: "1.0",
      role: identity?.role ?? ConnectionRole.UNKNOWN,
      id: identity?.id ?? null,
      type: RTTPType.INFORM,
      operation: RTTPOperation.REPORT_LOCATION,
      payload: {
        driverid: this.getIdentity()?.id ?? "",
        driverlat: location.lat,
        driverlng: location.lng,
        locationtoken: token,
      },
    };

    this.sendLocation(RTTPEncoder.encode(message));
  }

  async inform<T extends RTTPMessageInput>(
    obj: T,
  ): Promise<Extract<RTTPAckn, { operation: T["operation"] }>> {
    const requestId = crypto.randomUUID();
    const identity = this.getIdentity();
    const message: RTTPMessage = {
      ...obj,
      requestid: requestId,
      version: "1.0",
      role: identity?.role ?? ConnectionRole.UNKNOWN,
      id: identity?.id ?? null,
    } as RTTPMessage;

    const response = new Promise<
      Extract<RTTPAckn, { operation: T["operation"] }>
    >((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve: resolve as (message: RTTPMessage) => void,
        reject,
      });
    });

    this.send(RTTPEncoder.encode(message));
    return response;
  }

  async ackn(obj: RTTPMessageInput, messageId: string) {
    const c: RTTPMessage = {
      ...obj,
      requestid: messageId,
      version: "1.0",
      role: this.getIdentity()?.role ?? ConnectionRole.UNKNOWN,
      id: this.getIdentity()?.id ?? null,
    };
    const encoded = RTTPEncoder.encode(c);
    this.send(encoded);
  }

  receive(data: Buffer<ArrayBufferLike>) {
    const frames = this.messageFrame.push(data);

    for (const frame of frames) {
      try {
        const obj = RTTPDecoder.decode(frame);
        if (obj.requestid) {
          const pending = this.pendingRequests.get(obj.requestid);

          if (pending) {
            this.pendingRequests.delete(obj.requestid);
            pending.resolve(obj);
          }
        }

        // call upper message handdler
        if (this._onMessage) this._onMessage(this, obj);

        // call internal message handdler
        for (const handler of this.handlers) {
          handler(this, obj);
        }
      } catch (err: unknown) {
        console.log(err);
        let message = "";
        if (err instanceof DomainException) {
          message = RTTPEncoder.encode({
            requestid: "0",
            role: this.getIdentity()?.role || ConnectionRole.UNKNOWN,
            id: this.getIdentity()?.id || null,
            type: RTTPType.ACKN,
            version: "1.0",
            status: err.status,
            operation: RTTPOperation.ERROR,
            payload: {
              message: err.message,
            },
          });
        } else {
          message = RTTPEncoder.encode({
            requestid: "0",
            role: this.getIdentity()?.role || ConnectionRole.UNKNOWN,
            id: this.getIdentity()?.id || null,
            type: RTTPType.ACKN,
            version: "1.0",
            status: 500,
            operation: RTTPOperation.ERROR,
            payload: {
              message: "Unexpected error",
            },
          });
        }
        this.socket.write(RTTP.encode(message));
      }
    }
  }

  onMessage(handler: RTTPHandler) {
    this.handlers.add(handler);

    return () => {
      this.handlers.delete(handler);
    };
  }

  setLocalIdentity(identity: ConnectionIdentity) {
    this.localIdentity = identity;
  }

  setRemoteIdentity(identity: ConnectionIdentity) {
    this.remoteIdentity = identity;
  }

  getIdentity() {
    return this.localIdentity;
  }

  getRemoteIdentity() {
    return this.remoteIdentity;
  }

  close() {
    console.log("Closing connection...");
    this.socket.end();
    RTTPConnection.connection = null;
  }
}

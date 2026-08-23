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
import { type RTTPHandler } from "../types/rttp";
import { RTTPOperation, RTTPType } from "../types/enum";

export class RTTPConnection {
  private static connection: RTTPConnection | null = null;
  private handlers = new Set<RTTPHandler>();
  private messageFrame: RTTPMassageFrame;
  private identity: ConnectionIdentity | null = null;

  constructor(
    private socket: Bun.Socket,
    private _onMessage?: RTTPHandler,
  ) {
    this.messageFrame = new RTTPMassageFrame();
  }

  static async connect(connection: ConnectionOptions): Promise<RTTPConnection> {
    await Bun.connect({
      hostname: connection.host,
      port: connection.port,
      socket: {
        open(socket) {
          RTTPConnection.connection = new RTTPConnection(socket);
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
    console.log(
      `Successfully connect to ${connection.host}:${connection.port}`,
    );
    if (!RTTPConnection.connection)
      throw new Error("Fail to connect to server");

    return RTTPConnection.connection;
  }

  send(message: string) {
    const encoded = RTTP.encode(message);
    this.socket.write(encoded);
  }

  receive(data: Buffer<ArrayBufferLike>) {
    const frames = this.messageFrame.push(data);

    for (const frame of frames) {
      try {
        const obj = RTTPDecoder.decode(frame);
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

  identify(identity: ConnectionIdentity) {
    this.identity = identity;
  }

  getIdentity() {
    return this.identity;
  }

  close() {
    console.log("Closing connection...");
    this.socket.end();
    RTTPConnection.connection = null;
  }
}

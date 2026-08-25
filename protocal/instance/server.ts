import { RTTPDecoder } from "../core/RTTPDecoder";
import { RTTPEncoder } from "../core/RTTPEncoder";
import { RTTPOperation, RTTPType } from "../types/enum";
import {
  type RTTPHandler,
  type RTTPLocationHandler,
  type RTTPMessage,
  type RTTPMessageInput,
} from "../types/rttp";
import { ConnectionRole, type ServerOptions } from "../types/type";
import { RTTPConnection } from "./connection";

export class RTTPServer {
  private server: Bun.TCPSocketListener<undefined>;
  private locationServer: Bun.udp.Socket<"buffer">;
  private handlers = new Map<RTTPOperation, RTTPHandler>();
  private messageHandler = new Set<RTTPHandler>();
  private locationMessageHandler = new Set<RTTPLocationHandler>();
  private connections = new Map<Bun.Socket, RTTPConnection>();

  private constructor(
    server: Bun.TCPSocketListener<undefined>,
    locationServer: Bun.udp.Socket<"buffer">,
  ) {
    this.server = server;
    this.locationServer = locationServer;
  }

  static async listen(options: ServerOptions) {
    const server = Bun.listen({
      hostname: options.host,
      port: options.port,

      socket: {
        open(socket) {
          const connection = new RTTPConnection(
            socket,
            (connection, message) => {
              serverInstance.handleMessage(connection, message);
            },
            {
              role: ConnectionRole.SERVER,
              id: "0",
            },
          );

          serverInstance.connections.set(socket, connection);
          const estab: RTTPMessageInput = {
            operation: RTTPOperation.ESTAB,
            status: 200,
            type: RTTPType.ACKN,
          };

          serverInstance.handleMessage(connection, {
            requestid: "0",
            role: ConnectionRole.SERVER,
            id: "0",
            version: "1.0",
            ...estab,
          });
          connection.inform(estab);
        },

        data(socket, data) {
          const connection = serverInstance.connections.get(socket);

          connection?.receive(data);
        },

        close(socket) {
          serverInstance.connections.delete(socket);
          console.log("Client disconnected");
        },

        error(socket, error) {
          console.error("Socket error:", error);
        },
      },
    });
    const locationServer = await Bun.udpSocket({
      hostname: options.locationServer.host,
      port: options.locationServer.port,
      socket: {
        data(socket, buf, port, addr) {
          const obj = RTTPDecoder.decode(buf.toString());
          for (const handler of serverInstance.locationMessageHandler) {
            handler(obj, port, addr);
          }
        },
      },
    });

    const serverInstance = new RTTPServer(server, locationServer);
    return serverInstance;
  }

  getConnections() {
    return Array.from(this.connections.values());
  }
  on(operation: RTTPOperation, handler: RTTPHandler) {
    this.handlers.set(operation, handler);
    return this;
  }

  onLocationMessage(handler: RTTPLocationHandler) {
    this.locationMessageHandler.add(handler);

    return () => {
      this.locationMessageHandler.delete(handler);
    };
  }

  onMessage(handler: RTTPHandler) {
    this.messageHandler.add(handler);

    return () => {
      this.messageHandler.delete(handler);
    };
  }

  private async handleMessage(
    connection: RTTPConnection,
    message: RTTPMessage,
  ) {
    for (const messaageHandler of this.messageHandler) {
      messaageHandler(connection, message);
    }

    const handler = this.handlers.get(message.operation);

    if (!handler) {
      connection.ackn(
        {
          operation: RTTPOperation.NOT_IMPLEMENTED,
          type: RTTPType.ACKN,
          status: 501,
        },
        message.requestid,
      );
      return;
    }

    await handler(connection, message);
  }
}

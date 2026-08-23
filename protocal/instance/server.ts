import { RTTPEncoder } from "../core/RTTPEncoder";
import { RTTPOperation, RTTPType } from "../types/enum";
import { type RTTPHandler, type RTTPMessage } from "../types/rttp";
import { ConnectionRole, type ServerOptions } from "../types/type";
import { RTTPConnection } from "./connection";

export class RTTPServer {
  private server: Bun.TCPSocketListener<undefined>;

  private handlers = new Map<RTTPOperation, RTTPHandler>();
  private messageHandler = new Set<RTTPHandler>();
  private connections = new Map<Bun.Socket, RTTPConnection>();

  private constructor(server: Bun.TCPSocketListener<undefined>) {
    this.server = server;
  }

  static listen(options: ServerOptions) {
    const serverInstance = new RTTPServer(
      Bun.listen({
        hostname: options.host,
        port: options.port,

        socket: {
          open(socket) {
            const connection = new RTTPConnection(
              socket,
              (connection, message) => {
                serverInstance.handleMessage(connection, message);
              },
            );

            serverInstance.connections.set(socket, connection);
            const estab: RTTPMessage = {
              role: ConnectionRole.SERVER,
              id: "0",
              version: "1.0",
              operation: RTTPOperation.ESTAB,
              status: 200,
              type: RTTPType.ACKN,
            };

            serverInstance.handleMessage(connection, estab);
            connection.send(RTTPEncoder.encode(estab));
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
      }),
    );

    return serverInstance;
  }

  on(operation: RTTPOperation, handler: RTTPHandler) {
    this.handlers.set(operation, handler);
    return this;
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
      const message = RTTPEncoder.encode({
        role: ConnectionRole.SERVER,
        id: "0",
        version: "1.0",
        operation: RTTPOperation.NOT_IMPLEMENTED,
        type: RTTPType.ACKN,
        status: 501,
      });
      connection.send(message);
      return;
    }

    await handler(connection, message);
  }
}

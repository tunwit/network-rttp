import { RTTPEncoder } from "../core/RTTPEncoder";
import { RTTPOperation, RTTPType } from "../types/enum";
import {
  type RTTPHandler,
  type RTTPMessage,
  type RTTPMessageInput,
} from "../types/rttp";
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

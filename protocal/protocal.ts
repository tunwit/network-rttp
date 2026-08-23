import { RTTPConnection } from "./instance/connection";
import { RTTPServer } from "./instance/server";
import type { ConnectionOptions, ServerOptions } from "./types/type";
import { RTTPUtils } from "./utils/utils";

export class RTTP {
  static decode(data: Buffer<ArrayBufferLike>) {
    return RTTPUtils.decode(data);
  }

  static encode(message: string) {
    return RTTPUtils.encode(message);
  }

  public static async connect(connection: ConnectionOptions) {
    return await RTTPConnection.connect(connection);
  }

  public static async listen(options: ServerOptions) {
    return await RTTPServer.listen(options);
  }

}

import { RTTPOperation, RTTPType } from "../types/enum";
import { ConnectionRole } from "../types/type";

export class RTTPUtils {
  static decode(data: Buffer<ArrayBufferLike>) {
    return data.toString();
  }

  static encode(message: string) {
    return Buffer.from(message);
  }

  static isValidOperation(value: string): value is RTTPOperation {
    return Object.values(RTTPOperation).includes(value as RTTPOperation);
  }

  static isValidRole(value: string): value is ConnectionRole {
    return Object.values(ConnectionRole).includes(value as ConnectionRole);
  }

  static isValidType(value: string): value is RTTPType {
    return Object.values(RTTPType).includes(value as RTTPType);
  }
}

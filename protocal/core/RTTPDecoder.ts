import { z } from "zod";
import { BadRequestException } from "../exception/exception";
import { RTTPOperationSchemaMap, type RTTPMessage } from "../types/rttp";
import { RTTPUtils } from "../utils/utils";
import { RTTPOperation, RTTPType } from "../types/enum";
import type { ConnectionRole } from "../types/type";

export class RTTPDecoder {
  private static VERSION_POS = 0;
  private static ROLE_POS = 1;
  private static ID_POS = 2;
  private static TYPE_POS = 3;

  static decode(message: string): RTTPMessage {
    const splitted = message.split("\r\n\n");
    if (splitted.length < 4) throw new BadRequestException();

    const role = this.getRole(splitted[this.ROLE_POS]!);
    const id = this.getId(splitted[this.ID_POS]!);
    const version = this.getVersion(splitted[this.VERSION_POS]!);
    const type = this.getType(splitted[this.TYPE_POS]!);

    let index = 4;
    let status: string | undefined;

    if (type === RTTPType.ACKN) {
      status = this.getStatus(splitted[index]!);
      index++;
    }

    const operation = this.getOperation(splitted[index]!);
    index++;

    const payloadBlock = splitted.slice(index).join("\r\n");
    const payload = this.getPayload(type, operation, payloadBlock);

    return {
      role: role,
      id: id,
      version,
      type,
      operation,
      ...(status !== undefined && { status: Number(status) }),
      ...(payload !== undefined && { payload }),
    } as RTTPMessage;
  }

  private static getPayload(
    type: RTTPType,
    operation: RTTPOperation,
    part: string,
  ) {
    const schema = RTTPOperationSchemaMap[operation][type];

    if (Object.keys(schema.shape).length === 0) {
      return undefined;
    }

    const rawFields = RTTPDecoder.parseFields(part);

    const lowered: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawFields)) {
      lowered[key.toLowerCase()] = value;
    }

    const result = schema.safeParse(lowered);

    if (!result.success) {
      throw new BadRequestException(this.formatZodError(result.error));
    }

    return result.data;
  }

  private static formatZodError(error: z.ZodError): string {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
      .join("; ");
  }

  private static getRole(part: string) {
    if (!part.startsWith("ROLE: "))
      throw new BadRequestException("Role is missing");
    const role = part.replace("ROLE: ", "");
    if (!RTTPUtils.isValidRole(role))
      throw new BadRequestException("Invalid role");
    return role as ConnectionRole;
  }

  private static getId(part: string) {
    if (!part.startsWith("ID: "))
      throw new BadRequestException("Id is missing");
    const id = part.replace("ID: ", "");
    if (id === "N/A") return null;
    return id;
  }

  private static getVersion(part: string) {
    if (!part.startsWith("RTTP/"))
      throw new BadRequestException("version is missing");
    return part.replace("RTTP/", "");
  }

  private static getOperation(part: string) {
    if (!part.startsWith("OPERATION: "))
      throw new BadRequestException("operation is missing");
    const operation = part.replace("OPERATION: ", "");
    if (!RTTPUtils.isValidOperation(operation))
      throw new BadRequestException("Invalid operation");
    return operation as RTTPOperation;
  }

  private static getType(part: string) {
    if (!part.startsWith("TYPE: "))
      throw new BadRequestException("Type is missing");
    const type = part.replace("TYPE: ", "");
    if (!RTTPUtils.isValidType(type))
      throw new BadRequestException("Invalid type");
    return type as RTTPType;
  }

  private static getStatus(part: string) {
    if (!part.startsWith("STATUS: "))
      throw new BadRequestException("Status is missing");
    return part.replace("STATUS: ", "");
  }

  private static parseFields(data: string): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const line of data.split("\r\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      fields[key] = value;
    }
    return fields;
  }
}

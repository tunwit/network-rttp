import { z } from "zod";
import { DomainException } from "../exception/exception";
import { RTTPOperationSchemaMap, type RTTPMessage } from "../types/rttp";
import { RTTPType } from "../types/enum";

export class RTTPEncoder {
  private static readonly START = "<RTTP_START>";
  private static readonly END = "<RTTP_END>";
  private static readonly delimiter = "\r\n\n";

  static encode(obj: RTTPMessage): string {
    let body = "";

    body += `RTTP/${obj.version}${RTTPEncoder.delimiter}`;
    body += `REQUEST_ID: ${obj.requestid}${RTTPEncoder.delimiter}`;
    body += `ROLE: ${obj.role}${RTTPEncoder.delimiter}`;
    body += `ID: ${obj.id}${RTTPEncoder.delimiter}`;
    body += `TYPE: ${obj.type}${RTTPEncoder.delimiter}`;
    if (obj.type === RTTPType.ACKN) {
      body += `STATUS: ${obj.status}${RTTPEncoder.delimiter}`;
    }
    body += `OPERATION: ${obj.operation}${RTTPEncoder.delimiter}`;

    const schema = RTTPOperationSchemaMap[obj.operation][obj.type];
    const rawPayload = "payload" in obj ? obj.payload : {};
    const result = schema.safeParse(rawPayload ?? {});

    if (!result.success) {
      throw new DomainException(
        `${obj.operation} payload invalid: ${this.formatZodError(result.error)}`,
      );
    }
    
    body += this.payloadEncoder(schema, result.data);

    
    return `${RTTPEncoder.START}${RTTPEncoder.delimiter}${body}${RTTPEncoder.END}${RTTPEncoder.delimiter}`;
  }

  private static payloadEncoder(
    schema: z.ZodObject<z.ZodRawShape>,
    payload: Record<string, unknown>,
  ): string {
    let result = "";
    for (const key of Object.keys(schema.shape)) {
      const value = payload[key];
      if (value !== undefined) {
        result += `${key.toUpperCase()}: ${value}${RTTPEncoder.delimiter}`;
      }
    }
    return result;
  }

  private static formatZodError(error: z.ZodError): string {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
      .join("; ");
  }
}

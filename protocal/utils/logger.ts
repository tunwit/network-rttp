import type { RTTPConnection } from "../instance/connection";
import type { RTTPMessage } from "../types/rttp";

export class Logger {
  private static getTimeStamp() {
    const date = new Date();

    const formatted = new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",

      hour12: false,
    }).format(date);
    return formatted;
  }
  static log(connection: RTTPConnection, message: RTTPMessage) {
    console.log(
      `[${message.type}](${message.requestid}) ${this.getTimeStamp()} ${message.role}(${message.id}) ${message.operation} ${this.payloadToString(message)}`,
    );
  }

  private static payloadToString(message: RTTPMessage) {
    if ("payload" in message) {
      return JSON.stringify(message.payload);
    }
    return "";
  }
}

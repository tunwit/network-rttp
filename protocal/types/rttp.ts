import { z } from "zod";
import type { RTTPConnection } from "../instance/connection";
import {
  ErrorSchema,
  ESTABSchema,
  LocationReportSchema,
  NotImplementedSchema,
  RegisterDriverSchema,
  RegisterPassengerSchema,
  RequestRideSchema,
  StartLocationSchema,
} from "./schema";

import { RTTPOperation, RTTPType } from "./enum";
import type { ConnectionRole } from "./type";

const EmptySchema = {
  [RTTPType.INFORM]: z.object({}).strict(),
  [RTTPType.ACKN]: z.object({}).strict(),
};

export const RTTPOperationSchemaMap = {
  [RTTPOperation.ESTAB]: ESTABSchema,
  [RTTPOperation.REGISTER_DRIVER]: RegisterDriverSchema,
  [RTTPOperation.REGISTER_PASSENGER]: RegisterPassengerSchema,
  [RTTPOperation.REQUEST_RIDE]: RequestRideSchema,
  [RTTPOperation.OFFER_RIDE]: EmptySchema,
  [RTTPOperation.ACCEPT_RIDE]: EmptySchema,
  [RTTPOperation.START_LOCATION]: StartLocationSchema,
  [RTTPOperation.REPORT_LOCATION]: LocationReportSchema,
  [RTTPOperation.END_LOCATION]: EmptySchema,
  [RTTPOperation.END_RIDE]: EmptySchema,
  [RTTPOperation.ERROR]: ErrorSchema,
  [RTTPOperation.NOT_IMPLEMENTED]: NotImplementedSchema,
} as const satisfies Record<
  RTTPOperation,
  {
    [RTTPType.INFORM]: z.ZodObject<z.ZodRawShape>;
    [RTTPType.ACKN]: z.ZodObject<z.ZodRawShape>;
  }
>;

// infer payload type, collapse to `undefined` when the schema has no fields
type InferPayload<T extends z.ZodObject<z.ZodRawShape>> =
  keyof T["shape"] extends never ? undefined : z.infer<T>;

type PayloadMap<T extends RTTPType> = {
  [O in RTTPOperation]: InferPayload<(typeof RTTPOperationSchemaMap)[O][T]>;
};

export type RTTPInformPayloadMap = PayloadMap<RTTPType.INFORM>;
export type RTTPAcknPayloadMap = PayloadMap<RTTPType.ACKN>;

export type RTTPInform = {
  [K in RTTPOperation]: {
    requestid: string;
    role: ConnectionRole;
    id: string | null;
    type: RTTPType.INFORM;
    version: string;
    operation: K;
  } & ([RTTPInformPayloadMap[K]] extends [undefined]
    ? {}
    : { payload: RTTPInformPayloadMap[K] });
}[RTTPOperation];

export type RTTPAckn = {
  [K in RTTPOperation]: {
    requestid: string;
    role: ConnectionRole;
    id: string | null;
    type: RTTPType.ACKN;
    version: string;
    operation: K;
    status: number;
  } & ([RTTPAcknPayloadMap[K]] extends [undefined]
    ? {}
    : { payload: RTTPAcknPayloadMap[K] });
}[RTTPOperation];

export type RTTPMessage = RTTPInform | RTTPAckn;

export type RTTPHandler = (
  connection: RTTPConnection,
  message: RTTPMessage,
) => void | Promise<void>;

export type RTTPLocationHandler = (
  buf: Buffer,
  port: number,
  addr: string,
) => void | Promise<void>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type RTTPMessageInput =
  | DistributiveOmit<RTTPInform, "version" | "role" | "id" | "requestid">
  | DistributiveOmit<RTTPAckn, "version" | "role" | "id" | "requestid">;

import z from "zod";
import { RTTPType } from "./enum";

type OperationSchema = {
  [RTTPType.INFORM]: z.ZodObject<z.ZodRawShape>;
  [RTTPType.ACKN]: z.ZodObject<z.ZodRawShape>;
};

export const ESTABSchema = {
  [RTTPType.INFORM]: z.object({}).strict(),
  [RTTPType.ACKN]: z.object({}).strict(),
} satisfies OperationSchema;

export const EmptySchema = {
  [RTTPType.INFORM]: z.object({}).strict(),
  [RTTPType.ACKN]: z.object({}).strict(),
} satisfies OperationSchema;

export const NotImplementedSchema = {
  [RTTPType.INFORM]: z.object({}).strict(),
  [RTTPType.ACKN]: z.object({}).strict(),
} satisfies OperationSchema;

export const RegisterDriverSchema = {
  [RTTPType.INFORM]: z
    .object({
      name: z.string().min(1, "name is required"),
    })
    .strict(),
  [RTTPType.ACKN]: z
    .object({
      driverid: z.string().min(1, "driverid is required"),
    })
    .strict(),
} satisfies OperationSchema;

export const RegisterPassengerSchema = {
  [RTTPType.INFORM]: z
    .object({
      name: z.string().min(1, "name is required"),
    })
    .strict(),
  [RTTPType.ACKN]: z
    .object({
      passengerid: z.string().min(1, "passengerid is required"),
    })
    .strict(),
} satisfies OperationSchema;

export const RequestRideSchema = {
  [RTTPType.INFORM]: z
    .object({
      lat: z.string().min(1, "latitude is required"),
      lng: z.string().min(1, "longitude is required"),
    })
    .strict(),
  [RTTPType.ACKN]: z
    .object({
      driverid: z.string().min(1, "driverid is required"),
      driverlat: z.string().min(1, "driver latitude is required"),
      driverlng: z.string().min(1, "driver longitude is required"),
    })
    .strict(),
} satisfies OperationSchema;

export const ErrorSchema = {
  [RTTPType.INFORM]: z
    .object({
      message: z.string().min(1, "message is required"),
    })
    .strict(),
  [RTTPType.ACKN]: z
    .object({
      message: z.string().min(1, "message is required"),
    })
    .strict(),
} satisfies OperationSchema;

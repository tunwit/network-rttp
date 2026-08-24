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
      pickuplat: z.string().min(1, "latitude is required"),
      pickuplng: z.string().min(1, "longitude is required"),
      destinationlat: z.string().min(1, "destination latitude is required"),
      destinationlng: z.string().min(1, "destination longitude is required"),
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

export const OfferRideSchema = {
  [RTTPType.INFORM]: z
    .object({
      pickuplat: z.string().min(1, "latitude is required"),
      pickuplng: z.string().min(1, "longitude is required"),
      destinationlat: z.string().min(1, "destination latitude is required"),
      destinationlng: z.string().min(1, "destination longitude is required"),
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


export const StartLocationSchema = {
  [RTTPType.INFORM]: z.object({}).strict(),
  [RTTPType.ACKN]: z
    .object({
      locationtoken: z.string().min(1, "location token is required"),
    })
    .strict(),
} satisfies OperationSchema;

export const LocationReportSchema = {
  [RTTPType.INFORM]: z
    .object({
      locationtoken: z.string().min(1, "location token is required"),
      driverid: z.string().min(1, "driver id is required"),
      driverlat: z.string().min(1, "driver latitude is required"),
      driverlng: z.string().min(1, "driver longitude is required"),
    })
    .strict(),
  [RTTPType.ACKN]: z.object({}).strict(),
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

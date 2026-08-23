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

import { z } from "zod";
import { ROLES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createFileSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const sendFileSchema = z.object({
  fileId: z.string().min(1, "Select a file to send"),
  toDepartmentId: z.string().min(1, "Select a destination department"),
  comment: z.string().max(500, "Comment must be 500 characters or fewer").optional().or(z.literal("")),
});

export const receiveFileSchema = z.object({
  fileId: z.string().min(1),
  comment: z.string().max(500).optional().or(z.literal("")),
});

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
];

export const userSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email address"),
    role: z.enum(ROLES),
    departmentId: z.string().min(1, "Select a department"),
    password: z.string().optional().or(z.literal("")),
  })
  .refine(
    (v) =>
      v.id
        ? (v.password ?? "").length === 0 || (v.password ?? "").length >= 8
        : (v.password ?? "").length >= 8,
    { message: "Password must be at least 8 characters", path: ["password"] }
  );

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be 10 characters or fewer")
    .regex(/^[A-Za-z]+$/, "Code must contain only letters")
    .transform((v) => v.toUpperCase()),
});
import { z } from "zod";

export const createFollowUpSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  callId: z.string().optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  notes: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).default("MEDIUM"),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).optional(),
});

export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;

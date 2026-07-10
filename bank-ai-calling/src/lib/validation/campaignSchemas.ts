import { z } from "zod";

export const newCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").min(3, "Name must be at least 3 characters"),
  aiPrompt: z.string().min(1, "AI prompt is required").min(20, "Prompt should be at least 20 characters — give the AI enough context"),
  language: z.enum(["en", "hi"]),
});

export type NewCampaignFormData = z.infer<typeof newCampaignSchema>;

export const settingsSchema = z.object({
  defaultAiPrompt: z.string().min(1, "Default AI prompt is required").min(20, "Prompt should be at least 20 characters"),
  defaultVoice: z.string().min(1, "Voice is required"),
  defaultLanguage: z.enum(["en", "hi"]),
  defaultRetryAttempts: z.coerce.number().int().min(0, "Cannot be negative").max(5, "Maximum 5 retry attempts"),
  businessHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format (e.g. 09:30)"),
  businessHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format (e.g. 18:00)"),
  webhookUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormOutput = z.output<typeof settingsSchema>;
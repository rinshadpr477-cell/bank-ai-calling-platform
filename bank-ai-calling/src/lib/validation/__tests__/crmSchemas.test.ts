import { createFollowUpSchema, updateFollowUpSchema } from "../crmSchemas";

describe("CRM Schemas Validation", () => {
  describe("createFollowUpSchema", () => {
    it("accepts a valid follow-up task payload", () => {
      const valid = {
        customerId: "cust-123",
        title: "Callback regarding EMI promise",
        dueDate: "2026-10-25T10:00:00.000Z",
        priority: "HIGH",
        notes: "Customer asked to verify bank statement",
      };
      const result = createFollowUpSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("HIGH");
        expect(result.data.title).toBe("Callback regarding EMI promise");
      }
    });

    it("defaults priority to MEDIUM when omitted", () => {
      const payload = {
        customerId: "cust-456",
        title: "Standard check-in",
        dueDate: "2026-10-26T12:00:00.000Z",
      };
      const result = createFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("MEDIUM");
      }
    });

    it("rejects when customerId is missing or empty", () => {
      const payload = {
        customerId: "",
        title: "Payment check",
        dueDate: "2026-10-26T12:00:00.000Z",
      };
      const result = createFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects when title is shorter than 2 characters", () => {
      const payload = {
        customerId: "cust-123",
        title: "A",
        dueDate: "2026-10-26T12:00:00.000Z",
      };
      const result = createFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority enum values", () => {
      const payload = {
        customerId: "cust-123",
        title: "Payment check",
        dueDate: "2026-10-26T12:00:00.000Z",
        priority: "URGENT_CRITICAL", // invalid
      };
      const result = createFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateFollowUpSchema", () => {
    it("accepts valid status updates", () => {
      const payload = { status: "COMPLETED" };
      const result = updateFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("COMPLETED");
      }
    });

    it("accepts valid rescheduled due date", () => {
      const payload = { dueDate: "2026-11-01T09:00:00.000Z" };
      const result = updateFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBe("2026-11-01T09:00:00.000Z");
      }
    });

    it("accepts updating notes and priority", () => {
      const payload = {
        notes: "Customer confirmed payment scheduled for 1st",
        priority: "LOW",
      };
      const result = updateFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("LOW");
        expect(result.data.notes).toContain("Customer confirmed");
      }
    });

    it("rejects invalid status enum", () => {
      const payload = { status: "ARCHIVED" };
      const result = updateFollowUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});

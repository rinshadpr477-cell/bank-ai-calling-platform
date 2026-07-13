import { loginSchema, registerSchema } from "../authSchemas";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid name, email, and strong password", () => {
    const result = registerSchema.safeParse({
      name: "Rinshad PR",
      email: "rinshad@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({
      name: "R",
      email: "rinshad@test.com",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Rinshad PR",
      email: "rinshad@test.com",
      password: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Rinshad PR",
      email: "rinshad@test.com",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no number", () => {
    const result = registerSchema.safeParse({
      name: "Rinshad PR",
      email: "rinshad@test.com",
      password: "Password",
    });
    expect(result.success).toBe(false);
  });
});
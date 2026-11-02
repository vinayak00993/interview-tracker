import { describe, it, expect } from "vitest";
import { opportunityUpdateSchema, interviewCreateSchema, contactCreateSchema, registerSchema, formatZodError } from "@/lib/validation";

describe("validation", () => {
  it("coerces form strings and clears fields with empty strings on update", () => {
    const r = opportunityUpdateSchema.parse({ compMin: "120", fitScore: "", tier: "2", remote: "false", jdLink: "" });
    expect(r.compMin).toBe(120);
    expect(r.fitScore).toBeNull();
    expect(r.tier).toBe(2);
    expect(r.remote).toBe(false);
    expect(r.jdLink).toBeNull();
  });

  it("rejects out-of-range and malformed values", () => {
    expect(opportunityUpdateSchema.safeParse({ fitScore: 101 }).success).toBe(false);
    expect(opportunityUpdateSchema.safeParse({ status: "bogus" }).success).toBe(false);
    expect(opportunityUpdateSchema.safeParse({ jdLink: "not a url" }).success).toBe(false);
    expect(interviewCreateSchema.safeParse({ opportunityId: "x", round: "" }).success).toBe(false);
    expect(contactCreateSchema.safeParse({ name: "A", email: "nope" }).success).toBe(false);
  });

  it("normalizes registration email", () => {
    const r = registerSchema.parse({ email: "  Me@Example.COM ", password: "password1", name: " Me " });
    expect(r.email).toBe("me@example.com");
    expect(r.name).toBe("Me");
  });

  it("formats errors briefly", () => {
    const result = registerSchema.safeParse({ email: "bad", password: "short", name: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(formatZodError(result.error)).toContain("email");
  });
});

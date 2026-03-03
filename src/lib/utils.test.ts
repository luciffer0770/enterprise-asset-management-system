import { describe, it, expect } from "vitest";
import { hasCapability } from "./permissions";

describe("hasCapability", () => {
  it("Admin has all capabilities", () => {
    expect(hasCapability("ADMIN", "tickets:approve")).toBe(true);
    expect(hasCapability("ADMIN", "assets:write")).toBe(true);
  });
  it("External has checkout (for ticket requests)", () => {
    expect(hasCapability("EXTERNAL", "checkout")).toBe(true);
  });
  it("Mechanical has workorders:write", () => {
    expect(hasCapability("MECHANICAL", "workorders:write")).toBe(true);
  });
});

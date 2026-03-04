import { describe, it, expect } from "vitest";
import { hasCapability } from "./permissions";

describe("hasCapability", () => {
  it("Admin has all capabilities", () => {
    expect(hasCapability("ADMIN", "integrations")).toBe(true);
    expect(hasCapability("ADMIN", "assets:write")).toBe(true);
  });
  it("External lacks checkout", () => {
    expect(hasCapability("EXTERNAL", "checkout")).toBe(false);
  });
  it("Mechanical has workorders:write", () => {
    expect(hasCapability("MECHANICAL", "workorders:write")).toBe(true);
  });
});

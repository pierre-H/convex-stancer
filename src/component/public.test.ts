import { test, expect } from "vitest";
import schema from "./schema.js";

test("component schema is defined", () => {
  expect(schema).toBeDefined();
});

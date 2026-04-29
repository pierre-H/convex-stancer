/// <reference types="vite/client" />
import { test } from "vitest";
import { convexTest } from "convex-test";
import {
  componentsGeneric,
  defineSchema,
  type GenericSchema,
  type SchemaDefinition,
} from "convex/server";

const modules = import.meta.glob("./**/*.*s");

export function initConvexTest<
  Schema extends SchemaDefinition<GenericSchema, boolean>,
>(schema?: Schema) {
  const t = convexTest(schema ?? defineSchema({}), modules);
  return t;
}

export const components = componentsGeneric() as unknown as {
  stancer: any;
};

test("setup", () => {});

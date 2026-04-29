/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * This file is checked in because the package ships Convex component typings.
 * Regenerate it from the current component modules when the public or private
 * component API changes.
 * @module
 */

import type * as private_ from "../private.js";
import type * as public_ from "../public.js";
import type {
  FunctionReference,
  RegisteredAction,
  RegisteredMutation,
  RegisteredQuery,
} from "convex/server";

type ConvertReturnType<T> = T extends Promise<infer Inner> ? Inner : T;

type FunctionReferenceFromExport<Export> =
  Export extends RegisteredQuery<infer Visibility, infer Args, infer ReturnValue>
    ? FunctionReference<
        "query",
        Visibility,
        Args,
        ConvertReturnType<ReturnValue>
      >
    : Export extends RegisteredMutation<
          infer Visibility,
          infer Args,
          infer ReturnValue
        >
      ? FunctionReference<
          "mutation",
          Visibility,
          Args,
          ConvertReturnType<ReturnValue>
        >
      : Export extends RegisteredAction<
            infer Visibility,
            infer Args,
            infer ReturnValue
          >
        ? FunctionReference<
            "action",
            Visibility,
            Args,
            ConvertReturnType<ReturnValue>
          >
        : never;

type FunctionReferencesInModule<Module extends Record<string, unknown>> = {
  [ExportName in keyof Module as Module[ExportName] extends {
    isConvexFunction: true;
  }
    ? ExportName
    : never]: FunctionReferenceFromExport<Module[ExportName]>;
};

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.stancer`.
 */
export type ComponentApi<
  Name extends string | undefined = string | undefined,
> = {
  private: FunctionReferencesInModule<typeof private_>;
  public: FunctionReferencesInModule<typeof public_>;
};

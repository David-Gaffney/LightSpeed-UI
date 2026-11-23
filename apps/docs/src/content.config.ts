import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsCollection, partialsCollection } from "@cloudflare/nimbus-docs/content";

const sharedSchemaFields = {
  audience: z.literal("human").optional(),
};

export const collections = {
  docs: defineCollection(
    docsCollection({
      schemaFields: sharedSchemaFields,
    }),
  ),
  origin: defineCollection(
    docsCollection({
      base: "origin",
      schemaFields: sharedSchemaFields,
    }),
  ),
  liftoff: defineCollection(
    docsCollection({
      base: "liftoff",
      schemaFields: sharedSchemaFields,
    }),
  ),
  landing: defineCollection(
    docsCollection({
      base: "landing",
      schemaFields: sharedSchemaFields,
    }),
  ),
  apogee: defineCollection(
    docsCollection({
      base: "apogee",
      schemaFields: sharedSchemaFields,
    }),
  ),
  partials: defineCollection(partialsCollection()),
};

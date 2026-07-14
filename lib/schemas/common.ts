import { z } from "zod";

/**
 * Shared enums and primitives. These are the single source of truth for the
 * string unions that also appear as Postgres enums / check constraints in the
 * migrations — keep the two in lockstep.
 */

export const planEnum = z.enum(["free", "pro"]);
export type Plan = z.infer<typeof planEnum>;

export const sourcePlatformEnum = z.enum([
  "youtube",
  "instagram",
  "tiktok",
  "web",
  "manual",
]);
export type SourcePlatform = z.infer<typeof sourcePlatformEnum>;

export const importStatusEnum = z.enum([
  "pending",
  "fetching",
  "analyzing",
  "review",
  "done",
  "failed",
]);
export type ImportStatus = z.infer<typeof importStatusEnum>;

/** Pipeline layers that contributed to an import (See/Listen/Read etc.). */
export const importLayerEnum = z.enum([
  "fetch",
  "frames",
  "transcript",
  "caption",
  "ocr",
]);
export type ImportLayer = z.infer<typeof importLayerEnum>;

export const bookStyleEnum = z.enum(["editorial", "rustic", "minimal"]);
export type BookStyle = z.infer<typeof bookStyleEnum>;

export const bookStatusEnum = z.enum(["draft", "ready", "ordered"]);
export type BookStatus = z.infer<typeof bookStatusEnum>;

export const contributorRoleEnum = z.enum(["owner", "contributor"]);
export type ContributorRole = z.infer<typeof contributorRoleEnum>;

export const orderStatusEnum = z.enum([
  "draft",
  "quoted",
  "submitted",
  "in_production",
  "shipped",
  "delivered",
  "failed",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

/**
 * Page templates the book builder auto-selects between. The system picks one
 * per recipe from content signals; users may override only within valid ones.
 */
export const pageTemplateEnum = z.enum([
  "full_bleed_photo",
  "photo_and_recipe",
  "text_only_recipe",
  "chapter_opener",
  "dedication",
  "toc",
]);
export type PageTemplate = z.infer<typeof pageTemplateEnum>;

/** UUID + timestamp helpers reused across row schemas. */
export const uuid = z.string().uuid();
export const isoTimestamp = z.string().datetime({ offset: true });

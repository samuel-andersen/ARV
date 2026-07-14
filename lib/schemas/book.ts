import { z } from "zod";
import {
  bookStatusEnum,
  bookStyleEnum,
  contributorRoleEnum,
  isoTimestamp,
  pageTemplateEnum,
  uuid,
} from "./common";

/** Book + chapter + membership schemas for the book builder. */

export const bookSchema = z.object({
  id: uuid,
  owner_id: uuid,
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).nullable(),
  style: bookStyleEnum.default("editorial"),
  /** e.g. "20x25" cm. Default trim is 20×25. */
  trim_size: z.string().max(16).default("20x25"),
  status: bookStatusEnum.default("draft"),
  cover_image: z.string().url().nullable(),
  dedication: z.string().max(2000).nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type Book = z.infer<typeof bookSchema>;

export const bookChapterSchema = z.object({
  id: uuid,
  book_id: uuid,
  position: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  intro_text: z.string().max(2000).nullable(),
  intro_image: z.string().url().nullable(),
});
export type BookChapter = z.infer<typeof bookChapterSchema>;

export const bookRecipeSchema = z.object({
  chapter_id: uuid,
  recipe_id: uuid,
  position: z.number().int().nonnegative(),
  /** User override, only ever set to another *valid* template for the content. */
  template_override: pageTemplateEnum.nullable(),
});
export type BookRecipe = z.infer<typeof bookRecipeSchema>;

export const bookContributorSchema = z.object({
  book_id: uuid,
  user_id: uuid.nullable(),
  role: contributorRoleEnum,
  invited_email: z.string().email().nullable(),
  accepted_at: isoTimestamp.nullable(),
});
export type BookContributor = z.infer<typeof bookContributorSchema>;

export const bookExportSchema = z.object({
  id: uuid,
  book_id: uuid,
  pdf_url: z.string().url(),
  page_count: z.number().int().min(24).max(200),
  generated_at: isoTimestamp,
});
export type BookExport = z.infer<typeof bookExportSchema>;

/* ---- Form inputs ---- */

export const bookInputSchema = z.object({
  title: z.string().min(1, "Give the book a title").max(200),
  subtitle: z.string().max(200).nullable().default(null),
  style: bookStyleEnum.default("editorial"),
  trim_size: z.string().max(16).default("20x25"),
  dedication: z.string().max(2000).nullable().default(null),
});
export type BookInput = z.infer<typeof bookInputSchema>;

export const chapterInputSchema = z.object({
  title: z.string().min(1, "Chapter needs a title").max(200),
  intro_text: z.string().max(2000).nullable().default(null),
});
export type ChapterInput = z.infer<typeof chapterInputSchema>;

export const contributorInviteSchema = z.object({
  book_id: uuid,
  invited_email: z.string().email("Enter a valid email"),
});
export type ContributorInvite = z.infer<typeof contributorInviteSchema>;

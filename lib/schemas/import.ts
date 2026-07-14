import { z } from "zod";
import {
  importLayerEnum,
  importStatusEnum,
  isoTimestamp,
  uuid,
} from "./common";

/** Import job schemas — the async pipeline's state record. */

export const importJobSchema = z.object({
  id: uuid,
  user_id: uuid,
  source_url: z.string().url().nullable(),
  status: importStatusEnum.default("pending"),
  layers_used: z.array(importLayerEnum).default([]),
  raw_caption: z.string().nullable(),
  transcript: z.string().nullable(),
  error: z.string().nullable(),
  created_at: isoTimestamp,
});
export type ImportJob = z.infer<typeof importJobSchema>;

/** What a client submits to start an import. Exactly one input is required. */
export const importRequestSchema = z
  .object({
    source_url: z.string().url().nullable().default(null),
    raw_text: z.string().max(20000).nullable().default(null),
    /** Uploaded screenshot object paths in Storage (OCR path). */
    screenshot_paths: z.array(z.string()).default([]),
  })
  .refine(
    (v) => !!v.source_url || !!v.raw_text || v.screenshot_paths.length > 0,
    { message: "Provide a URL, pasted text, or at least one screenshot." },
  );
export type ImportRequest = z.infer<typeof importRequestSchema>;

/** Share-target payload from the PWA manifest (Share → Arv). */
export const shareTargetSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
});
export type ShareTarget = z.infer<typeof shareTargetSchema>;

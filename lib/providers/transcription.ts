import { withRetry } from "@/lib/providers/resilience";

/**
 * TranscriptionProvider — the swappable seam for the "Listen" layer.
 * Whisper is the default target, but the interface keeps it replaceable.
 */

export interface TranscriptionResult {
  text: string;
  /** BCP-47 language tag if detected. */
  language: string | null;
  /** Provider confidence 0–1, when available. */
  confidence: number | null;
}

export interface TranscriptionProvider {
  readonly id: string;
  /**
   * Transcribe audio referenced by URL or storage path. Returns null when the
   * audio couldn't be reached — the pipeline degrades to caption/OCR rather
   * than failing.
   */
  transcribe(audioRef: string): Promise<TranscriptionResult | null>;
  healthCheck(): Promise<boolean>;
}

/** Default stub used until a real Whisper adapter is wired in the import phase. */
export class StubTranscriptionProvider implements TranscriptionProvider {
  readonly id = "stub";

  async transcribe(): Promise<TranscriptionResult | null> {
    return null;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/* ------------------------------------------------------------------ */
/* OpenAI Whisper — download the media by URL and transcribe it.        */
/* ------------------------------------------------------------------ */

const WHISPER_MAX_BYTES = 24 * 1024 * 1024; // OpenAI hard limit is 25 MB

export class WhisperTranscriptionProvider implements TranscriptionProvider {
  readonly id = "whisper";

  async transcribe(audioRef: string): Promise<TranscriptionResult | null> {
    const key = process.env.OPENAI_API_KEY;
    if (!key || !/^https?:\/\//.test(audioRef)) return null;
    try {
      const media = await withRetry(
        async (signal) => {
          const res = await fetch(audioRef, { signal });
          if (!res.ok) throw new Error(`media HTTP ${res.status}`);
          return res;
        },
        { attempts: 2, timeoutMs: 30000 },
      );
      const buf = new Uint8Array(await media.arrayBuffer());
      if (buf.byteLength > WHISPER_MAX_BYTES) return null; // too large to send

      const type = media.headers.get("content-type") ?? "video/mp4";
      const ext = type.includes("audio") ? "m4a" : "mp4";
      const form = new FormData();
      form.append("file", new Blob([buf], { type }), `clip.${ext}`);
      form.append("model", process.env.WHISPER_MODEL ?? "whisper-1");

      const out = await withRetry(
        async (signal) => {
          const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            signal,
            headers: { authorization: `Bearer ${key}` },
            body: form,
          });
          if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
          return (await res.json()) as { text?: string; language?: string };
        },
        { attempts: 2, timeoutMs: 120000 },
      );

      const text = out.text?.trim();
      return text ? { text, language: out.language ?? null, confidence: null } : null;
    } catch {
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }
}

export function getTranscriptionProvider(): TranscriptionProvider {
  switch (process.env.TRANSCRIPTION_PROVIDER) {
    case "whisper":
      return new WhisperTranscriptionProvider();
    default:
      return new StubTranscriptionProvider();
  }
}

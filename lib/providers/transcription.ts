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

export function getTranscriptionProvider(): TranscriptionProvider {
  switch (process.env.TRANSCRIPTION_PROVIDER) {
    // case "whisper": return new WhisperTranscriptionProvider();  // import phase
    default:
      return new StubTranscriptionProvider();
  }
}

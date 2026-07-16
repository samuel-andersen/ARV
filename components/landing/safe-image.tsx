"use client";

import { useState } from "react";

/**
 * A food image that never breaks trust: if the photo fails to load, it fades
 * to a calm Salvie surface with the wordmark instead of showing a broken-image
 * icon. Fills its (relatively positioned) parent — same role as an
 * absolute-inset cover image.
 */
export function SafeImage({
  src,
  alt,
  label = "Arv",
  labelClassName = "serif text-2xl font-light text-gran/50",
}: {
  src: string;
  alt: string;
  label?: string;
  labelClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-salvie">
        <span className={labelClassName}>{label}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

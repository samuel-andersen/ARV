/**
 * Tiny haptic helpers. The Vibration API is a no-op on iOS Safari today, but
 * fires on Android and installed PWAs — so this degrades silently and never
 * throws. Keep pulses short; native taps are 8–15ms, confirmations a touch
 * longer.
 */
type VibrateNavigator = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

function buzz(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  try {
    (navigator as VibrateNavigator).vibrate?.(pattern);
  } catch {
    /* unsupported — ignore */
  }
}

/** A light tap — nav changes, selections, toggles. */
export const tapHaptic = () => buzz(8);
/** A confirmation — save, add, success. */
export const okHaptic = () => buzz([12, 40, 12]);
/** A timer/alert — cook mode timer done. */
export const alertHaptic = () => buzz([200, 100, 200]);

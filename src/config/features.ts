/**
 * Product feature flags for capabilities whose backend isn't real yet. A flag
 * here hides the entry points; it never swaps in fabricated data.
 */
export const features = {
  /**
   * Photo meal recognition. Off until POST /nutrition/recognize has a real
   * provider — today it is a stub that returns no items (see
   * BACKEND_API_REQUIREMENTS.txt), and there is no on-device vision model.
   */
  photoMealRecognition: false,
} as const;

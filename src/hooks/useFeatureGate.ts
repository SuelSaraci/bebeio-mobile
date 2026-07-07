import { useCallback } from 'react';
import type { FeatureLimitKey } from '../lib/plans';

/**
 * Opens the add form immediately. Free-tier limits are enforced on save,
 * not when tapping + Add (upgrade redirect runs when the save is blocked).
 */
export function useFeatureGate() {
  const gateAdd = useCallback(
    (_currentCount: number, _feature: FeatureLimitKey, onAllowed: () => void) => {
      onAllowed();
    },
    [],
  );

  const handleAddSaveResult = useCallback(
    (
      ok: boolean | undefined,
      _feature: FeatureLimitKey,
      closeForm: () => void,
      onSuccess?: () => void,
    ): 'blocked' | 'success' | 'failed' => {
      if (ok === false) {
        closeForm();
        return 'blocked';
      }
      if (ok) {
        onSuccess?.();
        return 'success';
      }
      return 'failed';
    },
    [],
  );

  return { gateAdd, handleAddSaveResult };
}

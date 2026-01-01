/**
 * useTerminology Hook
 *
 * Provides easy access to UI terminology based on user's language mode preference.
 * Returns the appropriate terminology set (tactical or standard) based on user settings.
 *
 * Usage:
 *   const t = useTerminology();
 *   <h1>{t.dashboard}</h1> // "Command Center" or "Dashboard"
 *   <button>{t.save}</button> // "Confirm" or "Save"
 *
 * The hook automatically reads from user settings and provides the correct terms.
 */

import { useMemo } from 'react';
import { getTerminology, type LanguageMode, type TerminologySet } from '../constants/terminology';

/**
 * Hook to get current terminology based on user settings
 * @param languageMode - Optional override for language mode (useful for testing)
 * @returns TerminologySet with all UI terms in the selected language
 */
export function useTerminology(languageMode?: LanguageMode): TerminologySet {
  // In a real implementation, you'd read from user settings context
  // For now, we'll default to 'standard' and allow override
  // TODO: Read from UserSettings context when implemented
  const mode = languageMode || 'standard';

  return useMemo(() => getTerminology(mode), [mode]);
}

/**
 * Hook variant that accepts user settings directly
 * Use this when you have access to the settings object
 *
 * Usage:
 *   const t = useTerminologyWithSettings(settings);
 */
export function useTerminologyWithSettings(settings?: { languageMode?: LanguageMode }): TerminologySet {
  const mode = settings?.languageMode || 'standard';
  return useMemo(() => getTerminology(mode), [mode]);
}

/**
 * Terminology Context Provider
 *
 * Provides app-wide access to terminology based on user's language mode setting.
 * Wrap your app with <TerminologyProvider> to enable terminology access in any component.
 *
 * Usage:
 *   // In App.tsx
 *   <TerminologyProvider languageMode={settings.languageMode}>
 *     <YourApp />
 *   </TerminologyProvider>
 *
 *   // In any component
 *   const t = useTerminology();
 *   <h1>{t.dashboard}</h1>
 */

import React, { createContext, useContext, useMemo } from 'react';
import { getTerminology, type LanguageMode, type TerminologySet } from '../constants/terminology';

interface TerminologyContextValue {
  t: TerminologySet;
  languageMode: LanguageMode;
}

const TerminologyContext = createContext<TerminologyContextValue | undefined>(undefined);

interface TerminologyProviderProps {
  languageMode?: LanguageMode;
  children: React.ReactNode;
}

export function TerminologyProvider({ languageMode = 'standard', children }: TerminologyProviderProps) {
  const value = useMemo<TerminologyContextValue>(
    () => ({
      t: getTerminology(languageMode),
      languageMode,
    }),
    [languageMode]
  );

  return (
    <TerminologyContext.Provider value={value}>
      {children}
    </TerminologyContext.Provider>
  );
}

/**
 * Hook to access terminology from context
 * Returns the terminology set based on user's language mode preference
 */
export function useTerminology(): TerminologySet {
  const context = useContext(TerminologyContext);

  if (!context) {
    // Fallback to standard if used outside provider
    console.warn('useTerminology used outside TerminologyProvider, defaulting to standard mode');
    return getTerminology('standard');
  }

  return context.t;
}

/**
 * Hook to get both terminology and current language mode
 */
export function useTerminologyContext(): TerminologyContextValue {
  const context = useContext(TerminologyContext);

  if (!context) {
    console.warn('useTerminologyContext used outside TerminologyProvider, defaulting to standard mode');
    return {
      t: getTerminology('standard'),
      languageMode: 'standard',
    };
  }

  return context;
}

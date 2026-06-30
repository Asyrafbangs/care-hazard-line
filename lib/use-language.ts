"use client";

import { useCallback, useEffect, useState } from "react";
import type { LanguageCode } from "@/types/domain";

const STORAGE_KEY = "care-language";
const VALID: LanguageCode[] = ["en", "ms", "ne", "my", "bn"];

/**
 * Reads the reporter's saved language from localStorage and persists changes.
 * `firstVisit` is true when no language has been chosen yet, so callers can
 * highlight the selector for first-time visitors.
 */
export function useSavedLanguage(): {
  language: LanguageCode;
  setLanguage: (next: LanguageCode) => void;
  firstVisit: boolean;
} {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && VALID.includes(saved)) {
        setLanguageState(saved);
      } else {
        setFirstVisit(true);
      }
    } catch {
      // localStorage may be unavailable; default to English.
    }
  }, []);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    setFirstVisit(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  return { language, setLanguage, firstVisit };
}

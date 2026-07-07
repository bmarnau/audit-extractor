/**
 * GDPR Consent Management
 * Handles user consent for data collection and processing
 */

import { useEffect, useState, useCallback } from 'react';

export interface GDPRConsent {
  analytics: boolean;
  personalData: boolean;
  consentedAt: string;
  consentVersion: string;
}

const CONSENT_KEY = 'audit-safe:gdpr-consent';
const CONSENT_VERSION = '1.0';

export function useGDPRConsent() {
  const [consent, setConsent] = useState<GDPRConsent | null>(null);
  const [hasConsented, setHasConsented] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        setHasConsented(true);
      } catch (error) {
        console.error('Failed to parse consent:', error);
      }
    }
  }, []);

  /**
   * Save consent
   */
  const giveConsent = useCallback((options: { analytics?: boolean; personalData?: boolean }) => {
    const newConsent: GDPRConsent = {
      analytics: options.analytics ?? false,
      personalData: options.personalData ?? false,
      consentedAt: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setHasConsented(true);

    // Log consent event
    console.info('GDPR Consent given', { options });

    return newConsent;
  }, []);

  /**
   * Revoke consent
   */
  const revokeConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsent(null);
    setHasConsented(false);
    console.info('GDPR Consent revoked');
  }, []);

  /**
   * Check if specific consent is given
   */
  const hasConsent = useCallback((consentType: keyof GDPRConsent): boolean => {
    if (!consent) return false;
    return consent[consentType] === true;
  }, [consent]);

  return {
    consent,
    hasConsented,
    giveConsent,
    revokeConsent,
    hasConsent,
  };
}

export default useGDPRConsent;

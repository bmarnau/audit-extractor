/**
 * GDPR Consent Banner Component
 * Displays consent management UI
 */

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Link,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useGDPRConsent } from '@/hooks/useGDPRConsent';

export interface GDPRConsentBannerProps {
  onConsentChange?: (consentGiven: boolean) => void;
}

/**
 * GDPR Consent Banner
 * Shows consent options and manages user preferences
 */
export const GDPRConsentBanner: React.FC<GDPRConsentBannerProps> = ({ onConsentChange }) => {
  const { hasConsented, consent, giveConsent, revokeConsent } = useGDPRConsent();
  const [showDetails, setShowDetails] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(consent?.analytics ?? false);
  const [personalData, setPersonalData] = React.useState(consent?.personalData ?? false);

  // Don't show banner if already consented
  if (hasConsented) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              ✓ Data collection and processing preferences are set
            </Typography>
            <Button
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </Box>

          <Collapse in={showDetails} sx={{ mt: 2 }}>
            <Box sx={{ pl: 2, borderLeft: '2px solid #1976d2' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Current Preferences:</strong>
              </Typography>
              <Typography variant="body2">
                • Analytics: {consent?.analytics ? '✓ Enabled' : '✗ Disabled'}
              </Typography>
              <Typography variant="body2">
                • Personal Data Processing: {consent?.personalData ? '✓ Enabled' : '✗ Disabled'}
              </Typography>
              <Button
                size="small"
                color="warning"
                onClick={revokeConsent}
                sx={{ mt: 1 }}
              >
                Revoke Consent
              </Button>
            </Box>
          </Collapse>
        </Alert>
      </Box>
    );
  }

  // Show consent request banner
  return (
    <Card sx={{ mb: 2, backgroundColor: '#f5f5f5' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📋 Data Collection & Processing
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          We collect data to improve extraction accuracy and provide feedback-driven learning.
          Your consent is required to process personal data (email addresses) for improvement suggestions.
        </Typography>

        {/* Consent Options */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Analytics & Performance Metrics
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Track extraction accuracy and suggest improvements
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={personalData}
                onChange={(e) => setPersonalData(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Personal Data Processing (Email)
                </Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Store email address for feedback attribution (optional)
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Privacy Policy Link */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            By clicking "Accept", you agree to our{' '}
            <Link href="/privacy" target="_blank" rel="noopener">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/gdpr" target="_blank" rel="noopener">
              GDPR Compliance Notice
            </Link>
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => {
              giveConsent({ analytics: false, personalData: false });
              onConsentChange?.(true);
            }}
          >
            Decline All
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              giveConsent({ analytics, personalData });
              onConsentChange?.(true);
            }}
          >
            Accept Selected
          </Button>
        </Box>

        {/* Data Rights Notice */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="caption">
            <strong>Your Rights:</strong> You can request data deletion, access your data export,
            or update preferences anytime.{' '}
            <Link href="/gdpr-rights" target="_blank" rel="noopener">
              Learn more
            </Link>
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GDPRConsentBanner;

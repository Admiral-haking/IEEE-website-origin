"use client";

import React from 'react';
import LoginForm from './components/LoginForm';
import OtpLogin from './components/OtpLogin';
import { Alert, Box, Stack, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  verificationStatus?: 'success' | 'already';
  verificationError?: 'invalid' | 'expired' | 'missing';
  redirectTo: string;
};

export default function SigninView({ verificationStatus, verificationError, redirectTo }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState(0);
  const successMsg =
    verificationStatus === 'success'
      ? (t('email_verify_success') as string) || ''
      : verificationStatus === 'already'
      ? (t('email_verify_already') as string) || ''
      : '';
  let errorMsg = '';
  if (verificationError === 'expired') errorMsg = (t('email_verify_expired') as string) || '';
  else if (verificationError === 'missing') errorMsg = (t('email_verify_missing') as string) || '';
  else if (verificationError === 'invalid') errorMsg = (t('email_verify_invalid') as string) || '';
  return (
    <Box>
      <Stack gap={2} sx={{ mb: 2 }}>
        {(successMsg || errorMsg) && (
          <Alert severity={successMsg ? 'success' : 'error'}>
            {successMsg || errorMsg}
          </Alert>
        )}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('sign_in') as string} />
          <Tab label={t('login_with_phone') || 'Login with phone'} />
        </Tabs>
      </Stack>
      {tab === 0 ? <LoginForm redirectTo={redirectTo} /> : <OtpLogin redirectTo={redirectTo} />}
    </Box>
  );
}

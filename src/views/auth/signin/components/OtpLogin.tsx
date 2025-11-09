"use client";

import React from 'react';
import { Box, Button, Stack, TextField, Alert } from '@mui/material';
import useAxios from 'axios-hooks';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslation } from 'react-i18next';

type Props = { redirectTo: string };

export default function OtpLogin({ redirectTo }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? parts[0] : 'en';
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [left, setLeft] = React.useState(0);
  const [{ error: reqErr }, requestOtp] = useAxios({ url: '/api/auth/otp/request', method: 'POST' }, { manual: true });
  const [{ error: verifyErr }, verifyOtp] = useAxios({ url: '/api/auth/otp/verify', method: 'POST' }, { manual: true });
  const isRtl = locale === 'fa';

  const onRequest = async () => {
    if (left > 0) return;
    const res: any = await requestOtp({ data: { phone } });
    const retry = Number(res?.response?.headers?.['retry-after'] || res?.response?.headers?.['Retry-After'] || 60);
    setLeft(retry);
  };
  React.useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [left]);

  const onVerify = async () => {
    const res: any = await verifyOtp({ data: { phone, code } });
    if ((res?.status || res?.response?.status) === 200) {
      const href = (redirectTo || `/${locale}/panel`) as Route;
      router.push(href);
    }
  };

  return (
    <Box>
      <Stack gap={1.5}>
        {reqErr && <Alert severity="error">{t('too_many_attempts')}</Alert>}
        {verifyErr && <Alert severity="error">{t('invalid_credentials')}</Alert>}
        <TextField
          label={t('phone_label') || 'Phone'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09xxxxxxxxx"
          sx={{ '& .MuiOutlinedInput-input': { px: 2 } }}
          InputLabelProps={isRtl ? { sx: { left: 'auto', right: 16, transformOrigin: 'right top', textAlign: 'right' } } : { sx: { left: 16, transformOrigin: 'left top' } }}
        />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onRequest} disabled={left > 0}>{left > 0 ? `${left}s` : (t('send_code') || 'Send code')}</Button>
        </Stack>
        <TextField
          label={t('code_label') || 'Code'}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ '& .MuiOutlinedInput-input': { px: 2 } }}
          InputLabelProps={isRtl ? { sx: { left: 'auto', right: 16, transformOrigin: 'right top', textAlign: 'right' } } : { sx: { left: 16, transformOrigin: 'left top' } }}
        />
        <Button variant="contained" color="secondary" onClick={onVerify}>{t('verify_code') || 'Verify'}</Button>
      </Stack>
    </Box>
  );
}

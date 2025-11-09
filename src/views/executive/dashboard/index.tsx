"use client";

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Paper, Stack, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';
import useLocale from '@/hooks/useLocale';
import { hasPermission } from '@/constants/permissions';

const allowAll = () => true;

export default function ExecutiveDashboardView() {
  const locale = useLocale();
  const { t } = useTranslation();

  // Minimal KPIs for executive
  const [{ data: me }] = useAxios({ url: '/api/auth/me', validateStatus: allowAll });
  const name = me?.user?.name || me?.user?.email || '';

  const [{ data: apps }, execApps] = useAxios({ method: 'GET' }, { manual: true });
  const [{ data: msgs }, execMsgs] = useAxios({ method: 'GET' }, { manual: true });

  const role = (me?.user?.role === 'professor' ? 'executive' : me?.user?.role === 'user' ? 'member' : me?.user?.role) || 'member';
  const isExecutive = role === 'executive' || role === 'admin';
  const permissions = (me?.user as any)?.permissions || {};
  const canMembership = isExecutive || hasPermission(permissions, 'operations.membership');
  const canContact = isExecutive || hasPermission(permissions, 'operations.contact');

  React.useEffect(() => {
    if (canMembership) {
      try { execApps({ url: '/api/membership', params: { status: 'pending', page: 1, pageSize: 1 } }); } catch {}
    }
    if (canContact) {
      try { execMsgs({ url: '/api/contact-messages', params: { resolved: 'false', page: 1, pageSize: 1 } }); } catch {}
    }
  }, [canMembership, canContact, execApps, execMsgs]);

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Stack>
            <Typography variant="h6" fontWeight={800}>{name}</Typography>
            <Typography variant="body2" color="text.secondary">{t('nav_dashboard_sub') || 'Overview & KPIs'}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {canMembership && <Button component={NextLink} href={`/${locale}/executive/membership`} variant="outlined" size="small">{t('membership') as any || 'Membership'}</Button>}
            {canContact && <Button component={NextLink} href={`/${locale}/executive/contact-messages`} variant="outlined" size="small">{t('messages') as any || 'Messages'}</Button>}
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {canMembership && (
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{t('pending') as any || 'Pending applications'}</Typography>
              <Typography variant="h6" fontWeight={700}>{apps?.total ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        )}
        {canContact && (
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{t('unresolved') as any || 'Unresolved messages'}</Typography>
              <Typography variant="h6" fontWeight={700}>{msgs?.total ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        )}
      </Grid>
    </Box>
  );
}

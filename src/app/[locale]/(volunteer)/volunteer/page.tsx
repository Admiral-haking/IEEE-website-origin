"use client";
import React from 'react';
import { Container, Paper, Stack, Typography, Button, Chip, List, ListItem, ListItemText, Divider, LinearProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import NextLink from 'next/link';
import useLocale from '@/hooks/useLocale';
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';
import { hasPermission, EXECUTIVE_AREA_PERMISSIONS } from '@/constants/permissions';

export default function VolunteerDashboardPage() {
  const locale = useLocale();
  const allowAll = React.useCallback(() => true, []);
  const meCfg = React.useMemo(() => ({ url: '/api/auth/me', validateStatus: allowAll }), [allowAll]);
  const [{ data: me }] = useAxios(meCfg);
  const isFa = (typeof window === 'undefined' ? false : window.location.pathname.split('/').filter(Boolean)[0] === 'fa');
  const name = (isFa ? ((me?.user as any)?.full_name || me?.user?.name) : (me?.user?.name || (me?.user as any)?.full_name)) || me?.user?.email || '';
  const email = me?.user?.email || '';
  const status: string | undefined = (me?.user as any)?.membership_status;
  const { t } = useTranslation();
  const [{ data: notif }, execNotif] = useAxios({ url: '/api/notifications', params: { unread: 'true', limit: 5 } }, { manual: true });
  const [, patchRead] = useAxios({ url: '/api/notifications/read', method: 'PATCH' }, { manual: true });
  const [{ data: events }, execEvents] = useAxios({ url: '/api/events', params: { page: 1, pageSize: 3 } }, { manual: true });
  const [, applyMembership] = useAxios({ url: '/api/membership', method: 'POST' }, { manual: true });
  const [{ loading: resendLoading }, resendVerify] = useAxios({ url: '/api/auth/verify/resend', method: 'POST' }, { manual: true });
  const [resendMsg, setResendMsg] = React.useState<string | null>(null);

  const onApply = async () => {
    try { await applyMembership({ data: { form: { name, email } } }); } catch {}
  };
  const onMarkAll = async () => { try { await patchRead({ data: {} }); } catch {} };
  React.useEffect(() => {
    if (!me?.user) return;
    void execNotif().catch(() => {});
    void execEvents().catch(() => {});
  }, [!!me?.user, execNotif, execEvents]);
  const completionPercent = React.useMemo(() => {
    const u = (me?.user || {}) as any;
    const checks: Array<[any, (v: any) => boolean]> = [
      [u.name, (v) => !!v],
      [u.full_name, (v) => !!v],
      [u.username, (v) => !!v],
      [u.phone, (v) => !!v],
      [u.student_id, (v) => !!v],
      [u.major, (v) => !!v],
      [u.degree, (v) => !!v],
      [u.bio, (v) => (v || '').length >= 10],
      [u.profile_picture, (v) => !!v],
      [u.social_links, (v) => Array.isArray(v) && v.length > 0],
      [u.projects, (v) => Array.isArray(v) && v.length > 0],
      [u.certificates, (v) => Array.isArray(v) && v.length > 0],
    ];
    const total = checks.length;
    const ok = checks.reduce((acc, [val, fn]) => acc + (fn(val) ? 1 : 0), 0);
    return Math.round((ok / total) * 100);
  }, [me]);

  const permissions = (me?.user as any)?.permissions || {};
  const rawRole = (me?.user?.role as string) || 'member';
  const normalizedRole = rawRole === 'professor' ? 'executive' : rawRole === 'user' ? 'member' : rawRole;
  const canAccessExecutive = normalizedRole === 'executive' || normalizedRole === 'admin' || EXECUTIVE_AREA_PERMISSIONS.some((key) => hasPermission(permissions, key));

  return (
    <Container sx={{ py: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack>
                <Typography variant="h6" fontWeight={800}>{name}</Typography>
                <Typography variant="body2" color="text.secondary">{t('volunteer_panel_title') || 'Volunteer panel'}</Typography>
                {status && <Chip size="small" label={`${t('membership')}: ${status}`} sx={{ mt: 1, alignSelf: 'flex-start' }} />}
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button component={NextLink} href={`/${locale}/profile`} variant="outlined" size="small">{t('profile')}</Button>
                {canAccessExecutive && (
                  <Button component={NextLink} href={`/${locale}/executive`} variant="outlined" size="small">{t('executive_tools') || 'Executive tools'}</Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>{t('unread_notifications') || 'Unread notifications'}</Typography>
              <Button size="small" onClick={onMarkAll}>{t('mark_all_read')}</Button>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {(notif?.items || []).length === 0 && (
                <ListItem><ListItemText primary={t('no_notifications') as any} /></ListItem>
              )}
              {(notif?.items || []).map((n: any) => (
                <ListItem key={n.id}>
                  <ListItemText primary={n.title} secondary={n.body} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('membership')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('current_status') || 'Current status'}: {status || '—'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
              {status !== 'active' && <Button size="small" variant="contained" onClick={onApply}>{t('apply_membership')}</Button>}
              <Button size="small" variant="outlined" component={NextLink} href={`/${locale}/profile`}>{t('edit_info') || 'Edit info'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('profile_completion')}</Typography>
            <Stack gap={1}>
              <LinearProgress variant="determinate" value={completionPercent} />
              <Typography variant="caption" color="text.secondary">{t('percent_complete', { p: completionPercent }) || `${completionPercent}% complete`}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button size="small" variant="outlined" component={NextLink} href={`/${locale}/profile`}>ویرایش پروفایل</Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('email_verification') || 'Email verification'}</Typography>
            {(me?.user as any)?.emailVerified === false ? (
              <Stack gap={1}>
                {resendMsg && <Alert severity="success" onClose={() => setResendMsg(null)}>{resendMsg}</Alert>}
                <Typography variant="body2" color="text.secondary">{t('email_not_verified_dashboard_hint') as any}</Typography>
                <Button size="small" variant="contained" disabled={resendLoading} onClick={async () => {
                  try { await resendVerify({ data: { email, locale: (email?.includes('.ir') ? 'fa' : 'en') } }); setResendMsg(String(t('resend_verification_success'))); } catch {}
                }}>{t('resend_verification')}</Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">{t('email_verified_ok') || 'Your email is verified.'}</Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('tasks_suggestions') || 'Tasks/Suggestions'}</Typography>
            <List dense>
              {(events?.items || []).length === 0 && (
                <ListItem><ListItemText primary={t('no_items') as any} /></ListItem>
              )}
              {(events?.items || []).map((e: any) => (
                <ListItem key={e.id} component={NextLink} href={`/${locale}/events`}>
                  <ListItemText primary={e.title || 'رویداد'} secondary={(e as any)?.createdAt ? new Date((e as any).createdAt).toLocaleDateString() : ''} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('quick_content_links') || 'Quick content links'}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button size="small" variant="outlined" component={NextLink} href={`/${locale}/solutions`}>{t('projects')}</Button>
              <Button size="small" variant="outlined" component={NextLink} href={`/${locale}/blog`}>{t('blog')}</Button>
              <Button size="small" variant="outlined" component={NextLink} href={`/${locale}/media`}>{t('media')}</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

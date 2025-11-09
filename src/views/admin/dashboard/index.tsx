"use client";

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Alert, Box, Paper, Stack, Typography, Chip, Avatar, TextField, MenuItem, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Grid from '@mui/material/Grid';
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';
import useLocale from '@/hooks/useLocale';
const allowAll = () => true;

export default function AdminDashboardView() {
  const locale = useLocale();
  const [{ data: me }] = useAxios({ url: '/api/auth/me', validateStatus: allowAll });
  const rawRole: 'member'|'volunteer'|'executive'|'admin'|'user'|'professor' = me?.user?.role || 'member';
  const userRole = rawRole === 'professor' ? 'executive' : rawRole === 'user' ? 'member' : rawRole;
  const isAdmin = userRole === 'admin';
  const [{ data, error }, refetchHealth] = useAxios({ url: '/api/_ops/health', validateStatus: allowAll }, { manual: false });
  // Optional: if you want to refresh after admin visibility, keep a one-shot refresh
  React.useEffect(() => {
    if (!isAdmin) return;
    try { (refetchHealth as any)(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);
  const { t } = useTranslation();
  const [filterRole, setFilterRole] = React.useState<string>('');
  const [filterStatus, setFilterStatus] = React.useState<string>('');
  // useAxios will auto-refetch when params change; avoid effect loops that
  // can happen if we depend on a changing refetch function identity.
  const [{ data: stats, error: statsError }] = useAxios({ url: '/api/admin/stats', params: { role: filterRole || undefined, status: filterStatus || undefined, days: 14 } }, { manual: false });
  const isExecutive = userRole === 'executive' || userRole === 'admin';
  const [{ data: apps }, execApps] = useAxios({ method: 'GET' }, { manual: true });
  const [{ data: msgs }, execMsgs] = useAxios({ method: 'GET' }, { manual: true });
  React.useEffect(() => {
    if (!isExecutive) return;
    void execApps({ url: '/api/membership', params: { status: 'pending', page: 1, pageSize: 1 } }).catch(() => {});
    void execMsgs({ url: '/api/contact-messages', params: { resolved: 'false', page: 1, pageSize: 1 } }).catch(() => {});
  }, [isExecutive, execApps, execMsgs]);
  const name = (locale === 'fa'
    ? ((me?.user as any)?.full_name || me?.user?.name)
    : (me?.user?.name || (me?.user as any)?.full_name)) || me?.user?.email || '';
  const email = me?.user?.email || '';
  const membership: string = (me?.user as any)?.membership_status || '';
  const roleKey = userRole === 'admin' ? 'user_role_admin' : userRole === 'executive' ? 'user_role_executive' : userRole === 'volunteer' ? 'user_role_volunteer' : 'user_role_member';
  const roleLabel = t(roleKey);
  const roleColor: 'default'|'success'|'warning'|'error'|'info' = userRole === 'admin' ? 'error' : userRole === 'executive' ? 'info' : userRole === 'member' ? 'success' : 'warning';
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState(name);
  const [editUsername, setEditUsername] = React.useState((me?.user as any)?.username || '');
  const [editPhone, setEditPhone] = React.useState((me?.user as any)?.phone || '');
  const [, patchUser] = useAxios({ method: 'PATCH' }, { manual: true });
  const onQuickSave = async () => {
    try {
      if (!me?.user?.id) return;
      if (isAdmin) {
        await patchUser({ url: `/api/users/${me.user.id}`, data: { name: editName, username: editUsername, phone: editPhone } });
      } else {
        await patchUser({ url: `/api/auth/me`, data: { name: editName, username: editUsername, phone: editPhone } });
      }
      setEditOpen(false);
    } catch {}
  };
  const makeCsv = React.useCallback(() => {
    const rows = [['date','login','chat'], ...(stats?.daily || []).map((d: any) => [d.d, d.login, d.chat])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'activity.csv'; a.click(); URL.revokeObjectURL(url);
  }, [stats]);

  // Countdown to next day reset (local time)
  const [resetSec, setResetSec] = React.useState<number>(0);
  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
      setResetSec(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const x = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(x)}`;
  };

  const Sparkline = ({ data, color = '#1976d2' }: { data: number[]; color?: string }) => {
    const w = 160, h = 40; const max = Math.max(1, ...data); const min = Math.min(0, ...data);
    const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const dAttr = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i*step} ${norm(v)}`).join(' ');
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="sparkline">
        <path d={dAttr} fill="none" stroke={color} strokeWidth={2} />
      </svg>
    );
  };
  return (
    <Box>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={800}
        gutterBottom
        suppressHydrationWarning
        sx={{
          letterSpacing: -0.5,
          color: (theme) => (theme.palette as any)[roleColor]?.main || theme.palette.text.primary
        }}
      >
        {`${t('dashboard') || 'Dashboard'} — ${roleLabel}`}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>{String(name || 'U').slice(0,1).toUpperCase()}</Avatar>
                <Stack spacing={0}>
                  <Typography variant="subtitle1" fontWeight={700}>{name}</Typography>
                  <Typography variant="body2" color="text.secondary">{email}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip size="small" color={roleColor as any} label={`${t('role_label')}: ${roleLabel}`} />
                    {membership && (
                      <Chip
                        size="small"
                        color={membership === 'active' ? 'success' : membership === 'rejected' ? 'error' : 'warning'}
                        variant={membership === 'active' ? 'filled' : 'outlined'}
                        label={(t(membership) as any) || membership}
                      />
                    )}
                  </Stack>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button LinkComponent={NextLink} href={`/${locale}/profile`} variant="outlined" size="small">
                  {t('profile') as any || 'Profile'}
                </Button>
                <Button variant="outlined" size="small" onClick={() => { setEditName(name); setEditUsername((me?.user as any)?.username || ''); setEditPhone((me?.user as any)?.phone || ''); setEditOpen(true); }}>
                  {t('edit_profile') as any || 'Edit Profile'}
                </Button>
                {userRole === 'admin' && (
                  <>
                    <Button LinkComponent={NextLink} href={`/${locale}/admin/users`} variant="outlined" size="small">{t('users') as any || 'Users'}</Button>
                    <Button LinkComponent={NextLink} href={`/${locale}/admin/permissions`} variant="outlined" size="small">{t('permissions') as any || 'Permissions'}</Button>
                    {/* Access documentation moved to public Help; remove from admin shortcuts */}
                  </>
                )}
                {userRole === 'executive' && (
                  <Button LinkComponent={NextLink} href={`/${locale}/admin/membership`} variant="outlined" size="small">{t('membership') as any || 'Membership'}</Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* KPI cards by role */}
        {isExecutive && (
          <>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">{t('pending') as any || 'Pending applications'}</Typography>
                  <Typography variant="h6" fontWeight={700}>{apps?.total ?? '—'}</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">{t('unresolved') as any || 'Unresolved messages'}</Typography>
                  <Typography variant="h6" fontWeight={700}>{msgs?.total ?? '—'}</Typography>
                </Stack>
              </Paper>
            </Grid>
          </>
        )}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap" alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>{t('filters') || 'Filters'}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap>
                <TextField select size="small" label={t('role_label')} value={filterRole} onChange={(e) => setFilterRole(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="">{t('all') || 'All'}</MenuItem>
                  <MenuItem value="member">{t('user_role_member')}</MenuItem>
                  <MenuItem value="volunteer">{t('user_role_volunteer')}</MenuItem>
                  <MenuItem value="executive">{t('user_role_executive')}</MenuItem>
                  <MenuItem value="admin">{t('user_role_admin')}</MenuItem>
                </TextField>
                <TextField select size="small" label={t('status') as any} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="">{t('all') || 'All'}</MenuItem>
                  <MenuItem value="active">{t('active') || 'Active'}</MenuItem>
                  <MenuItem value="expired">{t('expired') || 'Expired'}</MenuItem>
                  <MenuItem value="pending">{t('pending') || 'Pending'}</MenuItem>
                  <MenuItem value="none">{t('none') || 'None'}</MenuItem>
                </TextField>
              </Stack>
            </Stack>
            {statsError && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning">{String((statsError as any)?.response?.data?.error || 'Failed to load stats')}</Alert>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick edit profile dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('edit_profile') as any || 'Edit Profile'}</DialogTitle>
          <DialogContent>
            <Stack gap={1.5} sx={{ mt: 1 }}>
              <TextField label={t('name_label')} value={editName} onChange={(e) => setEditName(e.target.value)} />
              <TextField label={t('username_label') as any || 'Username'} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              <TextField label={t('phone') as any || 'Phone'} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>{t('cancel') as any || 'Cancel'}</Button>
            <Button variant="contained" onClick={onQuickSave}>{t('save') as any || 'Save'}</Button>
          </DialogActions>
        </Dialog>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{t('users') || 'Users'}</Typography>
              <Typography variant="h6" fontWeight={700}>{stats?.summary?.users?.total ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{t('active') || 'Active'}</Typography>
              <Typography variant="h6" fontWeight={700}>{stats?.summary?.users?.active ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">{t('inactive') || 'Inactive'}</Typography>
              <Typography variant="h6" fontWeight={700}>{stats?.summary?.users?.inactive ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, aspectRatio: { xs: '1 / 1', md: 'auto' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="body2" color="text.secondary">IEEE {t('members') || 'Members'}</Typography>
              <Typography variant="h6" fontWeight={700}>{stats?.summary?.membership?.active ?? '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>{t('activity') || 'Activity (14d)'}</Typography>
                <Typography variant="caption" color="text.secondary">• {t('resets_in') as any || 'Resets in'}: {fmt(resetSec)}</Typography>
              </Stack>
              <Button size="small" variant="outlined" onClick={makeCsv}>{t('csv') as any || 'CSV'}</Button>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{t('login_label') as any || 'Login'}</Typography>
                  <Sparkline data={(stats?.daily || []).map((d: any) => d.login)} color="#4caf50" />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{t('chat') as any || 'Chat'}</Typography>
                  <Sparkline data={(stats?.daily || []).map((d: any) => d.chat)} color="#1976d2" />
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>{t('service_health') as any || 'Service Health'}</Typography>
              {isAdmin && (
                <Button size="small" variant="outlined" onClick={() => { try { (refetchHealth as any)(); } catch {} }}>{t('refresh') as any || 'Refresh'}</Button>
              )}
            </Stack>
            {!isAdmin && <Alert severity="info">{t('admin_health_hint') as any || 'Sign in as admin to view service health.'}</Alert>}
            {isAdmin && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{t('db') as any || 'DB'}</Typography>
                  <Chip size="small" color={data?.services?.db?.connected ? 'success' as any : 'default'} label={String(data?.services?.db?.state ?? (t('not_available') as any || '-')) } />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{t('redis') as any || 'Redis'}</Typography>
                  <Chip size="small" color={data?.services?.redis?.ok ? 'success' as any : 'default'} label={data?.services?.redis?.ok ? (t('ok') as any || 'OK') : (t('not_available') as any || 'N/A')} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{t('smtp') as any || 'SMTP'}</Typography>
                  <Chip size="small" color={data?.services?.smtp?.ok ? 'success' as any : 'default'} label={data?.services?.smtp?.ok ? (t('ok') as any || 'OK') : (t('not_available') as any || 'N/A')} />
                </Stack>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

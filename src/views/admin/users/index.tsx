"use client";

import React from 'react';
import { Box, Button, Container, Stack, TextField, Typography, MenuItem, Snackbar, Alert, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import UserTable, { UserRow } from './components/UserTable';
import UserDialog from './components/UserDialog';
import ConfirmDialog from './components/ConfirmDialog';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function UsersView() {
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<UserRow | undefined>(undefined);
  const [query, setQuery] = React.useState('');
  const [role, setRole] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [active, setActive] = React.useState<string>('');
  const [refresh, setRefresh] = React.useState(0);
  const [confirm, setConfirm] = React.useState<{ open: boolean; user?: UserRow }>({ open: false });
  const { t } = useTranslation();
  const [, refetchList] = useAxios({ url: '/api/users', params: { q: query, role, status, active } }, { manual: true });
  const [, createUser] = useAxios({ url: '/api/users', method: 'POST' }, { manual: true });
  const [, updateUser] = useAxios({ method: 'PATCH' }, { manual: true });
  const [, deleteUser] = useAxios({ method: 'DELETE' }, { manual: true });
  const [toast, setToast] = React.useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '' });

  const onAdd = () => { setInitial(undefined); setOpen(true); };
  const onEdit = (u: UserRow) => { setInitial(u); setOpen(true); };
  const onDelete = async (u: UserRow) => {
    try {
      await deleteUser({ url: `/api/users/${u.id}` });
      await refetchList();
      setRefresh((n) => n + 1);
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      throw err;
    }
  };
  const onSubmit = async (values: any) => {
    try {
      if (initial?.id) {
        const data: any = { ...values };
        if (typeof data.password === 'string' && data.password.trim() === '') delete data.password;
        await updateUser({ url: `/api/users/${initial.id}`, data });
        setToast({ open: true, message: String(t('save') || 'Saved'), severity: 'success' });
      } else {
        await createUser({ data: values });
        setToast({ open: true, message: String(t('create') || 'Created'), severity: 'success' });
      }
      await refetchList();
      setRefresh((n) => n + 1);
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      const msg = err?.response?.data?.error || err?.message || 'Failed';
      setToast({ open: true, message: msg, severity: 'error' });
    }
  };

  return (
    <>
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700}>{t('users')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('manage_users_subtitle')}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} useFlexGap flexWrap="wrap">
          <TextField placeholder={t('search_users_placeholder') as string} size="small" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetchList(); }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }} />
          <TextField select label={t('role_label')} size="small" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 160 }} InputProps={{ startAdornment: (<InputAdornment position="start"><ManageAccountsOutlinedIcon fontSize="small" /></InputAdornment>) }}>
            <MenuItem value="">{t('all') || 'All'}</MenuItem>
            <MenuItem value="member">{t('user_role_member')}</MenuItem>
            <MenuItem value="volunteer">{t('user_role_volunteer')}</MenuItem>
            <MenuItem value="executive">{t('user_role_executive')}</MenuItem>
            <MenuItem value="admin">{t('user_role_admin')}</MenuItem>
          </TextField>
          <TextField select label={t('status') as any} size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }} InputProps={{ startAdornment: (<InputAdornment position="start"><VerifiedUserOutlinedIcon fontSize="small" /></InputAdornment>) }}>
            <MenuItem value="">{t('all') || 'All'}</MenuItem>
            <MenuItem value="active">{t('active') || 'Active'}</MenuItem>
            <MenuItem value="expired">{t('expired') || 'Expired'}</MenuItem>
            <MenuItem value="pending">{t('pending') || 'Pending'}</MenuItem>
            <MenuItem value="none">{t('none') || 'None'}</MenuItem>
          </TextField>
          <TextField select label={t('active') as any || 'Active'} size="small" value={active} onChange={(e) => setActive(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">{t('all') || 'All'}</MenuItem>
            <MenuItem value="true">{t('active') || 'Active'}</MenuItem>
            <MenuItem value="false">{t('inactive') || 'Inactive'}</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={() => { setQuery(''); setRole(''); setStatus(''); setActive(''); setRefresh((n) => n + 1); }}>{t('refresh')}</Button>
          <Button variant="contained" color="secondary" onClick={onAdd}>{t('add_user')}</Button>
        </Stack>
      </Stack>

      <UserTable onEdit={onEdit} onDelete={(u) => setConfirm({ open: true, user: u })} filters={{ q: query, role, status, active }} refresh={refresh} />

      <UserDialog open={open} onClose={() => setOpen(false)} initial={initial as any} onSubmit={onSubmit} />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={async () => { if (confirm.user) await onDelete(confirm.user); }}
        title={t('delete_user_title')}
        message={t('delete_user_message', { email: confirm.user?.email || t('this_user') })}
      />
    </Container>
    <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ open: false, message: '' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity={toast.severity || 'success'} sx={{ width: '100%' }} onClose={() => setToast({ open: false, message: '' })}>
        {toast.message}
      </Alert>
    </Snackbar>
    </>
  );

}

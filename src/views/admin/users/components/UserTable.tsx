"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Typography,
} from '@mui/material';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

export type UserRow = { id: string; name?: string; email: string; username?: string; role: 'member'|'volunteer'|'executive'|'admin'|'user'|'professor'; phone?: string; university?: string; major?: string; degree?: string; sub_disciplines?: string[]; membership_status?: string; createdAt?: string };

export default function UserTable({ onEdit, onDelete, filters, refresh = 0 }: { onEdit: (u: UserRow) => void; onDelete: (u: UserRow) => void; filters?: { q?: string; role?: string; status?: string }; refresh?: number }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? (parts[0] as 'en'|'fa') : 'en';
  const [q, setQ] = React.useState(filters?.q || '');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  React.useEffect(() => { setQ(filters?.q || ''); setPage(0); }, [filters?.q]);
  const params: any = { q, page: page + 1, pageSize: rowsPerPage };
  if (filters?.role) params.role = filters.role;
  if (filters?.status) params.status = filters.status;
  params._r = refresh; // bust cache
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/users', params });
  const onExport = () => {
    const rows: string[] = [];
    const headers = ['name','full_name','email','username','role','phone','university','major','degree','sub_disciplines','status','createdAt'];
    rows.push(headers.join(','));
    (items || []).forEach((u:any) => {
      const role = u.role === 'professor' ? 'executive' : u.role === 'user' ? 'member' : u.role;
      const subs = Array.isArray(u.sub_disciplines) ? u.sub_disciplines.join(';') : '';
      const vals = [u.name||'', u.full_name||'', u.email||'', u.username||'', role||'', u.phone||'', u.university||'', u.major||'', u.degree||'', subs, u.membership_status||'', u.createdAt||''];
      rows.push(vals.map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const items: UserRow[] = data?.items || [];
  const total = data?.total || 0;
  const [cols, setCols] = React.useState<Record<string, boolean>>({
    name: true,
    email: true,
    username: true,
    role: true,
    phone: true,
    university: true,
    major: true,
    degree: true,
    sub_disciplines: true,
    status: true,
  });
  React.useEffect(() => {
    try { const raw = localStorage.getItem('userTableCols'); if (raw) setCols({ ...cols, ...JSON.parse(raw) }); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem('userTableCols', JSON.stringify(cols)); } catch {}
  }, [cols]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const onOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const onClose = () => setAnchorEl(null);

  return (
    <Box>
      {error && (
        <Alert severity="error">
          {(() => {
            const res = (error as any)?.response;
            if (res?.status === 403) return (t('admin_required') as any) || 'Admin access required';
            if (res?.status === 401) return (t('sign_in') as any) || 'Sign in required';
            return String(res?.data?.error || t('failed_load_users'));
          })()}
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }} spacing={1}>
        <Button size="small" variant="outlined" onClick={onExport}>{t('export_csv') as any || 'Export CSV'}</Button>
        <Tooltip title={t('columns') as any}><IconButton size="small" onClick={onOpen}><SettingsIcon fontSize="small" /></IconButton></Tooltip>
      </Stack>
      <Popover open={open} anchorEl={anchorEl} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box sx={{ p: 1.5 }}>
          {Object.entries(cols).map(([key, val]) => (
            <FormControlLabel key={key} control={<Checkbox size="small" checked={val} onChange={(e) => setCols((c) => ({ ...c, [key]: e.target.checked }))} />} label={(t(key === 'status' ? 'status' : key) as any) || key} />
          ))}
        </Box>
      </Popover>
          <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              {cols.name && <TableCell>{locale === 'fa' ? (t('full_name_fa') as any || t('full_name')) : (t('full_name_en') as any || t('name_label'))}</TableCell>}
              {cols.email && <TableCell>{t('email_label')}</TableCell>}
              {cols.username && <TableCell>{t('username_label') || 'Username'}</TableCell>}
              {cols.role && <TableCell>{t('role_label')}</TableCell>}
              {cols.phone && <TableCell>{t('phone')}</TableCell>}
              {cols.university && <TableCell>{t('university')}</TableCell>}
              {cols.major && <TableCell>{t('major')}</TableCell>}
              {cols.degree && <TableCell>{t('degree')}</TableCell>}
              {cols.sub_disciplines && <TableCell>{t('sub_disciplines') as any || 'Sub-disciplines'}</TableCell>}
              
              {cols.status && <TableCell>{t('status')}</TableCell>}
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} align="center"><CircularProgress size={22} /></TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center"><Typography color="text.secondary">{t('no_users_found')}</Typography></TableCell>
              </TableRow>
            )}
            {items.map((u: any) => (
              <TableRow key={u.id} hover>
                {cols.name && <TableCell>{locale === 'fa' ? (u.full_name || u.name || '—') : (u.name || u.full_name || '—')}</TableCell>}
                {cols.email && <TableCell>{u.email}</TableCell>}
                {cols.username && <TableCell>{u.username || '—'}</TableCell>}
                {cols.role && <TableCell>
                  {(() => {
                    const role = u.role === 'professor' ? 'executive' : u.role === 'user' ? 'member' : u.role;
                    const label = role === 'admin' ? t('user_role_admin')
                      : role === 'executive' ? t('user_role_executive')
                      : role === 'volunteer' ? t('user_role_volunteer')
                      : t('user_role_member');
                    const color: any = role === 'admin' ? 'secondary' : role === 'executive' ? 'info' : role === 'member' ? 'success' : 'warning';
                    return <Chip label={label} size="small" color={color} />;
                  })()}
                </TableCell>}
                {cols.phone && <TableCell>{u.phone || '—'}</TableCell>}
                {cols.university && <TableCell>{u.university || '—'}</TableCell>}
                {cols.major && <TableCell>{u.major || '—'}</TableCell>}
                {cols.degree && <TableCell>{u.degree || '—'}</TableCell>}
                {cols.sub_disciplines && <TableCell>
                  {Array.isArray(u.sub_disciplines) && u.sub_disciplines.length > 0
                    ? (
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        {u.sub_disciplines.map((s: string, i: number) => (<Chip key={i} size="small" variant="outlined" label={s} />))}
                      </Stack>
                    )
                    : '—'}
                </TableCell>}
                
                {cols.status && <TableCell>{u.membership_status || '—'}</TableCell>}
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={t('edit') as string}><IconButton size="small" onClick={() => onEdit(u)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={t('delete') as string}><IconButton size="small" onClick={() => onDelete(u)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Box>
  );
}

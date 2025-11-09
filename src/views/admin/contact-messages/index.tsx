"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { Alert, Box, Button, Chip, Container, Dialog, DialogContent, DialogTitle, IconButton, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

type Row = { id: string; name: string; email: string; phone: string; subject: string; message: string; locale: 'en'|'fa'; resolved: boolean; createdAt: string };

export default function ContactMessagesAdminView() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? (parts[0] as 'en'|'fa') : 'en';
  const [q, setQ] = React.useState('');
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [page] = React.useState(1);
  const [pageSize] = React.useState(20);

  const [{ data, error, loading }, refetch] = useAxios({ url: '/api/contact-messages', params: { q, page, pageSize, resolved: onlyOpen ? 'false' : undefined } });
  const [, patch] = useAxios({ method: 'PATCH' }, { manual: true });
  const [, del] = useAxios({ method: 'DELETE' }, { manual: true });

  const [selected, setSelected] = React.useState<Row | null>(null);

  const toggleResolved = async (row: Row) => {
    try {
      await patch({ url: `/api/contact-messages/${row.id}`, data: { resolved: !row.resolved } });
      await refetch();
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      throw err;
    }
  };
  const onDelete = async (row: Row) => {
    try {
      await del({ url: `/api/contact-messages/${row.id}` });
      await refetch();
      setSelected(null);
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      throw err;
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('messages') || 'Messages'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('nav_messages_sub') || 'Manage contact form messages'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
          <TextField size="small" placeholder={t('search') as string} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch checked={onlyOpen} onChange={(e) => { setOnlyOpen(e.target.checked); setTimeout(() => refetch(), 0); }} />
            <Typography variant="body2">{onlyOpen ? (t('unresolved') || 'Unresolved') : (t('resolved') || 'Resolved')}</Typography>
          </Stack>
          <Button variant="contained" onClick={() => refetch()}>{t('search') || 'Search'}</Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error">
          {(() => {
            const res = (error as any)?.response;
            if (res?.status === 403) return (t('admin_required') as any) || 'Admin access required';
            if (res?.status === 401) return (t('sign_in') as any) || 'Sign in required';
            return String(res?.data?.error || error);
          })()}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{locale === 'fa' ? (t('full_name_fa') as any || t('name_label')) : (t('full_name_en') as any || t('name_label'))}</TableCell>
            <TableCell>{t('email_label') || 'Email'}</TableCell>
            <TableCell>{t('subject_label') || 'Subject'}</TableCell>
            <TableCell>{t('phone_label') || 'Phone'}</TableCell>
            <TableCell>{t('locale_label') || 'Locale'}</TableCell>
            <TableCell>{t('status') || 'Status'}</TableCell>
            <TableCell align="right">{t('actions') || 'Actions'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.items || []).map((row: Row) => (
            <TableRow key={row.id} hover onClick={() => setSelected(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.subject}</TableCell>
              <TableCell>{row.phone || '—'}</TableCell>
              <TableCell><Chip size="small" label={row.locale.toUpperCase()} /></TableCell>
              <TableCell>{row.resolved ? (t('resolved') || 'Resolved') : (t('unresolved') || 'Unresolved')}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={(e) => { e.stopPropagation(); toggleResolved(row); }}>{row.resolved ? (t('mark_as_unresolved') || 'Mark unresolved') : (t('mark_as_resolved') || 'Mark resolved')}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {(selected?.subject || t('message_label') || 'Message')}
          <IconButton onClick={() => setSelected(null)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Stack gap={1}>
              <Typography variant="body2"><b>{locale === 'fa' ? (t('full_name_fa') as any || t('name_label')) : (t('full_name_en') as any || t('name_label'))}:</b> {selected.name}</Typography>
              <Typography variant="body2"><b>{t('email_label') || 'Email'}:</b> {selected.email}</Typography>
              <Typography variant="body2"><b>{t('phone_label') || 'Phone'}:</b> {selected.phone || '—'}</Typography>
              <Typography variant="body2"><b>{t('locale_label') || 'Locale'}:</b> {selected.locale.toUpperCase()}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{selected.message}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button onClick={() => toggleResolved(selected)}>{selected.resolved ? (t('mark_as_unresolved') || 'Mark unresolved') : (t('mark_as_resolved') || 'Mark resolved')}</Button>
                <Button color="error" onClick={() => onDelete(selected)}>{t('delete') || 'Delete'}</Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

    </Container>
  );
}

"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Row = { id: string; title: string; date?: string; locale?: 'en'|'fa' };

export default function EventsAdminView() {
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [{ data, error, loading }, refetch] = useAxios({ url: '/api/events', params: { q, page: 1, pageSize: 50 } });
  const [, createReq] = useAxios({ url: '/api/events', method: 'POST' }, { manual: true });
  const [, patchReq] = useAxios({ method: 'PATCH' }, { manual: true });
  const [, delReq] = useAxios({ method: 'DELETE' }, { manual: true });
  const [open, setOpen] = React.useState(false);
  const [edit, setEdit] = React.useState<Row | null>(null);
  const [form, setForm] = React.useState({ title: '', date: '', locale: 'en' as 'en'|'fa' });
  const onSubmit = async () => {
    if (!form.title) return;
    if (edit) await patchReq({ url: `/api/events/${edit.id}`, data: form });
    else await createReq({ data: form });
    setOpen(false); setEdit(null); setForm({ title: '', date: '', locale: 'en' });
    await refetch();
  };
  const onDelete = async (row: any) => { await delReq({ url: `/api/events/${row.id}` }); await refetch(); };
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('events') as any || 'Events'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('nav_events_sub') as any || 'Workshops, talks, meetups'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" placeholder={t('search') as any || 'Search'} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} />
          <Button variant="contained" onClick={() => { setEdit(null); setForm({ title: '', date: '', locale: 'en' }); setOpen(true); }}>{t('add') as any || 'Add'}</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{String((error as any)?.response?.data?.error || error)}</Alert>}
      <Paper variant="outlined" sx={{ p: 0, borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('title_label') as any || 'Title'}</TableCell>
              <TableCell>{t('date_label') as any || 'Date'}</TableCell>
              <TableCell>{t('default_locale') as any || 'Locale'}</TableCell>
              <TableCell align="right">{t('actions') as any || 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.items || []).map((row: any) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.date ? new Date(row.date).toLocaleString() : '—'}</TableCell>
                <TableCell>{(row.locale || 'en').toUpperCase()}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => { setEdit(row); setForm({ title: row.title, date: row.date || '', locale: row.locale || 'en' }); setOpen(true); }}>{t('edit') as any || 'Edit'}</Button>
                    <Button size="small" color="error" onClick={() => onDelete(row)}>{t('delete') as any || 'Delete'}</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit ? (t('edit') as any || 'Edit') : (t('add') as any || 'Add')}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label={t('title_label') as any || 'Title'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label={t('date_label') as any || 'Date'} type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <TextField select label={t('default_locale') as any || 'Locale'} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as 'en'|'fa' })}>
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="fa">FA</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel') as any || 'Cancel'}</Button>
          <Button variant="contained" onClick={onSubmit}>{t('save') as any || 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}


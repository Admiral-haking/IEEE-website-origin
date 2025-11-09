"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function ChannelsAdminView() {
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [{ data, error, loading }, refetch] = useAxios({ url: '/api/chat/channels', params: { q, counts: 'true' } });
  const items: any[] = data?.items || [];
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [tags, setTags] = React.useState('');
  const [editId, setEditId] = React.useState<string | null>(null);
  const [visibleTo, setVisibleTo] = React.useState<string[]>(['member','volunteer','executive','admin']);
  const roles = ['member','volunteer','executive','admin'];
  const onSave = async () => {
    if (!name || !slug) return;
    // inline duplicate-slug validation against current list
    const norm = String(slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const dup = (items || []).some((c: any) => c.slug === norm && c.id !== editId);
    if (dup) { setSlugError(String(t('slug_exists') as any || 'Slug already exists')); return; }
    try {
      const payload = { name, slug: norm, tags: tags.split(',').map((s)=>s.trim()).filter(Boolean), visibleTo };
      if (editId) await axios.patch(`/api/chat/channels/${editId}`, payload);
      else await axios.post('/api/chat/channels', payload);
      setName(''); setSlug(''); setTags(''); setEditId(null);
      setVisibleTo(['member','volunteer','executive','admin']);
      await refetch();
    } catch (e: any) {}
  };
  // Inline dialog component and opener helpers must be defined outside JSX return
  function MessagesDialog() {
    const [open, setOpen] = React.useState(false);
    const [chan, setChan] = React.useState<any>(null);
    const [{ data: msgs }, exec] = useAxios({ method: 'GET' }, { manual: true });
    const load = async (c: any) => { await exec({ url: `/api/chat/channels/${c.id}/messages` }); };
    const onDeleteMsg = async (mid: string) => { try { await axios.delete(`/api/chat/channels/${chan?.id}/messages/${mid}`); await load(chan); } catch {} };
    (MessagesDialog as any).setOpen = setOpen;
    (MessagesDialog as any).setChan = setChan;
    (MessagesDialog as any).load = load;
    return (
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('messages') as any || 'Messages'}</DialogTitle>
        <DialogContent>
          <Stack gap={1} sx={{ mt: 1 }}>
            {((msgs as any)?.items || []).map((m: any) => (
              <Paper key={m.id} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Box sx={{ pr: 1 }}>
                    <Typography variant="caption" color="text.secondary">{new Date(m.createdAt).toLocaleString()}</Typography>
                    <Typography variant="body2">{m.content}</Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => onDeleteMsg(m.id)}>{t('delete') as any || 'Delete'}</Button>
                </Stack>
              </Paper>
            ))}
            {(((msgs as any)?.items || []).length === 0) && <Typography variant="body2" color="text.secondary">{t('no_messages') as any || 'No messages'}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('close') as any || 'Close'}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  function openMessages(c: any) {
    (MessagesDialog as any).setChan?.(c);
    (MessagesDialog as any).setOpen?.(true);
    (MessagesDialog as any).load?.(c);
  }
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('channels') as any || 'Channels'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('channels_admin_sub') as any || 'Create and manage chat channels'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField size="small" placeholder={t('search') as any || 'Search'} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} />
          <Button variant="contained" onClick={() => refetch()}>{t('search') as any || 'Search'}</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{String((error as any)?.response?.data?.error || error)}</Alert>}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <TextField size="small" label={t('name_label') as any || 'Name'} value={name} onChange={(e)=> setName(e.target.value)} />
          <TextField
            size="small"
            label={t('slug_label') as any || 'Slug'}
            value={slug}
            onChange={(e)=> { setSlug(e.target.value); setSlugError(null); }}
            error={!!slugError}
            helperText={slugError || undefined}
          />
          <TextField size="small" label={t('tags_label') as any || 'Tags'} value={tags} onChange={(e)=> setTags(e.target.value)} helperText={t('tags_help') as any || 'Comma-separated'} />
          <TextField size="small" select SelectProps={{ multiple: true }} label={(t('visible_to') as any) || 'Visible to'} value={visibleTo} onChange={(e) => setVisibleTo(typeof e.target.value === 'string' ? (e.target.value as any).split(',') : (e.target.value as string[]))}>
            {roles.map((r) => (<MenuItem key={r} value={r}>{t(r === 'admin' ? 'user_role_admin' : r === 'executive' ? 'user_role_executive' : r === 'volunteer' ? 'user_role_volunteer' : 'user_role_member') as any}</MenuItem>))}
          </TextField>
          <Button variant="contained" onClick={onSave}>{editId ? (t('save') as any || 'Save') : (t('create') as any || 'Create')}</Button>
        </Stack>
      </Paper>
      {/* Messages dialog */}
      <MessagesDialog />
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('name_label') as any || 'Name'}</TableCell>
            <TableCell>{t('slug_label') as any || 'Slug'}</TableCell>
            <TableCell>{t('tags_label') as any || 'Tags'}</TableCell>
            <TableCell>{t('unread') as any || 'Unread'}</TableCell>
            <TableCell align="right">{t('actions') as any || 'Actions'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.slug}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                  {(c.tags || []).map((t: string) => (<Chip key={t} size="small" label={t} />))}
                </Stack>
              </TableCell>
              <TableCell>{c.unread ?? 0}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={() => { setEditId(c.id); setName(c.name); setSlug(c.slug); setTags((c.tags || []).join(',')); }}>{t('edit') as any || 'Edit'}</Button>
                  <Button size="small" color="error" onClick={async ()=> { try { await axios.delete(`/api/chat/channels/${c.id}`); await refetch(); } catch {} }}>{t('delete') as any || 'Delete'}</Button>
                  <Button size="small" onClick={() => openMessages(c)}>{t('messages') as any || 'Messages'}</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

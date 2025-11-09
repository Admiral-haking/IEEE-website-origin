"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from '@/lib/axios';
import { Box, Button, Chip, CircularProgress, Divider, List, ListItem, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Channel = { id: string; name: string; slug: string; tags?: string[] };
type Message = { id: string; userId: string; content: string; createdAt?: string };

export default function ChannelsView() {
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/chat/channels', params: { q, counts: 'true' } });
  const channels: Channel[] = data?.items || [];
  const [selected, setSelected] = React.useState<Channel | null>(null);
  const [{ data: msgsData, loading: msgsLoading }, execMsgs] = useAxios({ method: 'GET' }, { manual: true });
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!selected) return;
    void execMsgs({ url: `/api/chat/channels/${selected.id}/messages` }).catch(() => {});
  }, [selected, execMsgs]);

  const messages: Message[] = msgsData?.items || [];

  const onSend = async () => {
    if (!selected || !text.trim()) return;
    try {
      const res = await axios.post(`/api/chat/channels/${selected.id}/messages`, { content: text });
      const m = res?.data?.message;
      if (m) {
        (msgsData as any).items = [...(msgsData?.items || []), m];
      }
      setText('');
    } catch {}
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ height: { md: 480 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 1, md: 1.25 }, borderRadius: 3, width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 1 }}>
          <TextField size="small" placeholder={t('search_channels') as any || 'Search channels'} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} fullWidth />
          <Button size="small" variant="contained" onClick={() => refetch()}>{t('search') as any || 'Search'}</Button>
        </Stack>
        {loading && <Typography variant="body2"><CircularProgress size={16} /> {t('loading') as any || 'Loading…'}</Typography>}
        {error && <Typography variant="body2" color="error">{t('failed_load_channels') as any || 'Failed to load channels'}</Typography>}
        <List dense sx={{ maxHeight: { md: 410 }, overflow: 'auto' }}>
          {channels.map((c: any) => (
            <ListItem key={c.id} disablePadding>
              <ListItemButton selected={selected?.id === c.id} onClick={() => setSelected(c)}>
                <ListItemText primary={c.name} secondary={(c.tags || []).join(', ')} />
                {!!c.unread && <Chip size="small" color="error" label={c.unread} />}
              </ListItemButton>
            </ListItem>
          ))}
          {channels.length === 0 && !loading && (
            <ListItem><ListItemText primary={t('no_channels') as any || 'No channels'} /></ListItem>
          )}
        </List>
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 3, flex: 1, minHeight: { xs: 360, md: 'auto' } }}>
        {!selected && (
          <Typography variant="body2" color="text.secondary">{t('select_channel_hint') as any || 'Select a channel to view messages.'}</Typography>
        )}
        {selected && (
          <Stack sx={{ height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>{selected.name}</Typography>
              <Button size="small" onClick={async () => { try { await axios.patch(`/api/chat/channels/${selected.id}/read`); await refetch(); } catch {} }}>{t('mark_all_read') as any || 'Mark all read'}</Button>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {msgsLoading && <Typography variant="body2"><CircularProgress size={16} /> {t('loading') as any || 'Loading…'}</Typography>}
              {!msgsLoading && (messages || []).map((m) => (
                <Box key={m.id} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{new Date(m.createdAt || Date.now()).toLocaleString()}</Typography>
                  <Typography variant="body2">{m.content}</Typography>
                </Box>
              ))}
              {!msgsLoading && messages.length === 0 && (
                <Typography variant="body2" color="text.secondary">{t('no_messages') as any || 'No messages yet.'}</Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <TextField size="small" placeholder={(t('type_message') as any) || 'Type a message'} value={text} onChange={(e) => setText(e.target.value)} fullWidth onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }} />
              <Button variant="contained" onClick={onSend} disabled={!text.trim()}>{t('send') as any || 'Send'}</Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}

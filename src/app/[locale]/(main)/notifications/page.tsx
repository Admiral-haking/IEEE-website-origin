"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from '@/lib/axios';
import { Box, Button, Chip, Container, Divider, List, ListItem, ListItemText, Paper, Stack, Switch, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function NotificationsInboxPage() {
  const { t } = useTranslation();
  const [unreadOnly, setUnreadOnly] = React.useState(true);
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/notifications', params: { unread: unreadOnly ? 'true' : undefined, limit: 50 } });
  const items: any[] = data?.items || [];
  const onMark = async (id: string) => { try { await axios.patch(`/api/notifications/${id}`); await refetch(); } catch {} };
  const onDelete = async (id: string) => { try { await axios.delete(`/api/notifications/${id}`); await refetch(); } catch {} };
  const onMarkAll = async () => { try { await axios.patch('/api/notifications/read', {}); await refetch(); } catch {} };
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('notifications') as any || 'Notifications'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('notifications_inbox_sub') as any || 'Your recent notifications'}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">{unreadOnly ? (t('unread_only') as any || 'Unread only') : (t('all') as any || 'All')}</Typography>
          <Switch checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setTimeout(() => refetch(), 0); }} />
          <Button size="small" variant="outlined" onClick={onMarkAll}>{t('mark_all_read') as any || 'Mark all read'}</Button>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
        {error && <Typography color="error">{String((error as any)?.response?.data?.error || error)}</Typography>}
        <List>
          {items.length === 0 && (
            <ListItem><ListItemText primary={t('no_notifications') as any || 'No new notifications'} /></ListItem>
          )}
          {items.map((n) => (
            <ListItem key={n.id} secondaryAction={
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => onMark(n.id)}>{t('mark_read') as any || 'Mark read'}</Button>
                <Button size="small" color="error" onClick={() => onDelete(n.id)}>{t('delete') as any || 'Delete'}</Button>
              </Stack>
            }>
              <ListItemText primary={n.title} secondary={n.body} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}


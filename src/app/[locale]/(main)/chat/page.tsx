"use client";

import React from 'react';
import { Badge, Container, Paper, Tab, Tabs } from '@mui/material';
import useAxios from 'axios-hooks';
import ChannelsView from '@/views/chat/channels/ChannelsView';
import DirectChatView from '@/views/chat/index';
import { useTranslation } from 'react-i18next';

export default function ChatPage() {
  const [tab, setTab] = React.useState(0);
  const { t } = useTranslation();
  const [{ data }, refetch] = useAxios({ url: '/api/chat/channels', params: { counts: 'true' } });
  const unreadTotal = React.useMemo(() => {
    const items: any[] = data?.items || [];
    return items.reduce((acc, c: any) => acc + (Number(c.unread || 0)), 0);
  }, [data]);
  React.useEffect(() => {
    const id = setInterval(() => { try { (refetch as any)(); } catch {} }, 20000);
    return () => clearInterval(id);
  }, [refetch]);
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label={(t('chat_direct') as any) || 'Direct'} />
          <Tab label={<Badge color="error" badgeContent={unreadTotal}>{(t('chat_channels') as any) || 'Channels'}</Badge>} />
        </Tabs>
      </Paper>
      {tab === 0 && <DirectChatView />}
      {tab === 1 && <ChannelsView />}
    </Container>
  );
}

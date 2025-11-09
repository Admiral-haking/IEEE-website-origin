"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Container, Divider, IconButton, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography, MenuItem } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

type Session = { id: string; provider: 'openai'|'deepseek'; model: string; title?: string };
type Message = { id: string; role: 'user'|'assistant'; content: string };

const allowAllStatus = () => true;

export default function ChatView() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? (parts[0] as 'en'|'fa') : 'en';
  const chatDisabled = (process.env.NEXT_PUBLIC_DISABLE_CHAT === '1' || process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true');

  const [{ data: me }] = useAxios({ url: '/api/auth/me', validateStatus: allowAllStatus });
  const [{ data: policyData }] = useAxios({ url: '/api/auth/policy', validateStatus: allowAllStatus });
  const [{ data: remainingData }, refetchRemaining] = useAxios({ url: '/api/chat/remaining', validateStatus: allowAllStatus });
  const [resetSec, setResetSec] = React.useState<number | null>(null);
  React.useEffect(() => {
    const sec = (remainingData as any)?.resetInSeconds;
    if (typeof sec === 'number') setResetSec(sec);
  }, [remainingData]);
  React.useEffect(() => {
    if (resetSec == null) return;
    const id = setInterval(() => setResetSec((s) => (typeof s === 'number' && s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resetSec]);
  React.useEffect(() => {
    const id = setInterval(() => { try { (refetchRemaining as any)(); } catch {} }, 60000);
    return () => clearInterval(id);
  }, [refetchRemaining]);
  const [{ data: sessionsData }, refetchSessions] = useAxios({ url: chatDisabled ? '' : '/api/chat/sessions', validateStatus: allowAllStatus });
  const [, createSession] = useAxios({ url: '/api/chat/sessions', method: 'POST' }, { manual: true });

  const [selected, setSelected] = React.useState<Session | null>(null);
  const [input, setInput] = React.useState('');
  const [provider, setProvider] = React.useState<'openai'|'deepseek'>('openai');
  const [model, setModel] = React.useState('gpt-4o-mini');
  const [{ data: messagesData }, refetchMessages] = useAxios({ url: selected ? `/api/chat/sessions/${selected.id}/messages` : '', method: 'GET' }, { manual: true });
  const [, sendMessage] = useAxios({ method: 'POST' }, { manual: true });
  const [sendErr, setSendErr] = React.useState<string | null>(null);

  React.useEffect(() => { if (selected) refetchMessages(); }, [selected, refetchMessages]);

  const onNewSession = async () => {
    const res = await createSession({ data: { provider, model, title: '' } });
    await refetchSessions();
    const created: Session | undefined = (res as any)?.data?.session;
    if (created) setSelected(created);
  };

  const onSend = async () => {
    const content = input.trim();
    if (!selected || !content) return;
    setInput('');
    setSendErr(null);
    try {
      await sendMessage({ url: `/api/chat/sessions/${selected.id}/messages`, data: { content } });
      await refetchMessages();
      await refetchRemaining();
    } catch (e: any) {
      const status = e?.response?.status || e?.status;
      if (status === 429) setSendErr(String(t('too_many_attempts') || 'Too many requests. Please wait.'));
      else setSendErr(String(e?.response?.data?.error || t('load_failed') || 'Failed to send'));
    }
  };

  const sessions: Session[] = sessionsData?.items || [];
  const messages: Message[] = messagesData?.items || [];

  if (chatDisabled) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography component="h1" variant="h4" fontWeight={800} gutterBottom suppressHydrationWarning>
          {t('chat') || 'Chat'}
        </Typography>
        <Typography variant="body2" color="text.secondary">{t('temporarily_unavailable') || 'Chat is temporarily disabled.'}</Typography>
      </Container>
    );
  }

  if (!me?.user) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography component="h1" variant="h4" fontWeight={800} gutterBottom suppressHydrationWarning>
          {t('sign_in') as string}
        </Typography>
        <Typography variant="body2" color="text.secondary">{t('auth_welcome_subtitle') as string}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography component="h1" variant="h4" fontWeight={800} gutterBottom suppressHydrationWarning>
        {t('chat') || 'Chat'}
      </Typography>
      {!!policyData?.policy && me?.user && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {(t('daily_limit') as any || 'Daily limit')}: {policyData.policy[(me.user.role === 'professor' ? 'executive' : me.user.role === 'user' ? 'member' : me.user.role) as any]}
          {typeof remainingData?.remaining === 'number' ? ` • ${t('remaining') || 'Remaining'}: ${remainingData.remaining}` : ''}
          {typeof resetSec === 'number' ? (() => {
            const h = Math.floor(resetSec / 3600);
            const m = Math.floor((resetSec % 3600) / 60);
            const s = resetSec % 60;
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            const ss = String(s).padStart(2, '0');
            return ` • ${(t('resets_in') as any || 'Resets in')}: ${hh}:${mm}:${ss}`;
          })() : ''}
          {remainingData?.remaining === 0 && (remainingData as any)?.resetAt ? ` • ${new Date((remainingData as any).resetAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}
        </Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper variant="outlined" sx={{ width: { xs: '100%', md: 260 }, p: 1.5, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField
              select
              size="small"
              value={provider}
              onChange={(e) => {
                const p = e.target.value as 'openai'|'deepseek';
                setProvider(p);
                setModel(p === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat');
              }}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="deepseek">DeepSeek</MenuItem>
            </TextField>
            <TextField size="small" value={model} onChange={(e) => setModel(e.target.value)} placeholder={(t('model_label') as any) || 'Model'} />
            <Button size="small" variant="contained" onClick={onNewSession}>{t('create') || 'Create'}</Button>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {sessions.map((s) => (
              <ListItemButton key={s.id} selected={selected?.id === s.id} onClick={() => setSelected(s)}>
                <ListItemText primary={s.title || `${s.provider} · ${s.model}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Paper variant="outlined" sx={{ flexGrow: 1, minHeight: 480, borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.map((m) => (
              <Box key={m.id} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <Paper sx={{ p: 1.2, borderRadius: 2, bgcolor: m.role === 'user' ? 'secondary.main' : 'background.default', color: m.role === 'user' ? 'secondary.contrastText' : 'text.primary' }}>
                  {m.content}
                </Paper>
              </Box>
            ))}
          </Box>
          {sendErr && <Alert severity="warning" sx={{ mb: 1 }}>{sendErr}</Alert>}
          <Stack direction="row" spacing={1}>
            <TextField fullWidth placeholder={t('type_message') || 'Type a message'} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
            <IconButton color="secondary" onClick={onSend} aria-label="send"><SendIcon /></IconButton>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

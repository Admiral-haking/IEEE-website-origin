"use client";

import React from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { flags } from '@/config/flags-client';

export default function AssistWidget() {
  const [visible, setVisible] = React.useState<boolean>(!!flags.assistEnabled);
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/settings/public/features', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (typeof data?.assistEnabled === 'boolean') setVisible(Boolean(data.assistEnabled));
      } catch {}
    })();
    return () => { active = false; };
  }, []);
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [reply, setReply] = React.useState('');
  const locale = (i18n.language?.startsWith('fa') ? 'fa' : 'en') as 'fa'|'en';
  if (!visible) return null;
  const ask = async () => {
    if (!input.trim()) return;
    setLoading(true); setReply('');
    try {
      const res = await fetch('/api/ai/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input, locale }) });
      const data = await res.json();
      setReply(String(data?.reply || ''));
    } catch {
      setReply(locale === 'fa' ? 'خطا در ارتباط با سرویس' : 'Service error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Box sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: (t) => t.zIndex.tooltip }}>
        <Button variant="contained" color="secondary" onClick={() => setOpen(true)} startIcon={<ChatBubbleOutlineIcon />}>
          {locale === 'fa' ? 'پرسش از دستیار' : 'Ask Assistant'}
        </Button>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {locale === 'fa' ? 'دستیار هوشمند' : 'Smart Assistant'}
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack gap={1.5}>
            <TextField
              label={locale === 'fa' ? 'سوال خود را وارد کنید' : 'Enter your question'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
              fullWidth
            />
            <Button variant="contained" disabled={loading} onClick={ask}>
              {loading ? (locale === 'fa' ? 'در حال پردازش…' : 'Processing…') : (locale === 'fa' ? 'ارسال' : 'Send')}
            </Button>
            {!!reply && (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{reply}</Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

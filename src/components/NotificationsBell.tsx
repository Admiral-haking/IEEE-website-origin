"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from '@/lib/axios';
import { Badge, CircularProgress, IconButton, ListItemText, Menu, MenuItem, Box, Divider } from '@mui/material';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneIcon from '@mui/icons-material/Done';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const allowAll = () => true;

export default function NotificationsBell() {
  // Only show/poll when authenticated
  const [{ data: me }] = useAxios({ url: '/api/auth/me', validateStatus: allowAll });
  const loggedIn = !!me?.user;
  const { t, i18n } = useTranslation();
  const locale = (i18n?.language || 'en').startsWith('fa') ? 'fa' : 'en';

  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [count, setCount] = React.useState<number>(0);
  const [emptyCycles, setEmptyCycles] = React.useState<number>(0);
  const [delayMs, setDelayMs] = React.useState<number>(10000); // start at 10s

  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const isCanceled = (_err: any) => false; // we don't use cancel tokens in manual polling

  React.useEffect(() => {
    if (!loggedIn) return;
    let canceled = false;
    let timer: any = null;
    let inFlight = false;
    let emptyCyclesRef = 0;
    let delayRef = 10000;
    const schedule = (ms: number) => { if (canceled) return; if (timer) clearTimeout(timer); timer = setTimeout(tick, ms); };
    const tick = async () => {
      if (canceled || inFlight || document.visibilityState === 'hidden') { schedule(delayRef); return; }
      inFlight = true;
      try {
        const r = await axios.get('/api/notifications/count');
        if (canceled) return;
        const n = Number(r?.data?.unread || 0);
        setCount(n);
        if (n === 0) {
          emptyCyclesRef += 1;
        } else {
          emptyCyclesRef = 0;
          delayRef = 10000; // reset to 10s when unread exists
        }
      } catch { /* ignore */ }
      finally {
        inFlight = false;
        if (emptyCyclesRef >= 3) delayRef = Math.min(delayRef * 2, 5 * 60 * 1000);
        schedule(delayRef);
      }
    };
    schedule(0);
    return () => { canceled = true; if (timer) clearTimeout(timer); };
  }, [loggedIn]);

  if (!loggedIn) return null;

  const unread = count;
  const onOpen = (e: React.MouseEvent<HTMLElement>) => { setAnchor(e.currentTarget); };
  const onClose = () => setAnchor(null);
  const onMarkAll = async () => {
    try { await axios.patch('/api/notifications/read', {}); } catch (err: any) { /* ignore */ }
    try {
      const res = await axios.get('/api/notifications', { params: { unread: 'true', limit: 10 } });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      const c = await axios.get('/api/notifications/count');
      setCount(Number(c?.data?.unread || 0));
    } catch {}
    onClose();
  };
  const loadList = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications', { params: { unread: 'true', limit: 10 } });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } finally {
      setLoading(false);
    }
  };
  const onOpenMenu = async (e: React.MouseEvent<HTMLElement>) => { setAnchor(e.currentTarget); await loadList(); };
  const markOne = async (id: string) => {
    try { await axios.patch(`/api/notifications/${id}`); } catch {}
    setItems((arr) => arr.filter((x) => x.id !== id));
    try { const r = await axios.get('/api/notifications/count'); setCount(Number(r?.data?.unread || 0)); } catch {}
  };
  const deleteOne = async (id: string) => {
    try { await axios.delete(`/api/notifications/${id}`); } catch {}
    setItems((arr) => arr.filter((x) => x.id !== id));
    try { const r = await axios.get('/api/notifications/count'); setCount(Number(r?.data?.unread || 0)); } catch {}
  };
  return (
    <>
      <IconButton color="inherit" onClick={onOpenMenu} aria-label="notifications" size="small">
        <Badge badgeContent={unread} color="error">
          {loading ? <CircularProgress size={18} /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>
      <Menu anchorEl={anchor} open={open} onClose={onClose} keepMounted>
        <MenuItem component={NextLink} href={`/${locale}/notifications`} onClick={onClose}>
          <ListItemText primary={t('notifications') as any || 'Notifications'} />
        </MenuItem>
        <Divider />
        {(items || []).length === 0 && <MenuItem disabled><ListItemText primary={t('no_notifications') as any || 'No new notifications'} /></MenuItem>}
        {(items || []).map((n: any) => (
          <MenuItem key={n.id} dense>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 300 }}>
              <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => markOne(n.id)}>
                <ListItemText primary={n.title} secondary={n.body} primaryTypographyProps={{ noWrap: true }} secondaryTypographyProps={{ noWrap: true }} />
              </Box>
              <IconButton size="small" color="success" aria-label="mark" onClick={(e) => { e.stopPropagation(); markOne(n.id); }}>
                <DoneIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" aria-label="delete" onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </MenuItem>
        ))}
        {(items || []).length > 0 && (
          <MenuItem onClick={onMarkAll}><ListItemText primary={t('mark_all_read') as any || 'Mark all as read'} /></MenuItem>
        )}
        <MenuItem component={NextLink} href={`/${locale}/notifications`} onClick={onClose}>
          <ListItemText primary={t('view_all') as any || 'View all'} />
        </MenuItem>
      </Menu>
    </>
  );
}

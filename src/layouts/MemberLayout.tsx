"use client";
import React from 'react';
import { Box, Divider, Drawer, IconButton, Link, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack } from '@mui/material';
import NextLink from 'next/link';
 
import useLocale from '@/hooks/useLocale';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import { useTranslation } from 'react-i18next';
import useAxios from 'axios-hooks';
import AdminAccessAlert from '@/components/AdminAccessAlert';

const allowAllStatus = () => true;
const drawerWidth = 240;

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((v) => !v);
  const { t } = useTranslation();
  const meCfg = React.useMemo(() => ({ url: '/api/auth/me', validateStatus: allowAllStatus }), []);
  const [{ error: meError }] = useAxios(meCfg);
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const nav = (
    <Box role="presentation" sx={{ width: { xs: drawerWidth, md: '100%' }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600} suppressHydrationWarning>{t('user_role_member')}</Typography>
        <Link component={NextLink} href={`/${locale}`} underline="hover" color="inherit" sx={{ fontSize: 12 }} suppressHydrationWarning>{t('home') || 'Home'}</Link>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton component={NextLink} href={`/${locale}/member`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
          <ListItemIcon><DashboardOutlinedIcon /></ListItemIcon>
          <ListItemText primary={t('dashboard')} secondary={t('nav_dashboard_sub')} primaryTypographyProps={{ suppressHydrationWarning: true }} secondaryTypographyProps={{ suppressHydrationWarning: true }} />
        </ListItemButton>
        <ListItemButton component={NextLink} href={`/${locale}/profile`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
          <ListItemIcon><PersonOutlineIcon /></ListItemIcon>
          <ListItemText primary={t('profile')} secondary={t('profile_sub')} primaryTypographyProps={{ suppressHydrationWarning: true }} secondaryTypographyProps={{ suppressHydrationWarning: true }} />
        </ListItemButton>
        <ListItemButton component={NextLink} href={`/${locale}/profile`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
          <ListItemIcon><HowToRegOutlinedIcon /></ListItemIcon>
          <ListItemText primary={t('apply_membership')} secondary={t('membership_review_desc')} primaryTypographyProps={{ suppressHydrationWarning: true }} secondaryTypographyProps={{ suppressHydrationWarning: true }} />
        </ListItemButton>
      </List>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="member sidebar">
        <Drawer anchor={isRtl ? 'right' : 'left'} variant="temporary" open={open} onClose={toggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {nav}
        </Drawer>
        <Drawer anchor={isRtl ? 'right' : 'left'} variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {nav}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar sx={{ display: { md: 'none' }, justifyContent: 'space-between' }}>
          <IconButton onClick={toggle} aria-label={t('menu') || 'menu'}><MenuIcon /></IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" suppressHydrationWarning>{t('user_role_member')}</Typography>
            <Link component={NextLink} href={`/${locale}`} underline="hover" color="inherit" sx={{ fontSize: 12 }} suppressHydrationWarning>{t('home') || 'Home'}</Link>
          </Stack>
        </Toolbar>
        <Box sx={{ p: 2 }}>
          <AdminAccessAlert error={meError} t={t as any} sx={{ mb: 2 }} />
          {children}
        </Box>
      </Box>
    </Box>
  );
}

"use client";

import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useColorScheme } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import logoLight from '@/app/logo.png';
import logoDark from '@/app/logo-dark-mode.webp';
import { AppBar, Button, Container, Link, Stack, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemText, Divider, Box, ListSubheader, ListItemIcon, Tooltip, Menu, MenuItem } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import MarkunreadOutlinedIcon from '@mui/icons-material/MarkunreadOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import MenuIcon from '@mui/icons-material/Menu';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useTranslation } from 'react-i18next';
import useAxios from 'axios-hooks';
import { Chip } from '@mui/material';
import useLocale from '@/hooks/useLocale';
import NotificationsBell from '@/components/NotificationsBell';

// keep a stable reference to avoid re-fetch loops
const allowAllStatus = () => true;

export default function Navbar() {
  const { mode } = useColorScheme();
  const logoSrc = mode === 'dark' ? logoDark : logoLight;
  const pathname = usePathname();
  const trigger = useScrollTrigger({ threshold: 8, disableHysteresis: true });

  const { t } = useTranslation();
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const current = `/${(pathname || '/').split('/').filter(Boolean).slice(1).join('/')}`;
  const [open, setOpen] = React.useState(false);
  const cfg = React.useMemo(() => ({ url: '/api/auth/me', validateStatus: allowAllStatus }), []);
  const [{ data: me }] = useAxios(cfg);
  const rawRole: string | undefined = me?.user?.role;
  const role = rawRole === 'professor' ? 'executive' : rawRole === 'user' ? 'member' : rawRole;
  const [{ data: channels }, fetchChannels] = useAxios({ url: '/api/chat/channels', params: { counts: 'true' } }, { manual: true });
  const unreadChannels = React.useMemo(() => {
    const items: any[] = channels?.items || [];
    return items.reduce((acc, c: any) => acc + (Number(c.unread || 0)), 0);
  }, [channels]);
  const [{ data: notifCount }, fetchNotif] = useAxios({ url: '/api/notifications/count' }, { manual: true });
  const unreadNotifs = Number((notifCount as any)?.unread || 0);
  const [chatEnabled, setChatEnabled] = React.useState<boolean>(!(process.env.NEXT_PUBLIC_DISABLE_CHAT === '1' || process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true'));
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/settings/public/features', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (typeof data?.chatEnabled === 'boolean') setChatEnabled(Boolean(data.chatEnabled));
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  // Defer non-critical API calls to idle time to improve LCP
  React.useEffect(() => {
    let idleId: number | null = null;
    const schedule = (cb: () => void) => {
      const ric: any = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        idleId = ric(() => cb());
      } else {
        idleId = window.setTimeout(cb, 0);
      }
    };
    schedule(() => {
      void fetchNotif();
      void fetchChannels();
    });
    return () => {
      const cic: any = (window as any).cancelIdleCallback;
      if (idleId && typeof cic === 'function') cic(idleId);
      if (idleId && typeof cic !== 'function') window.clearTimeout(idleId);
    };
  }, [fetchNotif, fetchChannels]);

  const links = React.useMemo(() => {
    const arr = [
      { href: `/${locale}/solutions`, key: 'solutions', label: t('solutions') },
      { href: `/${locale}/capabilities`, key: 'capabilities', label: t('capabilities') },
      { href: `/${locale}/team`, key: 'team', label: t('team') },
      { href: `/${locale}/notifications`, key: 'notifications', label: (t('notifications') as any) || 'Notifications' },
      ...(chatEnabled ? [ { href: `/${locale}/chat`, key: 'chat', label: (t('chat') as any) || 'Chat' } ] : []),
      { href: `/${locale}/blog`, key: 'blog', label: t('blog') },
      { href: `/${locale}/case-studies`, key: 'case-studies', label: t('case_studies') },
      { href: `/${locale}/jobs`, key: 'jobs', label: t('jobs') },
      { href: `/${locale}/contact`, key: 'contact', label: t('contact') },
    ] as Array<{ href: string; key: string; label: any }>;
    // Keep Navbar lean; admin links live in AdminLayout side menu
    return arr;
  }, [locale, t, chatEnabled]);
  const roleLabel = role === 'admin' ? t('user_role_admin') : role === 'executive' ? t('user_role_executive') : role === 'volunteer' ? t('user_role_volunteer') : role ? t('user_role_member') : null;
  const roleColor: any = role === 'admin' ? 'secondary' : role === 'executive' ? 'info' : role === 'member' ? 'success' : 'warning';
  const [adminAnchor, setAdminAnchor] = React.useState<null | HTMLElement>(null);
  const openAdmin = Boolean(adminAnchor);
  const [roleAnchor, setRoleAnchor] = React.useState<null | HTMLElement>(null);
  const openRole = Boolean(roleAnchor);
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={trigger ? 4 : 0}
      sx={{
        transition: 'background-color .2s ease, box-shadow .2s ease, border-color .2s ease',
        backdropFilter: 'blur(10px)',
        bgcolor: (theme) => (trigger ? (theme.palette.mode === 'dark' ? 'rgba(18,18,18,0.72)' : 'rgba(255,255,255,0.8)') : 'transparent'),
        borderBottom: (theme) => (trigger ? `1px solid ${theme.palette.divider}` : '1px solid transparent'),
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: { xs: 1, md: 2 }, minHeight: { xs: 52, sm: 64 } }}>
          <Stack direction="row" spacing={{ xs: .5, md: 1 }} alignItems="center" sx={{ minWidth: 0 }}>
            <Link component={NextLink} href={`/${locale}`} underline="none" color="inherit" sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: .5, md: 1 }, minWidth: 0, color: (t) => (t.palette.mode === 'dark' ? 'common.white' : 'text.primary') }}>
              <Image src={logoSrc} alt={(t('logo_alt') as any) || 'IEEE logo'} height={20} />
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  fontSize: { xs: 16, md: 'inherit' },
                  whiteSpace: 'normal',
                  lineHeight: 1.25
                }}
                suppressHydrationWarning
              >
                {t('name')}
              </Typography>
            </Link>
          </Stack>
          <Stack direction="row" gap={.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {links.map((l) => {
              const active = current.startsWith('/' + l.key);
              const hot = l.key === 'solutions' || l.key === 'blog' || l.key === 'case-studies';
              return (
                  <Button key={l.key} component={NextLink} href={l.href} variant={active ? 'contained' : 'text'} size="small" sx={{ color: (t) => (t.palette.mode === 'dark' ? 'common.white' : 'text.primary') }}>
                    {l.key === 'notifications' ? (
                      <span suppressHydrationWarning>
                        {l.label}{' '}
                        {!!unreadNotifs && <Chip size="small" color="error" label={unreadNotifs} sx={{ ml: 0.5 }} />}
                      </span>
                    ) : l.key === 'chat' ? (
                      <span suppressHydrationWarning>
                        {l.label}{' '}
                        {!!unreadChannels && <Chip size="small" color="error" label={unreadChannels} sx={{ ml: 0.5 }} />}
                      </span>
                    ) : (
                      <span suppressHydrationWarning>{l.label}</span>
                    )}
                  </Button>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            {isRtl && (
              <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setOpen(true)} aria-label="menu">
                <MenuIcon />
              </IconButton>
            )}
            {role === 'admin' && (
              <>
                <Tooltip title={(t('user_role_admin') as any) || 'Admin'}>
                  <IconButton color="inherit" onClick={(e) => setAdminAnchor(e.currentTarget)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }} aria-label="admin">
                    <DashboardOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={adminAnchor} open={openAdmin} onClose={() => setAdminAnchor(null)} keepMounted>
                  <MenuItem component={NextLink} href={`/${locale}/admin`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><DashboardOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('dashboard') as any) || 'Dashboard'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/users`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><PeopleAltOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('users') as any) || 'Users'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/media`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><PermMediaOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('media') as any) || 'Media'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/solutions`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><ExtensionOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('solutions') as any) || 'Solutions'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/jobs`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><WorkOutlineIcon /></ListItemIcon>
                    <ListItemText primary={(t('jobs') as any) || 'Jobs'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/blog`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><ArticleOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('blog') as any) || 'Blog'} />
                  </MenuItem>
                  <Divider />
                  <MenuItem component={NextLink} href={`/${locale}/admin/chat/channels`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><ForumOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('channels') as any) || 'Channels'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/membership`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><HowToRegOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('membership') as any) || 'Membership'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/admin/contact-messages`} onClick={() => setAdminAnchor(null)}>
                    <ListItemIcon><MarkunreadOutlinedIcon /></ListItemIcon>
                    <ListItemText primary={(t('messages') as any) || 'Messages'} />
                  </MenuItem>
                </Menu>
              </>
            )}
            {me?.user && role && role !== 'admin' && (
              <>
                <Tooltip title={
                  role === 'executive' ? ((t('user_role_executive') as any) || 'Executive') :
                  role === 'volunteer' ? ((t('user_role_volunteer') as any) || 'Volunteer') :
                  ((t('user_role_member') as any) || 'Member')
                }>
                  <IconButton color="inherit" onClick={(e) => setRoleAnchor(e.currentTarget)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }} aria-label="role">
                    {role === 'executive' ? <WorkspacePremiumOutlinedIcon /> : role === 'volunteer' ? <VolunteerActivismOutlinedIcon /> : <PersonOutlineIcon />}
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={roleAnchor} open={openRole} onClose={() => setRoleAnchor(null)} keepMounted>
                  <MenuItem component={NextLink} href={`/${locale}/${role}`} onClick={() => setRoleAnchor(null)}>
                    <ListItemIcon>{role === 'executive' ? <WorkspacePremiumOutlinedIcon /> : role === 'volunteer' ? <VolunteerActivismOutlinedIcon /> : <PersonOutlineIcon />}</ListItemIcon>
                    <ListItemText primary={(t('dashboard') as any) || 'Panel'} />
                  </MenuItem>
                  <MenuItem component={NextLink} href={`/${locale}/profile`} onClick={() => setRoleAnchor(null)}>
                    <ListItemIcon><PersonOutlineIcon /></ListItemIcon>
                    <ListItemText primary={(t('profile') as any) || 'Profile'} />
                  </MenuItem>
                  {role === 'executive' && [
                    <Divider key="exec-div" />,
                    (
                      <MenuItem key="exec-membership" component={NextLink} href={`/${locale}/executive/membership`} onClick={() => setRoleAnchor(null)}>
                        <ListItemIcon><HowToRegOutlinedIcon /></ListItemIcon>
                        <ListItemText primary={(t('membership') as any) || 'Membership'} />
                      </MenuItem>
                    ),
                    (
                      <MenuItem key="exec-messages" component={NextLink} href={`/${locale}/executive/contact-messages`} onClick={() => setRoleAnchor(null)}>
                        <ListItemIcon><MarkunreadOutlinedIcon /></ListItemIcon>
                        <ListItemText primary={(t('messages') as any) || 'Messages'} />
                      </MenuItem>
                    )
                  ]}
                </Menu>
              </>
            )}
            <NotificationsBell />
            <LanguageToggle />
            <ThemeToggle />
            {me?.user ? (
              <form action="/api/auth/logout" method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="redirect" value={`/${locale}`} />
                <Button type="submit" size="small" variant="text" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <span suppressHydrationWarning>{t('logout')}</span>
                </Button>
              </form>
            ) : (
              <Button component={NextLink} href={`/${locale}/signin`} size="small" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' }, height: 36, lineHeight: 1.2, px: 1.75, color: (t) => (t.palette.mode === 'dark' ? 'common.white' : 'text.primary'), borderColor: (t) => (t.palette.mode === 'dark' ? 'common.white' : t.palette.divider), whiteSpace: 'nowrap' }}>
                <span suppressHydrationWarning>{t('sign_in')}</span>
              </Button>
            )}
            {!isRtl && (
              <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setOpen(true)} aria-label="menu">
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </Container>
      <Drawer anchor={isRtl ? 'right' : 'left'} open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' } }}>
        <Box sx={{ width: 280, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }} role="presentation" onClick={() => setOpen(false)}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Image src={logoSrc} alt={(t('logo_alt') as any) || 'logo'} height={20} />
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 200 }} suppressHydrationWarning>{t('name')}</Typography>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <List>
            {links.map((l) => (
              <ListItemButton key={l.key} component={NextLink} href={l.href}>
                <ListItemText
                  primary={l.key === 'notifications' && !!unreadNotifs ? (
                    <span suppressHydrationWarning>
                      {l.label}{' '}<Chip size="small" color="error" label={unreadNotifs} />
                    </span>
                  ) : l.key === 'chat' && !!unreadChannels ? (
                    <span suppressHydrationWarning>
                      {l.label}{' '}<Chip size="small" color="error" label={unreadChannels} />
                    </span>
                  ) : l.label}
                  primaryTypographyProps={{ suppressHydrationWarning: true }}
                />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            {me?.user ? (
              <>
                {role === 'member' && (
                  <>
                    <ListSubheader component="div" sx={{ lineHeight: 2.2 }}>{(t('user_role_member') as any) || 'Member'}</ListSubheader>
                    <ListItemButton component={NextLink} href={`/${locale}/member`}>
                      <ListItemIcon><PersonOutlineIcon /></ListItemIcon>
                      <ListItemText primary={(t('dashboard') as any) || 'Panel'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                  </>
                )}
                {role === 'volunteer' && (
                  <>
                    <ListSubheader component="div" sx={{ lineHeight: 2.2 }}>{(t('user_role_volunteer') as any) || 'Volunteer'}</ListSubheader>
                    <ListItemButton component={NextLink} href={`/${locale}/volunteer`}>
                      <ListItemIcon><VolunteerActivismOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('dashboard') as any) || 'Panel'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                  </>
                )}
                {role === 'executive' && (
                  <>
                    <ListSubheader component="div" sx={{ lineHeight: 2.2 }}>{(t('user_role_executive') as any) || 'Executive'}</ListSubheader>
                    <ListItemButton component={NextLink} href={`/${locale}/executive`}>
                      <ListItemIcon><WorkspacePremiumOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('dashboard') as any) || 'Panel'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <ListSubheader component="div" sx={{ lineHeight: 2.2 }}>{(t('user_role_admin') as any) || 'Admin'}</ListSubheader>
                    <ListItemButton component={NextLink} href={`/${locale}/admin`}>
                      <ListItemIcon><DashboardOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('dashboard') as any) || 'Dashboard'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/users`}>
                      <ListItemIcon><PeopleAltOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('users') as any) || 'Users'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/media`}>
                      <ListItemIcon><PermMediaOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('media') as any) || 'Media'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/solutions`}>
                      <ListItemIcon><ExtensionOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('solutions') as any) || 'Solutions'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/jobs`}>
                      <ListItemIcon><WorkOutlineIcon /></ListItemIcon>
                      <ListItemText primary={(t('jobs') as any) || 'Jobs'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/blog`}>
                      <ListItemIcon><ArticleOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('blog') as any) || 'Blog'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <Divider sx={{ my: 0.5 }} />
                    <ListItemButton component={NextLink} href={`/${locale}/admin/chat/channels`}>
                      <ListItemIcon><ForumOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('channels') as any) || 'Channels'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/membership`}>
                      <ListItemIcon><HowToRegOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('membership') as any) || 'Membership'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                    <ListItemButton component={NextLink} href={`/${locale}/admin/contact-messages`}>
                      <ListItemIcon><MarkunreadOutlinedIcon /></ListItemIcon>
                      <ListItemText primary={(t('messages') as any) || 'Messages'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
                    </ListItemButton>
                  </>
                )}
              </>
            ) : (
              <ListItemButton component={NextLink} href={`/${locale}/signin`}>
                <ListItemText primary={(t('sign_in') as any) || 'Sign in'} primaryTypographyProps={{ suppressHydrationWarning: true }} />
              </ListItemButton>
            )}
          </List>
          <Box sx={{ mt: 'auto' }}>
            {me?.user && (
              <form action="/api/auth/logout" method="post">
                <input type="hidden" name="redirect" value={`/${locale}`} />
                <Button type="submit" fullWidth variant="text">{t('logout') as any}</Button>
              </form>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}

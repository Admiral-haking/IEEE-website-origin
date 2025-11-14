"use client";
import React from 'react';
import { Box, Divider, Drawer, IconButton, Link, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack, Paper } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import useLocale from '@/hooks/useLocale';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import EventIcon from '@mui/icons-material/Event';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTranslation } from 'react-i18next';
import useAxios from 'axios-hooks';
import AdminAccessAlert from '@/components/AdminAccessAlert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { hasPermission } from '@/constants/permissions';

const allowAllStatus = () => true;

const drawerWidth = 240;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((v) => !v);
  const { t } = useTranslation();
  const [{ data: me, error: meError }] = useAxios({ url: '/api/auth/me', validateStatus: allowAllStatus });
  const role: 'member'|'volunteer'|'executive'|'admin'|'user'|'professor' = me?.user?.role || 'member';
  const normalizedRole = role === 'professor' ? 'executive' : role === 'user' ? 'member' : role;
  const isAdmin = normalizedRole === 'admin';
  const isExecutivePlus = normalizedRole === 'executive' || normalizedRole === 'admin';
  const permissions = (me?.user as any)?.permissions || {};
  const canAccessUsers = normalizedRole === 'admin' || hasPermission(permissions, 'admin.users');
  const canAccessPermissions = normalizedRole === 'admin' || hasPermission(permissions, 'admin.permissions');
  const canAccessContact = isExecutivePlus || hasPermission(permissions, 'operations.contact');
  const canAccessMembership = isExecutivePlus || hasPermission(permissions, 'operations.membership');
  const canAccessTeam = isExecutivePlus || hasPermission(permissions, 'content.team');
  const canAccessPages = isExecutivePlus || hasPermission(permissions, 'content.pages');
  const canAccessSolutions = isExecutivePlus || hasPermission(permissions, 'content.solutions');
  const canAccessCapabilities = isExecutivePlus || hasPermission(permissions, 'content.capabilities');
  const canAccessBlog = isExecutivePlus || hasPermission(permissions, 'content.blog');
  const canAccessCaseStudies = isExecutivePlus || hasPermission(permissions, 'content.caseStudies');
  const canAccessJobs = isExecutivePlus || hasPermission(permissions, 'content.jobs');
  const canAccessEvents = isExecutivePlus || hasPermission(permissions, 'content.events');
  const canAccessMedia = isExecutivePlus || hasPermission(permissions, 'content.media');
  const canAccessChat = isExecutivePlus || hasPermission(permissions, 'operations.chatModeration');

  const locale = useLocale();
  const router = useRouter();
  React.useEffect(() => {
    const status = (meError as any)?.response?.status;
    if (status === 401) {
      try { router.replace(`/${locale}/signin`); } catch {}
    }
  }, [meError, router, locale]);
  const nav = (
    <Box role="presentation" sx={{ width: { xs: drawerWidth, md: '100%' }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600} suppressHydrationWarning>{t('admin')}</Typography>
        <Link component={NextLink} href={`/${locale}`} underline="hover" color="inherit" sx={{ fontSize: 12 }} suppressHydrationWarning>{t('home') || 'Home'}</Link>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton component={NextLink} href={`/${locale}/admin`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
          <ListItemIcon><DashboardOutlinedIcon /></ListItemIcon>
          <ListItemText
            primary={t('dashboard')}
            secondary={t('nav_dashboard_sub')}
            primaryTypographyProps={{ suppressHydrationWarning: true }}
            secondaryTypographyProps={{ suppressHydrationWarning: true }}
          />
        </ListItemButton>
        {canAccessUsers && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/users`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><PeopleAltOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('users')}
              secondary={t('nav_users_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessContact && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/contact-messages`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><MailOutlineIcon /></ListItemIcon>
            <ListItemText
              primary={t('messages') || 'Messages'}
              secondary={t('nav_messages_sub') || 'Manage contact messages'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessMembership && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/membership`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><HowToRegOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('membership') as any || 'Membership'}
              secondary={t('membership_review_desc') as any || 'Review applications'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessChat && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/chat/channels`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><GroupOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('channels') as any || 'Channels'}
              secondary={t('channels_admin_sub') as any || 'Manage chat channels'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessEvents && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/events`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><EventIcon /></ListItemIcon>
            <ListItemText
              primary={t('events') as any || 'Events'}
              secondary={t('nav_events_sub') as any || 'Workshops, talks, meetups'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessPermissions && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/permissions`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><TuneOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('permissions') as any || 'Permissions'}
              secondary={(t('permissions_sub') as any) || 'Fine-grained permissions'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {(isAdmin || canAccessPermissions) && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/settings`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><SettingsOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('site_settings') as any || 'Site settings'}
              secondary={(t('settings_sub') as any) || 'Feature toggles'}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessTeam && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/team-members`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><GroupOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('team_members')}
              secondary={t('nav_team_members_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessPages && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/pages`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><DescriptionOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('pages')}
              secondary={t('nav_pages_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessSolutions && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/solutions`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><CategoryOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('solutions')}
              secondary={t('nav_solutions_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessCapabilities && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/capabilities`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><AutoAwesomeOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('capabilities')}
              secondary={t('nav_capabilities_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessBlog && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/blog`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><ArticleOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('blog')}
              secondary={t('nav_blog_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessCaseStudies && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/case-studies`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><ArticleOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('case_studies')}
              secondary={t('nav_case_studies_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessJobs && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/jobs`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><WorkOutlineOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('jobs')}
              secondary={t('nav_jobs_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {canAccessMedia && (
          <ListItemButton component={NextLink} href={`/${locale}/admin/media`} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon><CollectionsOutlinedIcon /></ListItemIcon>
            <ListItemText
              primary={t('media')}
              secondary={t('nav_media_sub')}
              primaryTypographyProps={{ suppressHydrationWarning: true }}
              secondaryTypographyProps={{ suppressHydrationWarning: true }}
            />
          </ListItemButton>
        )}
        {/* Access documentation moved to public Help; remove from admin sidebar */}
      </List>
      {me?.user && (
        <Box sx={{ mt: 'auto' }}>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight={700}>{(locale === 'fa' ? ((me.user as any).full_name || me.user.name) : (me.user.name || (me.user as any).full_name)) || me.user.email}</Typography>
                <Typography variant="caption" color="text.secondary">{t('email_label')}: {me.user.email}</Typography>
                <Typography variant="caption" color="text.secondary">{t('role_label')}: {t(normalizedRole === 'admin' ? 'user_role_admin' : normalizedRole === 'executive' ? 'user_role_executive' : normalizedRole === 'volunteer' ? 'user_role_volunteer' : 'user_role_member')}</Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );

  // Compute RTL from URL locale to keep SSR/CSR in sync
  const isRtl = locale === 'fa';
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="admin navigation">
        <Drawer
          variant="temporary"
          open={open}
          onClose={toggle}
          ModalProps={{ keepMounted: true }}
          anchor={isRtl ? 'right' : 'left'}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {nav}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          anchor={isRtl ? 'right' : 'left'}
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {nav}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar sx={{ display: { md: 'none' }, justifyContent: 'space-between' }}>
          <IconButton onClick={toggle} aria-label={t('menu') || 'menu'}><MenuIcon /></IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" suppressHydrationWarning>{t('admin_panel')}</Typography>
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

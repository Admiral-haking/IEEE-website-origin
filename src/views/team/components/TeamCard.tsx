"use client";

import React from 'react';
import { Avatar, Card, CardContent, Stack, Typography, Chip, IconButton, Tooltip, Box } from '@mui/material';
import NextLink from 'next/link';
import useLocale from '@/hooks/useLocale';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import CodeIcon from '@mui/icons-material/Code';
import MemoryIcon from '@mui/icons-material/Memory';
import RouterIcon from '@mui/icons-material/Router';
import ComputerIcon from '@mui/icons-material/Computer';

export type TeamMember = {
  _id: string;
  name: string;
  role: string;
  discipline: 'software'|'hardware'|'networking'|'computer';
  email?: string;
  avatarUrl?: string;
  location?: string;
  skills?: string[];
  socials?: { github?: string; linkedin?: string; twitter?: string; website?: string };
  slug?: string;
};

export default function TeamCard({ member }: { member: TeamMember }) {
  const locale = useLocale();
  const [chipColor, setChipColor] = React.useState<'default'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>(
    member.discipline === 'software' ? 'primary' : member.discipline === 'hardware' ? 'success' : 'info'
  );
  const [iconColor, setIconColor] = React.useState<'inherit'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>('inherit');
  const [iconName, setIconName] = React.useState<string>('');
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/settings/public/features', { cache: 'no-store' });
        const data = await res.json();
        const team = data?.ui?.team || {};
        if (active && team.chipColors && team.chipColors[member.discipline]) setChipColor(team.chipColors[member.discipline]);
        if (active && team.iconColors && team.iconColors[member.discipline]) setIconColor(team.iconColors[member.discipline]);
        if (active && team.iconNames && team.iconNames[member.discipline]) setIconName(team.iconNames[member.discipline]);
      } catch {}
    })();
    return () => { active = false; };
  }, [member.discipline]);
  const renderIcon = () => {
    const map: Record<string, JSX.Element> = {
      code: <CodeIcon color={iconColor} fontSize="small" />,
      memory: <MemoryIcon color={iconColor} fontSize="small" />,
      router: <RouterIcon color={iconColor} fontSize="small" />,
      computer: <ComputerIcon color={iconColor} fontSize="small" />,
    };
    if (iconName && map[iconName]) return map[iconName];
    // defaults
    if (member.discipline === 'software') return <CodeIcon color={iconColor} fontSize="small" />;
    if (member.discipline === 'hardware') return <MemoryIcon color={iconColor} fontSize="small" />;
    if (member.discipline === 'networking') return <RouterIcon color={iconColor} fontSize="small" />;
    return <ComputerIcon color={iconColor} fontSize="small" />;
  };
  const initials = member.name.split(' ').map((s) => s[0]).slice(0,2).join('').toUpperCase();
  const skills = Array.isArray(member.skills) ? member.skills.slice(0, 3) : [];
  const socials = member.socials || {};
  const href = member.slug ? `/${locale}/team/${member.slug}` : undefined;
  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform .15s ease, box-shadow .15s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar variant="circular" src={member.avatarUrl || undefined} sx={{ width: 48, height: 48, fontSize: 18 }}>{initials}</Avatar>
            <Stack sx={{ minWidth: 0 }}>
              {href ? (
                <Typography component={NextLink as any} href={href} fontWeight={700} noWrap title={member.name} sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {member.name}
                </Typography>
              ) : (
                <Typography fontWeight={700} noWrap title={member.name}>{member.name}</Typography>
              )}
              <Typography variant="body2" color="text.secondary" noWrap title={member.role}>{member.role}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minHeight: 28 }}>
                <Chip size="small" label={member.discipline} color={chipColor as any} variant="outlined" icon={renderIcon()} />
                {member.location && (
                  <Typography variant="caption" color="text.secondary" noWrap title={member.location}>• {member.location}</Typography>
                )}
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
              {member.email && (
                <Tooltip title={member.email}><IconButton size="small" href={`mailto:${member.email}`}><MailOutlineIcon fontSize="small" /></IconButton></Tooltip>
              )}
              {socials.github && (
                <Tooltip title="GitHub"><IconButton size="small" href={socials.github} target="_blank" rel="noreferrer"><GitHubIcon fontSize="small" /></IconButton></Tooltip>
              )}
              {socials.linkedin && (
                <Tooltip title="LinkedIn"><IconButton size="small" href={socials.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon fontSize="small" /></IconButton></Tooltip>
              )}
              {socials.website && (
                <Tooltip title="Website"><IconButton size="small" href={socials.website} target="_blank" rel="noreferrer"><LanguageIcon fontSize="small" /></IconButton></Tooltip>
              )}
            </Stack>
          </Stack>
          <Box sx={{ minHeight: 32 }}>
            {!!skills.length && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ maxHeight: 32, overflow: 'hidden' }}>
                {skills.map((s, i) => (
                  <Chip key={i} size="small" label={s} sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Stack>
            )}
          </Box>
          <Box sx={{ mt: 'auto', minHeight: 20 }}>
            {href && (
              <Typography component={NextLink as any} href={href} variant="caption" sx={{ color: 'secondary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                View profile
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

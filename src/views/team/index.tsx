"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { Alert, Box, Container, Grid, Tab, Tabs, Typography, Stack, TextField, InputAdornment, MenuItem, Skeleton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useLocale from '@/hooks/useLocale';
import TeamCard, { TeamMember } from './components/TeamCard';
import { useTranslation } from 'react-i18next';

type TabKey = 'all' | 'software' | 'hardware' | 'networking' | 'computer';

export default function TeamView() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [{ data, loading, error }] = useAxios({ url: `/api/public/team?locale=${locale}`, validateStatus: () => true });
  const [tab, setTab] = React.useState<TabKey>('all');
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<'new'|'name'>('new');
  const [groupBy, setGroupBy] = React.useState<'none'|'role'|'skill'>('none');

  const raw: any = data || {};
  const members: TeamMember[] = (raw.members || raw.items || []).map((m: any) => ({ ...m, _id: String(m._id || m.id) }));
  let filtered = tab === 'all' ? members : members.filter((m: any) => m.discipline === tab);
  const qq = q.trim().toLowerCase();
  if (qq) filtered = filtered.filter((m: any) => [m.name, m.role, m.discipline, ...(m.skills || [])].join(' ').toLowerCase().includes(qq));
  if (sort === 'name') filtered = [...filtered].sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <Container sx={{ py: 6 }}>
      <Typography component="h1" variant="h4" fontWeight={800} gutterBottom suppressHydrationWarning>
        {t('our_team')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={(t('search') as any) || 'Search'}
          size="small"
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
          sx={{ maxWidth: 360 }}
        />
        <TextField select size="small" value={sort} onChange={(e) => setSort(e.target.value as any)} sx={{ width: 160 }}>
          <MenuItem value="new">{t('newest') || 'Newest'}</MenuItem>
          <MenuItem value="name">{t('name_label') || 'Name'}</MenuItem>
        </TextField>
        <TextField select size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} sx={{ width: 180 }}>
          <MenuItem value="none">{t('none') || 'None'}</MenuItem>
          <MenuItem value="role">{t('role_label') || 'Role'}</MenuItem>
          <MenuItem value="skill">{t('skills') || 'Skills'}</MenuItem>
        </TextField>
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="all" label={t('all')} />
        <Tab value="software" label={t('software')} />
        <Tab value="hardware" label={t('hardware')} />
        <Tab value="networking" label={t('networking')} />
        <Tab value="computer" label={t('computer') || 'Computer'} />
      </Tabs>

      {error && <Alert severity="error">{t('error_loading_team')}</Alert>}

      <Grid container spacing={3}>
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ p: 2, borderRadius: 3, border: theme => `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Stack sx={{ flex: 1 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </Stack>
              </Stack>
              <Skeleton sx={{ mt: 1 }} width="80%" />
            </Box>
          </Grid>
        ))}
        {!loading && groupBy === 'none' && filtered.map((m) => (
          <Grid key={m._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <TeamCard member={m} />
          </Grid>
        ))}
        {!loading && groupBy !== 'none' && (
          (() => {
            const groups: Record<string, TeamMember[]> = {} as any;
            if (groupBy === 'role') {
              filtered.forEach((m: any) => { const k = String(m.role || 'Unknown'); (groups[k] ||= []).push(m); });
            } else if (groupBy === 'skill') {
              filtered.forEach((m: any) => {
                const list: string[] = Array.isArray(m.skills) && m.skills.length ? m.skills.slice(0, 1) : ['Other'];
                list.forEach((s) => { const k = String(s); (groups[k] ||= []).push(m); });
              });
            }
            let ordered = Object.entries(groups);
            // Allow runtime-configurable order via public features
            try {
              const g = (window as any).__groupPref;
              if (g && Array.isArray(g)) {
                // sort by preferred order then by key
                const pref = new Map(g.map((k: string, i: number) => [k, i]));
                ordered.sort(([a],[b]) => (pref.get(a) ?? 1e9) - (pref.get(b) ?? 1e9) || a.localeCompare(b));
              } else {
                ordered.sort(([a],[b]) => a.localeCompare(b));
              }
            } catch {
              ordered.sort(([a],[b]) => a.localeCompare(b));
            }
            return ordered.map(([key, arr]) => (
              <React.Fragment key={key}>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">{key}</Typography>
                    <Divider flexItem sx={{ flex: 1 }} />
                  </Stack>
                </Grid>
                {arr.map((m: any) => (
                  <Grid key={m._id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <TeamCard member={m} />
                  </Grid>
                ))}
              </React.Fragment>
            ));
          })()
        )}
        {!loading && filtered.length === 0 && (
          <Box sx={{ color: 'text.secondary' }}>{t('no_members')}</Box>
        )}
      </Grid>
    </Container>
  );
}

"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { usePathname } from 'next/navigation';
import { Box, Card, CardActionArea, CardContent, Chip, Container, Grid2 as Grid, Stack, TextField, Typography, Button, Paper } from '@mui/material';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ProjectsListPage() {
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'fa' ? 'fa' : 'en';
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/projects', params: { q, locale, page: 1, pageSize: 24 } });
  const items: Array<any> = data?.items || [];
  const [{ data: me }] = useAxios({ url: '/api/auth/me' });
  const loggedIn = !!me?.user;

  // Create project form
  const [openCreate, setOpenCreate] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [, createReq] = useAxios({ url: '/api/projects', method: 'POST' }, { manual: true });
  const onCreate = async () => {
    if (!title.trim()) return;
    const payload: any = { title, description, tags: tags.split(',').map((s) => s.trim()).filter(Boolean), locale };
    await createReq({ data: payload });
    setTitle(''); setDescription(''); setTags(''); setOpenCreate(false);
    await refetch();
  };
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('projects_title') as any || 'Projects'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('projects_sub') as any || 'Student-led projects and collaborations'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField size="small" placeholder={(t('search_projects') as any) || 'Search projects'} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} />
          {loggedIn && (
            <Button size="small" variant="contained" color="secondary" onClick={() => setOpenCreate((v) => !v)}>{t('create_project') as any || 'Create project'}</Button>
          )}
        </Stack>
      </Stack>
      {openCreate && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Stack spacing={1.5}>
            <TextField label={t('title_label') as any || 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField label={t('description_label') as any || 'Description'} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label={t('tags_label') as any || 'Tags'} value={tags} onChange={(e) => setTags(e.target.value)} fullWidth helperText={t('tags_help') as any || 'Comma-separated'} />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={onCreate}>{t('create') as any || 'Create'}</Button>
              <Button onClick={() => setOpenCreate(false)}>{t('cancel') as any || 'Cancel'}</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
      <Grid container spacing={2}>
        {items.map((p) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardActionArea component={NextLink} href={`/${locale}/projects/${p.id}`}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700}>{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.description}</Typography>
                  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                    {(p.tags || []).map((t: string) => (<Chip key={t} size="small" label={t} />))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {!loading && items.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">{t('no_projects') as any || 'No projects found'}</Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from '@/lib/axios';
import { usePathname } from 'next/navigation';
import { Box, Card, CardActionArea, CardContent, Chip, Container, Grid2 as Grid, Stack, TextField, Typography, Button, MenuItem } from '@mui/material';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

export default function MyProjectsPage() {
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'fa' ? 'fa' : 'en';
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const [sort, setSort] = React.useState('createdAt:desc');
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/projects', params: { q, mine: 'true', page, pageSize, sort } });
  const items: Array<any> = data?.items || [];
  const total = Number((data as any)?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const onDelete = async (id: string) => { try { await axios.delete(`/api/projects/${id}`); await refetch(); } catch {} };
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('projects_title') as any || 'Projects'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('my_projects_sub') as any || 'Projects you created'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField size="small" placeholder={t('search_projects') as any || 'Search projects'} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); refetch(); } }} />
          <TextField size="small" select label={t('sort') as any || 'Sort'} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <MenuItem value="createdAt:desc">{t('newest') as any || 'Newest'}</MenuItem>
            <MenuItem value="createdAt:asc">{t('oldest') as any || 'Oldest'}</MenuItem>
            <MenuItem value="title:asc">{t('title_label') as any || 'Title'} ↑</MenuItem>
            <MenuItem value="title:desc">{t('title_label') as any || 'Title'} ↓</MenuItem>
          </TextField>
          <TextField size="small" select label={t('rows_per_page') as any || 'Rows'} value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value as any, 10)); setPage(1); }}>
            {[6,12,24,48].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
          </TextField>
        </Stack>
      </Stack>
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
              <Stack direction="row" spacing={1} sx={{ p: 1, pt: 0, justifyContent: 'flex-end' }}>
                <Button size="small" component={NextLink} href={`/${locale}/projects/${p.id}`}>{t('edit') as any || 'Edit'}</Button>
                <Button size="small" color="error" onClick={() => onDelete(p.id)}>{t('delete') as any || 'Delete'}</Button>
              </Stack>
            </Card>
          </Grid>
        ))}
        {!loading && items.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">{t('no_projects') as any || 'No projects found'}</Typography>
          </Grid>
        )}
      </Grid>
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
        <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('prev') as any || 'Prev'}</Button>
        <Typography variant="caption" color="text.secondary">{page} / {totalPages}</Typography>
        <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('next') as any || 'Next'}</Button>
      </Stack>
    </Container>
  );
}

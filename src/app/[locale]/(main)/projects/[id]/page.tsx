"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { useParams } from 'next/navigation';
import { Chip, Container, Paper, Stack, Typography, Button, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
// removed duplicate import of useAxios

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String((params as any)?.id || '');
  const [{ data, error }] = useAxios({ url: `/api/projects/${id}` });
  const p = data?.project;
  const { t } = useTranslation();
  const [{ data: me }] = useAxios({ url: '/api/auth/me' });
  const userId = me?.user?.id;
  const role = me?.user?.role;
  const canEdit = !!p && (userId === p.createdBy || role === 'admin' || role === 'executive');
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [, patch] = useAxios({ method: 'PATCH' }, { manual: true });
  React.useEffect(() => {
    if (!p) return;
    setTitle(p.title || '');
    setDescription(p.description || '');
    setTags((p.tags || []).join(','));
  }, [p]);
  const onSave = async () => {
    await patch({ url: `/api/projects/${id}` , data: { title, description, tags: tags.split(',').map((s)=>s.trim()).filter(Boolean) } });
    setEditing(false);
  };
  return (
    <Container sx={{ py: 3 }}>
      {error && <Typography color="error">{t('load_failed') as any || 'Failed to load project'}</Typography>}
      {!p && !error && <Typography color="text.secondary">{t('loading') as any || 'Loading…'}</Typography>}
      {p && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          {!editing && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Typography variant="h5" fontWeight={800}>{p.title}</Typography>
                {canEdit && <Button size="small" variant="outlined" onClick={() => setEditing(true)}>{t('edit_project') as any || 'Edit project'}</Button>}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{p.description}</Typography>
              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                {(p.tags || []).map((t: string) => (<Chip key={t} size="small" label={t} />))}
              </Stack>
            </>
          )}
          {editing && (
            <Stack spacing={1.5}>
              <TextField label={t('title_label') as any || 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
              <TextField label={t('description_label') as any || 'Description'} value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} />
              <TextField label={t('tags_label') as any || 'Tags'} value={tags} onChange={(e) => setTags(e.target.value)} fullWidth helperText={t('tags_help') as any || 'Comma-separated'} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={onSave}>{t('save') as any || 'Save'}</Button>
                <Button onClick={() => setEditing(false)}>{t('cancel') as any || 'Cancel'}</Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      )}
    </Container>
  );
}

"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { Chip, Container, Paper, Stack, Typography, Button, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type ProjectView = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  createdBy: string;
};

export default function ProjectDetailClient({ project, canEditInitial }: { project: ProjectView; canEditInitial: boolean }) {
  const p = project;
  const { t } = useTranslation();
  const canEdit = canEditInitial;
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(p.title || '');
  const [description, setDescription] = React.useState(p.description || '');
  const [tags, setTags] = React.useState((p.tags || []).join(','));
  const [, patch] = useAxios({ method: 'PATCH' }, { manual: true });
  const [saving, setSaving] = React.useState(false);
  const onSave = async () => {
    try {
      setSaving(true);
      await patch({ url: `/api/projects/${p.id}`, data: { title, description, tags: tags.split(',').map((s)=>s.trim()).filter(Boolean) } });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Container sx={{ py: 3 }}>
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
              <Button variant="contained" onClick={onSave} disabled={saving}>{t('save') as any || 'Save'}</Button>
              <Button onClick={() => setEditing(false)} disabled={saving}>{t('cancel') as any || 'Cancel'}</Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}


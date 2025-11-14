"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox, Box, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TitleIcon from '@mui/icons-material/Title';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import TagOutlinedIcon from '@mui/icons-material/SellOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PostFormSchema } from '@/validators/forms/blog';
import Editor from '@/components/Editor';
import { useTranslation } from 'react-i18next';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import Image from 'next/image';

const Schema = PostFormSchema;
type Values = z.infer<typeof PostFormSchema>;

export default function PostDialog({ open, onClose, initial, onSubmit }: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Values>;
  onSubmit: (values: Values) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: '', slug: '', excerpt: '', contentHtml: '', coverFileId: '', tags: '', published: false }
  });
  React.useEffect(() => { reset({ title: initial?.title || '', slug: initial?.slug || '', excerpt: (initial as any)?.excerpt || '', contentHtml: (initial as any)?.contentHtml || '', tags: Array.isArray((initial as any)?.tags) ? ((initial as any).tags as string[]).join(', ') : ((initial as any)?.tags || ''), published: !!(initial as any)?.published }); }, [initial, reset]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const coverId = watch('coverFileId');
  const coverSrc = coverId ? `/api/media/${coverId}` : '';
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const labelProps = isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;

  const titleId = React.useId();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial?.title ? t('edit_post') : t('add_post')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField label={t('title_label')} {...register('title')} error={!!errors.title} helperText={errors.title?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><TitleIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('slug_label')} {...register('slug')} error={!!errors.slug} helperText={errors.slug?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('excerpt_label')} {...register('excerpt')} InputProps={{ startAdornment: (<InputAdornment position="start"><NotesOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <Editor value={watch('contentHtml')} onChange={(html) => setValue('contentHtml', html)} />
          <Box>
            <Button variant="outlined" size="small" onClick={() => setPickerOpen(true)}>{t('select_image')}</Button>
            {coverSrc && (
              <Box sx={{ mt: 1, position: 'relative', width: '100%', height: 220, borderRadius: 1, overflow: 'hidden' }}>
                <Image src={coverSrc} alt="cover" fill sizes="100vw" style={{ objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
          <TextField label={t('tags_label')} helperText={t('tags_help')} {...register('tags')} InputProps={{ startAdornment: (<InputAdornment position="start"><TagOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <FormControlLabel control={<Checkbox checked={watch('published')} onChange={(e) => setValue('published', e.target.checked)} />} label={t('published')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { const payload: any = { ...v, tags: v.tags ? v.tags.split(',').map((s) => s.trim()).filter(Boolean) : [] }; await onSubmit(payload); onClose(); })} variant="contained" color="secondary" disabled={isSubmitting}>{initial?.title ? t('save') : t('create')}</Button>
      </DialogActions>
      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(f) => setValue('coverFileId', f.id)} />
    </Dialog>
  );
}

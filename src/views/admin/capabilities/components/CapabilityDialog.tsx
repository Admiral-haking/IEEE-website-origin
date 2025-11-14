"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Box, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TitleIcon from '@mui/icons-material/Title';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CapabilityFormSchema } from '@/validators/forms/capability';
import { useTranslation } from 'react-i18next';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import Image from 'next/image';
import Editor from '@/components/Editor';

const Schema = CapabilityFormSchema;

type Values = z.infer<typeof CapabilityFormSchema>;

export default function CapabilityDialog({ open, onClose, initial, onSubmit }: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Values>;
  onSubmit: (values: Values) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: '', slug: '', area: 'software', description: '', contentHtml: '', imageFileId: '' }
  });
  React.useEffect(() => { register('contentHtml'); }, [register]);
  React.useEffect(() => { reset({ title: initial?.title || '', slug: (initial as any)?.slug || '', area: (initial?.area as any) || 'software', description: (initial as any)?.description || '', contentHtml: (initial as any)?.contentHtml || '' }); }, [initial, reset]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const imageId = watch('imageFileId');
  const imageSrc = imageId ? `/api/media/${imageId}` : '';
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const labelProps = isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;

  const titleId = React.useId();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial?.title ? t('edit_capability') : t('add_capability')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField label={t('title_label')} {...register('title')} error={!!errors.title} helperText={errors.title?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><TitleIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('slug_label')} {...register('slug')} error={!!errors.slug} helperText={errors.slug?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField select label={t('area_label')} defaultValue={initial?.area || 'software'} {...register('area')} error={!!errors.area} helperText={errors.area?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><CategoryOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps}>
            <MenuItem value="software">{t('software')}</MenuItem>
            <MenuItem value="hardware">{t('hardware')}</MenuItem>
            <MenuItem value="networking">{t('networking')}</MenuItem>
            <MenuItem value="devops">DevOps</MenuItem>
          </TextField>
          <TextField label={t('description_label')} multiline minRows={3} {...register('description')} InputProps={{ startAdornment: (<InputAdornment position="start"><NotesOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <Editor value={watch('contentHtml')} onChange={(html) => setValue('contentHtml', html, { shouldDirty: true })} />
          <Box>
            <Button variant="outlined" size="small" onClick={() => setPickerOpen(true)}>{t('select_image')}</Button>
            {imageSrc && (
              <Box sx={{ mt: 1, position: 'relative', width: '100%', maxWidth: '100%', height: 220, borderRadius: 1, overflow: 'hidden' }}>
                <Image src={imageSrc} alt="cover" fill sizes="100vw" style={{ objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { await onSubmit(v); onClose(); })} variant="contained" color="secondary" disabled={isSubmitting}>
          {initial?.title ? t('save') : t('create')}
        </Button>
      </DialogActions>
      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(f) => setValue('imageFileId', f.id)} />
    </Dialog>
  );
}

"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, FormControlLabel, Checkbox, Box, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TitleIcon from '@mui/icons-material/Title';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { JobFormSchema } from '@/validators/forms/job';
import Editor from '@/components/Editor';
import { useTranslation } from 'react-i18next';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import Image from 'next/image';

const Schema = JobFormSchema;
type Values = z.infer<typeof JobFormSchema>;

export default function JobDialog({ open, onClose, initial, onSubmit }: { open: boolean; onClose: () => void; initial?: Partial<Values>; onSubmit: (values: any) => Promise<void> | void; }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: '', slug: '', location: 'Remote', type: 'full-time', descriptionHtml: '', requirements: '', applyLink: '', imageFileId: '', published: false }
  });
  React.useEffect(() => { reset({ ...(initial as any) }); }, [initial, reset]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const imageId = watch('imageFileId');
  const imageSrc = imageId ? `/api/media/${imageId}` : '';
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const labelProps = isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;

  const titleId = React.useId();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial?.title ? t('edit_job') : t('add_job')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField label={t('title_label')} {...register('title')} error={!!errors.title} helperText={errors.title?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><TitleIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('slug_label')} {...register('slug')} error={!!errors.slug} helperText={errors.slug?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('location_label')} {...register('location')} InputProps={{ startAdornment: (<InputAdornment position="start"><PlaceOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField select label={t('type_label')} defaultValue={(initial as any)?.type || 'full-time'} {...register('type')} InputProps={{ startAdornment: (<InputAdornment position="start"><WorkOutlineOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps}>
            <MenuItem value="full-time">Full-time</MenuItem>
            <MenuItem value="part-time">Part-time</MenuItem>
            <MenuItem value="contract">Contract</MenuItem>
            <MenuItem value="internship">Internship</MenuItem>
          </TextField>
          <Editor value={watch('descriptionHtml')} onChange={(html) => setValue('descriptionHtml', html)} />
          <TextField multiline rows={4} label={t('requirements_label')} helperText={t('requirements_help')} {...register('requirements')} InputProps={{ startAdornment: (<InputAdornment position="start"><NotesOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <Box>
            <Button variant="outlined" size="small" onClick={() => setPickerOpen(true)}>{t('select_image')}</Button>
            {imageSrc && (
              <Box sx={{ mt: 1, position: 'relative', width: '100%', height: 220, borderRadius: 1, overflow: 'hidden' }}>
                <Image src={imageSrc} alt="cover" fill sizes="100vw" style={{ objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
          <TextField label={t('apply_link_label')} {...register('applyLink')} InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <FormControlLabel control={<Checkbox checked={watch('published')} onChange={(e) => setValue('published', e.target.checked)} />} label={t('published')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { const payload: any = { ...v, requirements: v.requirements ? v.requirements.split('\n').map((s) => s.trim()).filter(Boolean) : [] }; await onSubmit(payload); onClose(); })} variant="contained" color="secondary" disabled={isSubmitting}>{initial?.title ? t('save') : t('create')}</Button>
      </DialogActions>
      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(f) => setValue('imageFileId', f.id)} />
    </Dialog>
  );
}

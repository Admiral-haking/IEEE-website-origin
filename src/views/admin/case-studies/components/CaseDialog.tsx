"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, FormControlLabel, Checkbox, Box, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TitleIcon from '@mui/icons-material/Title';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CaseFormSchema } from '@/validators/forms/case';
import Editor from '@/components/Editor';
import { useTranslation } from 'react-i18next';
import MediaPickerDialog from '@/components/MediaPickerDialog';

const Schema = CaseFormSchema;
type Values = z.infer<typeof CaseFormSchema>;

export default function CaseDialog({ open, onClose, initial, onSubmit }: { open: boolean; onClose: () => void; initial?: Partial<Values>; onSubmit: (values: Values) => Promise<void> | void; }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: '', slug: '', summary: '', contentHtml: '', client: '', industry: '', date: '', coverFileId: '', published: false }
  });
  React.useEffect(() => { reset({ ...(initial as any) }); }, [initial, reset]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const coverId = watch('coverFileId');
  const coverSrc = coverId ? `/api/media/${coverId}` : '';
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const labelProps = isRtl ? { sx: { left: 14, right: 'auto', transformOrigin: 'left top', textAlign: 'left' } } : undefined;

  const titleId = React.useId();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial?.title ? t('edit_case') : t('add_case')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField label={t('title_label')} {...register('title')} error={!!errors.title} helperText={errors.title?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><TitleIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('slug_label')} {...register('slug')} error={!!errors.slug} helperText={errors.slug?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('summary_label')} {...register('summary')} InputProps={{ startAdornment: (<InputAdornment position="start"><NotesOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('client_label')} {...register('client')} InputProps={{ startAdornment: (<InputAdornment position="start"><BusinessCenterOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('industry_label')} {...register('industry')} InputProps={{ startAdornment: (<InputAdornment position="start"><ApartmentOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('date_label')} type="date" {...register('date')} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarMonthOutlinedIcon fontSize="small" /></InputAdornment>) }} />
          <Editor value={watch('contentHtml')} onChange={(html) => setValue('contentHtml', html)} />
          <Box>
            <Button variant="outlined" size="small" onClick={() => setPickerOpen(true)}>{t('select_image')}</Button>
            {coverSrc && (
              <Box sx={{ mt: 1 }}>
                <Box component="img" src={coverSrc} alt="cover" sx={{ maxWidth: '100%', borderRadius: 1 }} />
              </Box>
            )}
          </Box>
          <FormControlLabel control={<Checkbox checked={watch('published')} onChange={(e) => setValue('published', e.target.checked)} />} label={t('published')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { await onSubmit(v); onClose(); })} variant="contained" color="secondary" disabled={isSubmitting}>{initial?.title ? t('save') : t('create')}</Button>
      </DialogActions>
      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(f) => setValue('coverFileId', f.id)} />
    </Dialog>
  );
}

"use client";

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Box, InputAdornment } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MemberFormSchema } from '@/validators/forms/teamMember';
import Editor from '@/components/Editor';
import MediaPickerDialog from '@/components/MediaPickerDialog';
import { useTranslation } from 'react-i18next';

const Schema = MemberFormSchema;

type Values = z.infer<typeof MemberFormSchema>;

export default function MemberDialog({ open, onClose, initial, onSubmit }: { open: boolean; onClose: () => void; initial?: Partial<Values>; onSubmit: (values: any) => Promise<void> | void; }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', slug: '', email: '', role: '', discipline: 'software', avatarUrl: '', location: '', bio: '', skills: '', github: '', linkedin: '', twitter: '', website: '', portfolioLink: '', resumeFileId: '' }
  });
  // Register rich text field so setValue updates are captured
  React.useEffect(() => { register('bio'); }, [register]);
  // Map initial API shape to form fields (flatten socials, stringify skills)
  React.useEffect(() => {
    const i: any = initial || {};
    const socials = i.socials || {};
    const skillsStr = Array.isArray(i.skills) ? i.skills.join(', ') : (i.skills || '');
    reset({
      name: i.name || '',
      slug: i.slug || '',
      email: i.email || '',
      role: i.role || '',
      discipline: i.discipline || 'software',
      avatarUrl: i.avatarUrl || '',
      location: i.location || '',
      bio: i.bio || '',
      skills: skillsStr,
      github: socials.github || '',
      linkedin: socials.linkedin || '',
      twitter: socials.twitter || '',
      website: socials.website || '',
      portfolioLink: i.portfolioLink || '',
      resumeFileId: i.resumeFileId || ''
    });
  }, [initial, reset]);
  const [avatarPicker, setAvatarPicker] = React.useState(false);
  const [resumePicker, setResumePicker] = React.useState(false);
  const avatarUrl = watch('avatarUrl');
  const resumeId = watch('resumeFileId');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial?.name ? t('edit_member') : t('add_member')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('name_label')} {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }} />
            <TextField label={t('slug_label')} {...register('slug')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} />
            <TextField label={t('email_label')} {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><MailOutlineIcon fontSize="small" /></InputAdornment>) }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('role_label')} {...register('role')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><ManageAccountsOutlinedIcon fontSize="small" /></InputAdornment>) }} />
            <TextField select label={t('discipline_label')} defaultValue={(initial as any)?.discipline || 'software'} {...register('discipline')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><SchoolOutlinedIcon fontSize="small" /></InputAdornment>) }}>
              <MenuItem value="software">{t('software')}</MenuItem>
              <MenuItem value="hardware">{t('hardware')}</MenuItem>
              <MenuItem value="networking">{t('networking')}</MenuItem>
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('location_label')} {...register('location')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><PlaceOutlinedIcon fontSize="small" /></InputAdornment>) }} />
            <Box>
              <Button variant="outlined" size="small" onClick={() => setAvatarPicker(true)}>{t('select_image')}</Button>
              {avatarUrl && (
                <Box sx={{ mt: 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="avatar" style={{ maxWidth: 140, borderRadius: 8 }} />
                </Box>
              )}
            </Box>
          </Stack>
          <Editor value={watch('bio')} onChange={(html) => setValue('bio', html)} />
          <TextField label={t('skills_label')} helperText={t('tags_help')} {...register('skills')} InputProps={{ startAdornment: (<InputAdornment position="start"><SellOutlinedIcon fontSize="small" /></InputAdornment>) }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="GitHub" {...register('github')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><GitHubIcon fontSize="small" /></InputAdornment>) }} />
            <TextField label="LinkedIn" {...register('linkedin')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><LinkedInIcon fontSize="small" /></InputAdornment>) }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Twitter" {...register('twitter')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><TwitterIcon fontSize="small" /></InputAdornment>) }} />
            <TextField label={t('website_label')} {...register('website')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><LanguageIcon fontSize="small" /></InputAdornment>) }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('portfolio_label')} {...register('portfolioLink')} fullWidth InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }} />
            <Box>
              <Button variant="outlined" size="small" onClick={() => setResumePicker(true)}>{t('select_resume')}</Button>
              {resumeId && <Box sx={{ mt: 1 }}>{t('selected')}: {resumeId}</Box>}
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { const payload: any = { ...v, socials: { github: v.github, linkedin: v.linkedin, twitter: v.twitter, website: v.website }, skills: v.skills ? v.skills.split(',').map((s) => s.trim()).filter(Boolean) : [] }; if (!payload.slug) delete payload.slug; delete payload.github; delete payload.linkedin; delete payload.twitter; delete payload.website; await onSubmit(payload); onClose(); })} variant="contained" color="secondary" disabled={isSubmitting}>{initial?.name ? t('save') : t('create')}</Button>
      </DialogActions>
      <MediaPickerDialog open={avatarPicker} onClose={() => setAvatarPicker(false)} onSelect={(f) => setValue('avatarUrl', f.src)} />
      <MediaPickerDialog open={resumePicker} onClose={() => setResumePicker(false)} onSelect={(f) => setValue('resumeFileId', f.id)} imagesOnly={false} />
    </Dialog>
  );
}

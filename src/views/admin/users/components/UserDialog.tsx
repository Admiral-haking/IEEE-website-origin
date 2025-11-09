"use client";

import React from 'react';
import { Alert } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, InputAdornment, FormGroup, FormControlLabel, Checkbox, Divider, Typography, Box } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from '@/validators/users';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { PERMISSION_GROUPS, hasPermission, togglePermission, PermissionKey } from '@/constants/permissions';

const CreatingSchema = CreateUserSchema.extend({ permissions: z.any().optional(), phone: z.string().min(5).optional() });
const EditingSchema = UpdateUserSchema.extend({ permissions: z.any().optional() });

type Values = z.infer<typeof CreatingSchema> & z.infer<typeof EditingSchema>;

export default function UserDialog({
  open,
  onClose,
  initial,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Values>;
  onSubmit: (values: Values) => Promise<void> | void;
}) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const creating = !initial?.email;
  const activeSchema = React.useMemo(() => (creating ? CreatingSchema : EditingSchema), [creating]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm<Values>({
    resolver: zodResolver(activeSchema as any),
    defaultValues: { name: '', email: '', role: 'volunteer', password: '' }
  });
  const [perms, setPerms] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const rawRole = (initial as any)?.role as string | undefined;
    const mappedRole = rawRole === 'professor' ? 'executive' : rawRole === 'user' ? 'member' : rawRole;
    reset({
      name: initial?.name || '',
      username: (initial as any)?.username || '',
      email: initial?.email || '',
      phone: (initial as any)?.phone || '',
      major: (initial as any)?.major || '',
      degree: (initial as any)?.degree || '',
      membership_status: (initial as any)?.membership_status || 'pending',
      role: (mappedRole as any) || 'member',
      password: ''
    });
    setPerms((initial as any)?.permissions ? { ...(initial as any).permissions } : {});
  }, [initial, reset]);
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';
  const { t } = useTranslation();
  const labelProps = isRtl ? { sx: { left: 'auto', right: 14, transformOrigin: 'right top', textAlign: 'right' } } : undefined;

  const titleId = React.useId();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial?.email ? t('edit_user') : t('add_user')}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField label={t('full_name_en') as any || t('name_label')} {...register('name')} error={!!errors.name} helperText={errors.name?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('full_name_fa') as any || t('full_name')} {...register('full_name' as any)} InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('username_label') || 'Username'} {...register('username')} error={!!errors.username} helperText={errors.username?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('email_label')} type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><MailOutlineIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField label={t('phone') || 'Phone'} {...register('phone')} error={!!errors.phone} helperText={(errors as any).phone?.message} InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIphoneOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField select label={t('major') || 'Major'} defaultValue={(initial as any)?.major || ''} {...register('major')} InputProps={{ startAdornment: (<InputAdornment position="start"><SchoolOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps}>
            <MenuItem value="">{t('all') || '—'}</MenuItem>
            <MenuItem value="computer">{t('computer') || 'Computer'}</MenuItem>
            <MenuItem value="electrical">{t('electrical') || 'Electrical'}</MenuItem>
          </TextField>
          <TextField label={t('degree') || 'Degree'} {...register('degree')} InputProps={{ startAdornment: (<InputAdornment position="start"><SchoolOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <TextField select label={t('status') || 'Status'} defaultValue={(initial as any)?.membership_status || 'none'} {...register('membership_status')} InputLabelProps={labelProps}>
            <MenuItem value="active">{t('active') || 'Active'}</MenuItem>
            <MenuItem value="expired">{t('expired') || 'Expired'}</MenuItem>
            <MenuItem value="pending">{t('pending') || 'Pending'}</MenuItem>
            <MenuItem value="reviewed">{t('reviewed') || 'Reviewed'}</MenuItem>
            <MenuItem value="approved">{t('approved') || 'Approved'}</MenuItem>
            <MenuItem value="rejected">{t('rejected') || 'Rejected'}</MenuItem>
            <MenuItem value="none">{t('none') || 'None'}</MenuItem>
          </TextField>
          <TextField select label={t('role_label')} defaultValue={initial?.role || 'member'} {...register('role')} error={!!errors.role} helperText={errors.role?.message} InputLabelProps={labelProps} >
            <MenuItem value="member">{t('user_role_member')}</MenuItem>
            <MenuItem value="volunteer">{t('user_role_volunteer')}</MenuItem>
            <MenuItem value="executive">{t('user_role_executive')}</MenuItem>
            <MenuItem value="admin">{t('user_role_admin')}</MenuItem>
          </TextField>
          <TextField label={t('password_label')} type="password" {...register('password')} error={!!errors.password} helperText={initial?.email ? t('leave_blank_password') : (errors.password?.message as any)} InputProps={{ startAdornment: (<InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>) }} InputLabelProps={labelProps} />
          <Divider />
          <Typography variant="subtitle2">{t('permissions') || 'Permissions'}</Typography>
          <Stack gap={2}>
            {PERMISSION_GROUPS.map((group) => (
              <Box key={group.key}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{t(group.labelKey) || group.labelKey}</Typography>
                  {group.descriptionKey && <Typography variant="caption" color="text.secondary">{t(group.descriptionKey) || ''}</Typography>}
                </Stack>
                <FormGroup>
                  {group.permissions.map((perm) => (
                    <FormControlLabel
                      key={perm.key}
                      control={
                        <Checkbox
                          checked={hasPermission(perms, perm.key)}
                          onChange={(e) => setPerms((prev) => togglePermission(prev, perm.key, e.target.checked))}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{t(perm.labelKey) || perm.key}</Typography>
                          {perm.descriptionKey && <Typography variant="caption" color="text.secondary">{t(perm.descriptionKey) || ''}</Typography>}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{t('cancel')}</Button>
        <Button onClick={handleSubmit(async (v) => { try {
          setSubmitError(null);
          // Enforce password on create to match server rules
          if (creating) {
            if (!v.password || !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v.password)) {
              setSubmitError(String(t('password_reset_error') || 'Invalid password: must be 8+ chars, include an uppercase letter and a number'));
              return;
            }
          }
          const managedKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
          const reduced = managedKeys.reduce<Record<string, any>>((acc, key) => {
            if (hasPermission(perms, key)) {
              Object.assign(acc, togglePermission({}, key, true));
            }
            return acc;
          }, {});
          Object.entries(perms || {}).forEach(([k, val]) => {
            if (!managedKeys.includes(k as PermissionKey) && val) {
              reduced[k] = val;
            }
          });
          await onSubmit({ ...v, permissions: reduced } as any);
          onClose();
        } catch (e:any) {
          const res = e?.response;
          const issues = res?.data?.errors as Array<{ path?: any[]; message?: string }> | undefined;
          if (Array.isArray(issues)) {
            issues.forEach((it) => {
              const key = String(it?.path?.[0] || '');
              const msg = it?.message || 'Invalid';
              if (key) setError(key as any, { type: 'server', message: msg });
            });
          }
          // Friendly 409 messages mapping
          let friendly = res?.data?.error || e?.message || 'Failed';
          if (res?.status === 409) {
            const lower = String(res?.data?.error || '').toLowerCase();
            if (lower.includes('email')) { setError('email' as any, { type: 'server', message: (t('email_exists') as any) || 'Email exists' }); friendly = (t('email_exists') as any) || friendly; }
            if (lower.includes('username')) { setError('username' as any, { type: 'server', message: (t('username_exists') as any) || 'Username exists' }); friendly = (t('username_exists') as any) || friendly; }
            if (lower.includes('student')) { setError('student_id' as any, { type: 'server', message: (t('student_id_exists') as any) || 'Student ID exists' }); friendly = (t('student_id_exists') as any) || friendly; }
            if (lower.includes('phone')) { setError('phone' as any, { type: 'server', message: (t('phone_exists') as any) || 'Phone exists' }); friendly = (t('phone_exists') as any) || friendly; }
          }
          setSubmitError(friendly);
        } })} variant="contained" color="secondary" disabled={isSubmitting}>
          {initial?.email ? t('save') : t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

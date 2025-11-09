"use client";
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useLocale from '@/hooks/useLocale';
import { TextField, Stack, Button, MenuItem, Alert, Paper, Typography, LinearProgress, Box, Avatar, Chip, Divider, InputAdornment, Link as MuiLink, CircularProgress } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import LanguageIcon from '@mui/icons-material/Language';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ProfileRequiredSchema } from '@/validators/users';

type User = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: string;
  membership_status?: string;
  emailVerified?: boolean;
};

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t, i18n } = useTranslation();
  const [policy, setPolicy] = useState<any>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<'verify' | null>(null);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [dismissedVerifyBanner, setDismissedVerifyBanner] = useState(false);
  const verifyParam = searchParams?.get('verify');
  const showVerifySuccess = verifyParam === 'success';
  const showVerifyAlready = verifyParam === 'already';
  const showVerificationAlert = !dismissedVerifyBanner && (showVerifySuccess || showVerifyAlready);
  // wizard removed
  const addProject = () => setForm((f: any) => ({ ...f, projects: [ ...(f.projects || []), { title: '' } ] }));
  const removeProject = (idx: number) => setForm((f: any) => ({ ...f, projects: (f.projects || []).filter((_: any, i: number) => i !== idx) }));
  const addCertificate = () => setForm((f: any) => ({ ...f, certificates: [ ...(f.certificates || []), { name: '' } ] }));
  const removeCertificate = (idx: number) => setForm((f: any) => ({ ...f, certificates: (f.certificates || []).filter((_: any, i: number) => i !== idx) }));
  const addSocial = () => setForm((f: any) => ({ ...f, social_links: [ ...(f.social_links || []), { platform: '', url: '' } ] }));
  const platforms = [
    { key: 'github', label: 'GitHub', icon: <GitHubIcon fontSize="small" /> , prefix: 'https://github.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon fontSize="small" /> , prefix: 'https://www.linkedin.com/in/' },
    { key: 'twitter', label: 'Twitter', icon: <TwitterIcon fontSize="small" /> , prefix: 'https://twitter.com/' },
    { key: 'instagram', label: 'Instagram', icon: <InstagramIcon fontSize="small" /> , prefix: 'https://instagram.com/' },
    { key: 'telegram', label: 'Telegram', icon: <TelegramIcon fontSize="small" /> , prefix: 'https://t.me/' },
    { key: 'website', label: 'Website', icon: <LanguageIcon fontSize="small" /> , prefix: 'https://' },
  ] as const;
  const getPlatform = (k?: string) => platforms.find(p => p.key === k) || null;
  const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : (u ? `https://${u}` : u));
  const onPickProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Convert file to base64 and upload via JSON to /api/media/profile
      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      });
      const base64 = await toBase64(file);
      const out = await axios.post('/api/media/profile', { name: file.name, contentType: file.type, data: base64 });
      const fileId: string | undefined = (out as any)?.data?.file?._id;
      if (fileId) {
        const url = `/api/media/${fileId}`;
        setForm((f: any) => ({ ...f, profile_picture: url }));
        setUser((u) => (u ? { ...u, profile_picture: url } : u));
      }
    } catch (err: any) {
      setSaveErr(err?.response?.data?.error || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/auth/me')
      .then((res) => {
        if (!mounted) return;
        setUser(res.data.user);
        setForm({
          name: res.data.user.name || '',
          full_name: (res.data.user as any).full_name || '',
          username: (res.data.user as any).username || '',
          email: res.data.user.email,
          phone: (res.data.user as any).phone || '',
          university: (res.data.user as any).university || '',
          major: (res.data.user as any).major || '',
          degree: (res.data.user as any).degree || '',
          entry_year: (res.data.user as any).entry_year || '',
          ieee_membership_id: (res.data.user as any).ieee_membership_id || '',
          membership_status: (res.data.user as any).membership_status || 'none',
          bio: (res.data.user as any).bio || '',
          projects: (res.data.user as any).projects || [],
          certificates: (res.data.user as any).certificates || [],
          social_links: (res.data.user as any).social_links || [],
          student_id: (res.data.user as any).student_id || '',
        });
      })
      .catch(() => {
        setError('Unauthorized');
      });
    axios.get('/api/auth/policy').then((res)=> setPolicy(res.data.policy)).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  const onChange = (e: any) => setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  const onSave = async () => {
    if (!user) return;
    setSaving(true); setSaveErr(null); setSaveNotice(null);
    const previousEmail = user.email;
    try {
      const parsed = ProfileRequiredSchema.parse(form);
      setFieldErrors({});
      await axios.patch(`/api/auth/me`, { ...parsed, locale });
      setEditing(false);
      const { data } = await axios.get('/api/auth/me');
      setUser(data.user);
      if (previousEmail.toLowerCase() !== String(data.user.email || '').toLowerCase() && data.user.emailVerified === false) {
        setSaveNotice('verify');
      }
    } catch (err: any) {
      if (err?.issues) {
        const fe: Record<string, string> = {};
        for (const e of err.issues as any[]) {
          if (e?.path?.[0]) fe[e.path[0]] = e.message;
        }
        setFieldErrors(fe);
      } else {
        const res = err?.response as { status?: number; data?: any } | undefined;
        if (res?.status === 409) {
          const lower = String(res?.data?.error || '').toLowerCase();
          if (lower.includes('email')) setFieldErrors((f) => ({ ...f, email: String(t('email_exists')) }));
          if (lower.includes('username')) setFieldErrors((f) => ({ ...f, username: String(t('username_exists')) }));
          if (lower.includes('student')) setFieldErrors((f) => ({ ...f, student_id: String(t('student_id_exists')) }));
          if (lower.includes('phone')) setFieldErrors((f) => ({ ...f, phone: String(t('phone_exists')) }));
        } else {
          setSaveErr(res?.data?.error || 'Failed to save');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  async function logout() {
    try {
      await axios.post('/api/auth/logout');
      router.push(`/${locale}/signin`);
    } catch {}
  }

  function completionPercent(): number {
    const keys: Array<[string, (v: any) => boolean]> = [
      ['name', (v) => !!v],
      ['full_name', (v) => !!v],
      ['username', (v) => !!v],
      ['email', (v) => !!v],
      ['phone', (v) => !!v],
      ['student_id', (v) => !!v],
      ['major', (v) => !!v],
      ['degree', (v) => !!v],
      ['bio', (v) => (v || '').length >= 10],
      ['profile_picture', (v) => !!v],
      ['social_links', (v) => Array.isArray(v) && v.length > 0],
      ['projects', (v) => Array.isArray(v) && v.length > 0],
      ['certificates', (v) => Array.isArray(v) && v.length > 0],
    ];
    let score = 0;
    for (const [k, fn] of keys) {
      if (fn((form as any)[k])) score += 1;
    }
    return Math.round((score / keys.length) * 100);
  }

  // wizard validation removed; single-step save handles validation

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-red-600 mb-3">You are not logged in.</p>
        <MuiLink component={NextLink} className="text-blue-600 underline" href="/signin">Go to login</MuiLink>
      </div>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">{t('loading') as any || 'Loading...'}</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {saveNotice === 'verify' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('email_changed_verify_notice') as any}
        </Alert>
      )}
      {showVerificationAlert && (
        <Alert severity="success" onClose={() => setDismissedVerifyBanner(true)} sx={{ mb: 2 }}>
          {showVerifySuccess ? (t('email_verify_success') as any) : (t('email_verify_already') as any)}
        </Alert>
      )}
      <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>{t('profile') as any || 'Profile'}</Typography>
      {(user as any)?.membership_status !== 'active' && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack>
              <Typography variant="subtitle1" fontWeight={700}>{t('apply_membership') || 'Apply for membership'}</Typography>
              {applyMsg && <Typography variant="body2" color="text.secondary">{applyMsg}</Typography>}
            </Stack>
            <Button disabled={applyLoading} variant="contained" onClick={async () => {
              setApplyLoading(true); setApplyMsg(null);
              try {
                const payload = { form: { name: form.name, full_name: form.full_name, email: form.email, student_id: form.student_id, major: form.major, degree: form.degree } };
                await axios.post('/api/membership', payload);
                setApplyMsg(String(t('membership_applied') || 'Application submitted.'));
              } catch (e: any) {
                const raw = e?.response?.data?.error as string | undefined;
                // Localize known codes/messages
                const msg = raw === 'membership_already_in_review' || raw === 'Application already in review'
                  ? (t('membership_already_in_review') as any)
                  : (raw || (t('password_reset_error') as any) || 'Failed to submit application');
                setApplyMsg(String(msg));
              } finally {
                setApplyLoading(false);
              }
            }}>{t('apply_now') || 'Apply now'}</Button>
          </Stack>
        </Paper>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>{String(user.name || user.email || 'U').slice(0,1).toUpperCase()}</Avatar>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>{user.name || user.email}</Typography>
              <Typography variant="body2" color="text.secondary">{user.username || '—'}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {(() => {
                  const raw = user.role as any;
                  const role = raw === 'professor' ? 'executive' : raw === 'user' ? 'member' : raw;
                  const color = role === 'admin' ? 'secondary' : role === 'executive' ? 'info' : role === 'member' ? 'success' : 'warning';
                  const label = role === 'admin' ? t('user_role_admin')
                    : role === 'executive' ? t('user_role_executive')
                    : role === 'volunteer' ? t('user_role_volunteer')
                    : t('user_role_member');
                  return <Chip size="small" color={color as any} label={label as any} />;
                })()}
                {!!user.membership_status && <Chip size="small" variant="outlined" label={(t(user.membership_status) as any) || user.membership_status} />}
              </Stack>
            </Stack>
          </Stack>
          <div className="flex gap-2">
            {!editing && <Button variant="contained" onClick={() => setEditing(true)}>{t('edit_profile') as any || 'Edit Profile'}</Button>}
            
            <Button variant="outlined" color="error" onClick={logout}>{t('logout') as any || 'Logout'}</Button>
          </div>
        </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="body2" gutterBottom>{t('profile_completion') as any || 'Profile completion'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress variant="determinate" value={completionPercent()} sx={{ flexGrow: 1, height: 8, borderRadius: 2 }} />
              <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{completionPercent()}%</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {!editing && Array.isArray(form.social_links) && form.social_links.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{t('social_links') as any || 'Social links'}</Typography>
          <Stack gap={1.25}>
            {form.social_links.map((s: any, i: number) => {
              const p = getPlatform(s.platform);
              const href = withScheme(String(s.url || ''));
              if (!s.url) return null;
              return (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <Chip size="small" icon={p?.icon || <LanguageIcon fontSize="small" />} label={p?.label || (s.platform || 'Link')} />
                  <MuiLink component={NextLink} href={href} target="_blank" rel="noopener noreferrer" underline="hover">
                    {s.url}
                  </MuiLink>
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      )}

      
      {editing && (
        <>
          {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('basic_information') as any || 'Basic information'}</Typography>
            <Stack gap={2}>
              <TextField name="name" label={t('full_name_en') as any || t('name_label')} value={form.name} onChange={onChange} required error={!!fieldErrors.name} helperText={fieldErrors.name} />
              <TextField name="full_name" label={t('full_name_fa') as any || t('full_name')} value={form.full_name} onChange={onChange} required error={!!fieldErrors.full_name} helperText={fieldErrors.full_name} />
              <TextField name="username" label={t('username_label') as any} value={form.username} onChange={onChange} required error={!!fieldErrors.username} helperText={fieldErrors.username} />
              <TextField name="email" label={t('email_label')} value={form.email} onChange={onChange} required error={!!fieldErrors.email} helperText={fieldErrors.email} />
              <TextField name="phone" label={t('phone') as any} value={form.phone} onChange={onChange} required error={!!fieldErrors.phone} helperText={fieldErrors.phone} />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{t('academic') as any || 'Academic'}</Typography>
            <Stack gap={2}>
              <TextField name="student_id" label={t('student_id') as any || 'Student ID'} value={form.student_id || ''} onChange={onChange} required error={!!fieldErrors.student_id} helperText={fieldErrors.student_id} />
              <TextField name="major" select label={t('major') as any} value={form.major} onChange={onChange} required error={!!fieldErrors.major} helperText={fieldErrors.major}>
                <MenuItem value="computer">{t('computer') as any || 'Computer'}</MenuItem>
                <MenuItem value="electrical">{t('electrical') as any || 'Electrical'}</MenuItem>
              </TextField>
              <TextField name="degree" select label={t('degree') as any} value={form.degree} onChange={onChange} required error={!!fieldErrors.degree} helperText={fieldErrors.degree}>
                <MenuItem value="bachelor">{t('degree_bachelor') as any || 'Bachelor'}</MenuItem>
                <MenuItem value="master">{t('degree_master') as any || 'Master'}</MenuItem>
                <MenuItem value="phd">{t('degree_phd') as any || 'PhD'}</MenuItem>
              </TextField>
              <TextField name="ieee_membership_id" label={t('ieee_membership_id') as any} value={form.ieee_membership_id || ''} disabled helperText={t('readonly_field') as any || 'Read-only'} />
              {/* membership_status is managed by admins only; hidden from self-edit */}
              <TextField name="bio" label={t('bio') as any} value={form.bio} onChange={onChange} multiline minRows={3} />
            </Stack>
          </Paper>
          {/* Projects Card */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WorkOutlineOutlinedIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>{t('projects') as any}</Typography>
              </Stack>
              <Button size="small" variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addProject}>{t('add_project') as any}</Button>
            </Stack>
            <Stack gap={1.5}>
              {(form.projects || []).map((p: any, i: number) => (
                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 1 }}>
                  <TextField name={`p_title_${i}`} label={t('title_label') as any} value={p.title || ''} onChange={(e) => setForm((f: any) => { const arr = [...(f.projects||[])]; arr[i] = { ...arr[i], title: e.target.value }; return { ...f, projects: arr }; })} required />
                  <TextField
                    name={`p_link_${i}`}
                    label={t('link') as any}
                    value={p.link || ''}
                    onChange={(e) => setForm((f: any) => { const arr = [...(f.projects||[])]; arr[i] = { ...arr[i], link: e.target.value }; return { ...f, projects: arr }; })}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><LinkOutlinedIcon fontSize="small" /></InputAdornment>) }}
                  />
                  <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removeProject(i)} sx={{ justifySelf: { md: 'end' } }}>{t('remove') as any}</Button>
                </Box>
              ))}
            </Stack>
          </Paper>
          {/* Certificates Card */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WorkspacePremiumOutlinedIcon color="info" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>{t('certificates') as any}</Typography>
              </Stack>
              <Button size="small" variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addCertificate}>{t('add_certificate') as any}</Button>
            </Stack>
            <Stack gap={1.5}>
              {(form.certificates || []).map((c: any, i: number) => (
                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 1 }}>
                  <TextField name={`c_name_${i}`} label={t('title_label') as any} value={c.name || ''} onChange={(e) => setForm((f: any) => { const arr = [...(f.certificates||[])]; arr[i] = { ...arr[i], name: e.target.value }; return { ...f, certificates: arr }; })} required />
                  <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removeCertificate(i)} sx={{ justifySelf: { md: 'end' } }}>{t('remove') as any}</Button>
                </Box>
              ))}
            </Stack>
          </Paper>
          {/* Social Links Card */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LinkOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>{t('social_links') as any || 'Social links'}</Typography>
              </Stack>
              <Button size="small" variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => setForm((f:any)=> ({ ...f, social_links:[...(f.social_links||[]), { platform: '', url:'' }] }))}>{t('add') as any || 'Add'}</Button>
            </Stack>
            <Stack gap={1.5}>
              {(form.social_links || []).map((s: any, i: number) => (
                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 1 }}>
                  <TextField name={`sl_platform_${i}`} label={t('platform') as any || 'Platform'} value={s.platform||''} onChange={(e)=> setForm((f:any)=>{ const arr=[...(f.social_links||[])]; arr[i] = { ...arr[i], platform:e.target.value }; return { ...f, social_links:arr }; })} />
                  <TextField name={`sl_url_${i}`} label={t('url') as any || 'URL'} value={s.url||''} onChange={(e)=> setForm((f:any)=>{ const arr=[...(f.social_links||[])]; arr[i] = { ...arr[i], url:e.target.value }; return { ...f, social_links:arr }; })} />
                  <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setForm((f:any)=>({ ...f, social_links:(f.social_links||[]).filter((_:any,idx:number)=> idx!==i) }))}>{t('remove') as any}</Button>
                </Box>
              ))}
            </Stack>
          </Paper>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button variant="contained" onClick={onSave} disabled={saving}>{t('save') as any}</Button>
            <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}>{t('cancel') as any}</Button>
          </Stack>
        </>
      )}
    </Container>
  );
}

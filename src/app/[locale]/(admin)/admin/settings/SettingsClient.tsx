"use client";

import React from 'react';
import { Alert, Box, Container, Divider, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Paper, Select, Stack, Switch, Typography, TextField, Autocomplete, Chip, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import useAxios from 'axios-hooks';
import { useTranslation } from 'react-i18next';

type Features = {
  assistEnabled: boolean;
  vitalsClientEnabled: boolean;
  vitalsServerEnabled: boolean;
  chatEnabled: boolean;
  notificationsEmailEnabled: boolean;
  contact: { captchaProvider: 'none'|'turnstile'|'hcaptcha' };
  security?: { strictForeignIp?: boolean };
  ai?: { enabled: boolean; provider?: 'openai'|'deepseek'|'other'|'none'; defaultModels?: { openai?: string; deepseek?: string } };
  auth: {
    emailPasswordEnabled: boolean;
    phoneOtpEnabled: boolean;
    signupEnabled: boolean;
    passwordResetEnabled: boolean;
    usernameLoginEnabled: boolean;
  };
  ui?: {
    hyperspeed?: { enabled: boolean; distortion: 'turbulentDistortion'|'mountainDistortion'|'xyDistortion'|'LongRaceDistortion'|'deepDistortion'|'turbulentDistortionStill'|'deepDistortionStill'; length?: number; roadWidth?: number; islandWidth?: number; colors?: any };
    team?: {
      chipColors?: Partial<Record<'software'|'hardware'|'networking'|'computer', 'default'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>>;
      iconColors?: Partial<Record<'software'|'hardware'|'networking'|'computer', 'inherit'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>>;
      iconNames?: Partial<Record<'software'|'hardware'|'networking'|'computer', string>>;
      groupOrder?: string[];
    };
  };
};

const allowAll = () => true;

export default function SettingsClient() {
  const { t } = useTranslation();
  const [{ data, loading, error }, refetch] = useAxios({ url: '/api/admin/settings/features', validateStatus: allowAll });
  const [{ loading: saving }, patch] = useAxios({ url: '/api/admin/settings/features', method: 'PATCH' }, { manual: true });
  const features: Features | undefined = data?.features;
  const [localGroupOrder, setLocalGroupOrder] = React.useState<string[]>(features?.ui?.team?.groupOrder || ['software','hardware','networking','computer']);
  React.useEffect(() => {
    const next = (features?.ui?.team?.groupOrder || ['software','hardware','networking','computer']).slice();
    setLocalGroupOrder(next);
  }, [features?.ui?.team?.groupOrder]);
  const move = (idx: number, dir: -1 | 1) => {
    setLocalGroupOrder((prev) => {
      const arr = prev.slice();
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return arr;
      const tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp;
      // persist
      update({ ui: { team: { groupOrder: arr } as any } as any });
      return arr;
    });
  };

  const update = async (patchObj: Partial<Features>) => {
    await patch({ data: { features: patchObj } });
    await refetch();
  };

  const env = {
    turnstileSite: !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    turnstileSecret: !!process.env.TURNSTILE_SECRET_KEY,
    hcaptchaSecret: !!process.env.HCAPTCHA_SECRET,
  };

  return (
    <Container sx={{ py: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700}>{t('site_settings') || 'Site settings'}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{t('settings_sub') || 'Toggle features without redeploy.'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{String((error as any)?.response?.data?.error || 'Failed to load settings')}</Alert>}
        <Stack spacing={2} divider={<Divider flexItem />}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_ui') || 'UI'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={!!features?.ui?.hyperspeed?.enabled} onChange={(e) => update({ ui: { hyperspeed: { enabled: e.target.checked } as any } as any })} />} label={t('settings_ui_hyperspeed') || 'Hyperspeed background'} />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="hs-dist">{t('settings_ui_hyperspeed_distortion') || 'Distortion'}</InputLabel>
                <Select labelId="hs-dist" label={t('settings_ui_hyperspeed_distortion') || 'Distortion'} value={features?.ui?.hyperspeed?.distortion || 'turbulentDistortion'} onChange={(e) => update({ ui: { hyperspeed: { distortion: e.target.value } as any } as any })}>
                  {['turbulentDistortion','mountainDistortion','xyDistortion','LongRaceDistortion','deepDistortion','turbulentDistortionStill','deepDistortionStill'].map((k) => (
                    <MenuItem key={k} value={k}>{k}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('settings_ui_hyperspeed_hint') || '3D hero background effect'}</FormHelperText>
              </FormControl>
              <TextField size="small" type="number" label={t('settings_ui_hyperspeed_length') || 'Length'} value={features?.ui?.hyperspeed?.length ?? ''} onChange={(e) => update({ ui: { hyperspeed: { length: Number(e.target.value || 0) } as any } as any })} />
              <TextField size="small" type="number" label={t('settings_ui_hyperspeed_road') || 'Road width'} value={features?.ui?.hyperspeed?.roadWidth ?? ''} onChange={(e) => update({ ui: { hyperspeed: { roadWidth: Number(e.target.value || 0) } as any } as any })} />
              <TextField size="small" type="number" label={t('settings_ui_hyperspeed_island') || 'Island width'} value={features?.ui?.hyperspeed?.islandWidth ?? ''} onChange={(e) => update({ ui: { hyperspeed: { islandWidth: Number(e.target.value || 0) } as any } as any })} />
            </Stack>
            {/* Optional color controls */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Background color (#RRGGBB or 0xRRGGBB)" value={features?.ui?.hyperspeed?.colors?.background ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { background: e.target.value } as any } as any } as any })} sx={{ minWidth: 220 }} />
              <TextField size="small" label="Road color" value={features?.ui?.hyperspeed?.colors?.roadColor ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { roadColor: e.target.value } as any } as any } as any })} />
              <TextField size="small" label="Island color" value={features?.ui?.hyperspeed?.colors?.islandColor ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { islandColor: e.target.value } as any } as any } as any })} />
              <TextField size="small" label="Shoulder lines" value={features?.ui?.hyperspeed?.colors?.shoulderLines ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { shoulderLines: e.target.value } as any } as any } as any })} />
              <TextField size="small" label="Broken lines" value={features?.ui?.hyperspeed?.colors?.brokenLines ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { brokenLines: e.target.value } as any } as any } as any })} />
              <TextField size="small" label="Sticks" value={features?.ui?.hyperspeed?.colors?.sticks ?? ''}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { sticks: e.target.value } as any } as any } as any })} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Left cars (comma sep)" placeholder="0xd856bf,0x6750a2,0xc247ac" value={(features?.ui?.hyperspeed?.colors?.leftCars || []).join(',')}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { leftCars: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } as any } as any } as any })} sx={{ minWidth: 300 }} />
              <TextField size="small" label="Right cars (comma sep)" placeholder="0x03b3c3,0x0e5ea5,0x324555" value={(features?.ui?.hyperspeed?.colors?.rightCars || []).join(',')}
                onChange={(e) => update({ ui: { hyperspeed: { colors: { rightCars: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } as any } as any } as any })} sx={{ minWidth: 300 }} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_ui_team') || 'Team visuals'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
              {/* Chip colors per discipline */}
              {(['software','hardware','networking','computer'] as const).map((disc) => (
                <FormControl key={`chip-${disc}`} size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id={`chip-${disc}`}>{`${disc} chip`}</InputLabel>
                  <Select labelId={`chip-${disc}`} label={`${disc} chip`} value={(features?.ui?.team?.chipColors?.[disc] as any) || ''} onChange={(e) => update({ ui: { team: { chipColors: { [disc]: e.target.value } as any } as any } as any })}>
                    {['default','primary','secondary','success','info','warning','error'].map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
              {/* Icon colors per discipline */}
              {(['software','hardware','networking','computer'] as const).map((disc) => (
                <FormControl key={`iconc-${disc}`} size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id={`iconc-${disc}`}>{`${disc} icon color`}</InputLabel>
                  <Select labelId={`iconc-${disc}`} label={`${disc} icon color`} value={(features?.ui?.team?.iconColors?.[disc] as any) || ''} onChange={(e) => update({ ui: { team: { iconColors: { [disc]: e.target.value } as any } as any } as any })}>
                    {['inherit','primary','secondary','success','info','warning','error'].map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
              {/* Icon names per discipline */}
              {(['software','hardware','networking','computer'] as const).map((disc) => (
                <FormControl key={`iconn-${disc}`} size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id={`iconn-${disc}`}>{`${disc} icon`}</InputLabel>
                  <Select labelId={`iconn-${disc}`} label={`${disc} icon`} value={(features?.ui?.team?.iconNames?.[disc] as any) || ''} onChange={(e) => update({ ui: { team: { iconNames: { [disc]: e.target.value } as any } as any } as any })}>
                    {['code','memory','router','computer'].map((n) => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                size="small"
                label={t('settings_ui_team_group_order') || 'Group order (comma separated)'}
                value={(features?.ui?.team?.groupOrder || []).join(',')}
                onChange={(e) => {
                  const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  update({ ui: { team: { groupOrder: list } as any } as any });
                }}
                sx={{ minWidth: 360 }}
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {localGroupOrder.map((k, i) => (
                <Stack key={k} direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                  <IconButton size="small" aria-label={`move ${k} left`} onClick={() => move(i, -1)} disabled={i === 0}><ArrowBackIosNewIcon fontSize="inherit" /></IconButton>
                  <Chip label={k} />
                  <IconButton size="small" aria-label={`move ${k} right`} onClick={() => move(i, 1)} disabled={i === localGroupOrder.length - 1}><ArrowForwardIosIcon fontSize="inherit" /></IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_auth') || 'Authentication'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={!!features?.auth?.emailPasswordEnabled} onChange={(e) => update({ auth: { emailPasswordEnabled: e.target.checked } as any })} />} label={t('settings_auth_email_password') || 'Email + password'} />
              <FormControlLabel control={<Switch checked={!!features?.auth?.phoneOtpEnabled} onChange={(e) => update({ auth: { phoneOtpEnabled: e.target.checked } as any })} />} label={t('settings_auth_phone_otp') || 'Phone OTP'} />
              <FormControlLabel control={<Switch checked={!!features?.auth?.signupEnabled} onChange={(e) => update({ auth: { signupEnabled: e.target.checked } as any })} />} label={t('settings_auth_signup') || 'Signup'} />
              <FormControlLabel control={<Switch checked={!!features?.auth?.passwordResetEnabled} onChange={(e) => update({ auth: { passwordResetEnabled: e.target.checked } as any })} />} label={t('settings_auth_password_reset') || 'Password reset'} />
              <FormControlLabel control={<Switch checked={!!features?.auth?.usernameLoginEnabled} onChange={(e) => update({ auth: { usernameLoginEnabled: e.target.checked } as any })} />} label={t('settings_auth_username_login') || 'Allow username login'} />
          </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_general') || 'General'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={!!features?.assistEnabled} onChange={(e) => update({ assistEnabled: e.target.checked })} />} label={t('settings_assist_widget') || 'Assist widget'} />
              <FormControlLabel control={<Switch checked={!!features?.chatEnabled} onChange={(e) => update({ chatEnabled: e.target.checked })} />} label={t('settings_chat') || 'Chat'} />
              <FormControlLabel control={<Switch checked={!!features?.notificationsEmailEnabled} onChange={(e) => update({ notificationsEmailEnabled: e.target.checked })} />} label={t('settings_notifications_email') || 'Email notifications'} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_vitals') || 'Web Vitals'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={!!features?.vitalsClientEnabled} onChange={(e) => update({ vitalsClientEnabled: e.target.checked })} />} label={t('settings_vitals_client') || 'Client reporter'} />
              <FormControlLabel control={<Switch checked={!!features?.vitalsServerEnabled} onChange={(e) => update({ vitalsServerEnabled: e.target.checked })} />} label={t('settings_vitals_server') || 'Server collection/API'} />
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_captcha') || 'Contact Captcha'}</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="captcha-provider">{t('settings_captcha_provider') || 'Provider'}</InputLabel>
              <Select
                labelId="captcha-provider"
                value={features?.contact?.captchaProvider || 'none'}
                label={t('settings_captcha_provider') || 'Provider'}
                onChange={(e) => update({ contact: { captchaProvider: e.target.value as any } as any })}
              >
                <MenuItem value="none">{t('settings_option_none') || 'None'}</MenuItem>
                <MenuItem value="turnstile">{t('settings_captcha_turnstile') || 'Cloudflare Turnstile'}</MenuItem>
                <MenuItem value="hcaptcha">{t('settings_captcha_hcaptcha') || 'hCaptcha'}</MenuItem>
              </Select>
              <FormHelperText>
                {features?.contact?.captchaProvider === 'turnstile' && !env.turnstileSecret && (t('settings_hint_turnstile_secret_missing') || 'TURNSTILE_SECRET_KEY is not set.')}
                {features?.contact?.captchaProvider === 'hcaptcha' && !env.hcaptchaSecret && (t('settings_hint_hcaptcha_secret_missing') || 'HCAPTCHA_SECRET is not set.')}
                {features?.contact?.captchaProvider === 'turnstile' && env.turnstileSecret && !env.turnstileSite && (t('settings_hint_turnstile_site_missing') || 'Client widget requires NEXT_PUBLIC_TURNSTILE_SITE_KEY.')}
              </FormHelperText>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_security') || 'Security'}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={!!features?.security?.strictForeignIp}
                  onChange={(e) => update({ security: { strictForeignIp: e.target.checked } as any })}
                />
              }
              label={t('settings_security_strict_foreign_ip') || 'Tighten limits for foreign/VPN IPs'}
            />
            <FormHelperText>
              {t('settings_security_strict_foreign_ip_hint') || 'Uses IP country headers (e.g. cf-ipcountry) to apply stricter rate limits and captcha for non-local visitors.'}
            </FormHelperText>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('settings_section_ai') || 'AI'}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={!!features?.ai?.enabled} onChange={(e) => update({ ai: { enabled: e.target.checked } as any })} />} label={t('settings_ai_enabled') || 'AI responses'} />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="ai-provider">{t('settings_ai_provider') || 'AI Provider'}</InputLabel>
                <Select
                  labelId="ai-provider"
                  value={(features?.ai?.provider as any) || 'none'}
                  label={t('settings_ai_provider') || 'AI Provider'}
                  onChange={(e) => update({ ai: { provider: e.target.value as any } as any })}
                >
                  <MenuItem value="none">{t('settings_option_none') || 'None'}</MenuItem>
                  <MenuItem value="openai">{t('settings_ai_provider_openai') || 'OpenAI'}</MenuItem>
                  <MenuItem value="deepseek">{t('settings_ai_provider_deepseek') || 'DeepSeek'}</MenuItem>
                </Select>
                <FormHelperText>
                  {features?.ai?.provider === 'openai' && !process.env.OPENAI_API_KEY && (t('settings_hint_openai_key_missing') || 'OPENAI_API_KEY is not set.')}
                  {features?.ai?.provider === 'deepseek' && !process.env.DEEPSEEK_API_KEY && (t('settings_hint_deepseek_key_missing') || 'DEEPSEEK_API_KEY is not set.')}
                </FormHelperText>
              </FormControl>
              <Autocomplete
                freeSolo
                size="small"
                options={[ 'gpt-4o-mini', 'o4-mini', 'gpt-4o-mini-translate', 'gpt-4.1-mini' ]}
                value={features?.ai?.defaultModels?.openai || 'gpt-4o-mini'}
                onChange={(_, v) => update({ ai: { defaultModels: { openai: String(v || 'gpt-4o-mini') } } as any })}
                renderInput={(params) => (
                  <TextField {...params} label={t('settings_ai_openai_model') || 'OpenAI model'} helperText={t('settings_ai_model_hint') || 'Default model name used when none specified.'} sx={{ minWidth: 240 }} />
                )}
              />
              <Autocomplete
                freeSolo
                size="small"
                options={[ 'deepseek-chat', 'deepseek-reasoner' ]}
                value={features?.ai?.defaultModels?.deepseek || 'deepseek-chat'}
                onChange={(_, v) => update({ ai: { defaultModels: { deepseek: String(v || 'deepseek-chat') } } as any })}
                renderInput={(params) => (
                  <TextField {...params} label={t('settings_ai_deepseek_model') || 'DeepSeek model'} helperText={t('settings_ai_model_hint') || 'Default model name used when none specified.'} sx={{ minWidth: 240 }} />
                )}
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

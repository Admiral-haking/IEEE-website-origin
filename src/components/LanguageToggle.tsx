"use client";

import React from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';

type Lang = 'en' | 'fa';

const options: { code: Lang; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fa', flag: '🇮🇷', label: 'فارسی' },
];

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const initial: Lang = (i18n?.resolvedLanguage || i18n?.language || '').startsWith('fa') ? 'fa' : 'en';
  const [lang, setLang] = React.useState<Lang>(initial);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const current = options.find((o) => o.code === lang)!;

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const choose = (code: Lang) => {
    setLang(code);
    try { i18n.changeLanguage(code); } catch {}
    // Persist cookie for SSR to avoid flicker and ensure correct dir/lang
    try { document.cookie = `i18next=${code};path=/`; document.cookie = `hippo_locale=${code};path=/`; } catch {}
    // Rebuild path with selected locale and force a full reload
    let path = pathname || '/';
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) {
      path = `/${code}`;
    } else if (parts[0] === 'en' || parts[0] === 'fa') {
      parts[0] = code;
      path = `/${parts.join('/')}`;
    } else {
      path = `/${code}/${parts.join('/')}`;
    }
    handleClose();
    router.push(path as any);
    router.refresh();
  };

  return (
    <>
      <Tooltip title={<span suppressHydrationWarning>{lang === 'fa' ? 'تغییر زبان' : 'Change language'}</span>}>
        <Button
          size="small"
          onClick={handleOpen}
          aria-haspopup="true"
          aria-controls={open ? 'lang-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label={lang === 'fa' ? 'تغییر زبان' : 'Change language'}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <span suppressHydrationWarning>{current.flag}</span>
            <Typography variant='caption' suppressHydrationWarning>
              {current.label}
            </Typography>
          </Stack>
        </Button>
      </Tooltip>
      <Menu id="lang-menu" anchorEl={anchorEl} open={open} onClose={handleClose} keepMounted>
        {options.map((opt) => (
          <MenuItem key={opt.code} selected={opt.code === lang} onClick={() => choose(opt.code)}>
            <ListItemIcon sx={{ fontSize: 18, minWidth: 28 }}>{opt.flag}</ListItemIcon>
            <ListItemText>{opt.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

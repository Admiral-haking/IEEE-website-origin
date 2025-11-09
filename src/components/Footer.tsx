"use client";

import React from 'react';
import NextLink from 'next/link';
import { Box, Container, Link, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.startsWith('fa') ? 'fa' : 'en') as 'fa' | 'en';

  const links = [
    { key: 'help', label: (t('help') as string) || 'Help', href: `/${locale}/help` },
    { key: 'about', label: (t('about') as any) || 'About', href: `/${locale}/about` },
    { key: 'privacy', label: t('privacy'), href: `/${locale}/privacy` },
    { key: 'terms', label: t('terms'), href: `/${locale}/terms` },
    { key: 'contact', label: t('contact'), href: `/${locale}/contact` },
  ];

  const ver = (process.env.NEXT_PUBLIC_APP_VERSION || 'V1').toUpperCase();
  return (
    <Box component="footer" sx={{ mt: { xs: 4, md: 6 }, borderTop: theme => `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
      <Container sx={{ py: { xs: 2.25, md: 3.25 } }}>
        <Stack spacing={{ xs: 1.25, md: 1.75 }}>
          {/* Row 1: nav links + copyright; stack centered on mobile */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            useFlexGap
            sx={{ rowGap: 0.75, textAlign: { xs: 'center', md: 'left' } }}
          >
            {/* Start side: copyright (start aligns left in LTR, right in RTL) */}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 }, lineHeight: { xs: 1.7, md: 1.8 } }}>
              © {year} <span suppressHydrationWarning>{t('name')}</span>
              {' · '}
              <Link href="https://qiet.ac.ir/" target="_blank" rel="noopener" underline="hover"><span suppressHydrationWarning>{t('university_name')}</span></Link>
              {' · '}<strong>{ver}</strong>
            </Typography>
            {/* End side: nav links cluster (end aligns right in LTR, left in RTL) */}
            <Stack component="nav" aria-label="footer navigation" direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ '& a': { fontSize: 12 }, columnGap: 1.25, rowGap: 0.75, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              {links.map(link => (
                <Link key={link.key} component={NextLink} href={link.href} underline="hover" color="inherit" sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  <span suppressHydrationWarning>{link.label}</span>
                </Link>
              ))}
              <Tooltip title={locale === 'fa' ? 'بازگشت به بالا' : 'Back to top'}>
                <IconButton size="small" aria-label="Back to top" onClick={() => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {} }} sx={{ ml: 0.5 }}>
                  ↑
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          {/* Row 2: socials */}
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-end' }}>
            {!!process.env.NEXT_PUBLIC_GITHUB_URL && (<Tooltip title="GitHub"><IconButton component={NextLink} href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank" rel="noopener" size="small" aria-label="GitHub"><GitHubIcon fontSize="small" /></IconButton></Tooltip>)}
            {!!process.env.NEXT_PUBLIC_LINKEDIN_URL && (<Tooltip title="LinkedIn"><IconButton component={NextLink} href={process.env.NEXT_PUBLIC_LINKEDIN_URL} target="_blank" rel="noopener" size="small" aria-label="LinkedIn"><LinkedInIcon fontSize="small" /></IconButton></Tooltip>)}
            {!!process.env.NEXT_PUBLIC_TWITTER_URL && (<Tooltip title="Twitter"><IconButton component={NextLink} href={process.env.NEXT_PUBLIC_TWITTER_URL} target="_blank" rel="noopener" size="small" aria-label="Twitter"><TwitterIcon fontSize="small" /></IconButton></Tooltip>)}
            {!!process.env.NEXT_PUBLIC_INSTAGRAM_URL && (<Tooltip title="Instagram"><IconButton component={NextLink} href={process.env.NEXT_PUBLIC_INSTAGRAM_URL} target="_blank" rel="noopener" size="small" aria-label="Instagram"><InstagramIcon fontSize="small" /></IconButton></Tooltip>)}
            {!!process.env.NEXT_PUBLIC_TELEGRAM_URL && (<Tooltip title="Telegram"><IconButton component={NextLink} href={process.env.NEXT_PUBLIC_TELEGRAM_URL} target="_blank" rel="noopener" size="small" aria-label="Telegram"><TelegramIcon fontSize="small" /></IconButton></Tooltip>)}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

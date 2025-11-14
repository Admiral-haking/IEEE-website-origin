"use client";

import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import useAxios from 'axios-hooks';

const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), { ssr: false });

export default function Hero() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? parts[0] : 'en';
  const isFa = locale === 'fa';
  const [{ data: features }] = useAxios({ url: '/api/settings/public/features' });
  // expose team group order for client grouping (no SSR dependency)
  React.useEffect(() => {
    try {
      const go = (features as any)?.ui?.team?.groupOrder;
      (window as any).__groupPref = Array.isArray(go) ? go : null;
    } catch {}
  }, [features]);
  const hs = (features as any)?.ui?.hyperspeed;
  const parseColor = React.useCallback((v: any, fb: number) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      let s = v.trim();
      if (s.startsWith('#')) s = '0x' + s.slice(1);
      const n = Number(s);
      return Number.isFinite(n) ? n : fb;
    }
    return fb;
  }, []);
  return (
    <Box sx={{ position: 'relative', pt: { xs: 8, md: 16 }, pb: { xs: 6, md: 12 }, overflow: 'hidden' }}>
      {/* Hyperspeed animated background (runtime toggle) */}
      {!!hs?.enabled && (
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, zIndex: -2 }}>
          <Hyperspeed effectOptions={{
            length: Number(hs.length || 420),
            lanesPerRoad: 4,
            roadWidth: Number(hs.roadWidth || 12),
            islandWidth: Number(hs.islandWidth || 2),
            distortion: String(hs.distortion || 'turbulentDistortion') as any,
            colors: {
              roadColor: parseColor(hs.colors?.roadColor, 0x080808),
              islandColor: parseColor(hs.colors?.islandColor, 0x0a0a0a),
              background: parseColor(hs.colors?.background, 0x000000),
              shoulderLines: parseColor(hs.colors?.shoulderLines, 0xffffff),
              brokenLines: parseColor(hs.colors?.brokenLines, 0xffffff),
              leftCars: Array.isArray(hs.colors?.leftCars) ? (hs.colors!.leftCars as any[]).map((c: any) => parseColor(c, 0xd856bf)) : [0xd856bf,0x6750a2,0xc247ac],
              rightCars: Array.isArray(hs.colors?.rightCars) ? (hs.colors!.rightCars as any[]).map((c: any) => parseColor(c, 0x03b3c3)) : [0x03b3c3,0x0e5ea5,0x324555],
              sticks: parseColor(hs.colors?.sticks, 0x03b3c3),
            }
          }} />
        </Box>
      )}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0, zIndex: -1,
          background: 'radial-gradient(800px 400px at 50% -50%, rgba(82,168,255,0.20), transparent 50%), radial-gradient(620px 320px at 82% 18%, rgba(126,87,194,0.16), transparent 60%)'
        }}
      />
      <Container>
        <Stack gap={{ xs: isFa ? 1.75 : 1.5, md: 2 }} alignItems="center" textAlign="center">
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ letterSpacing: isFa ? 0 : '-0.5px', fontSize: { xs: isFa ? 27 : 28, sm: 32, md: 'inherit' }, lineHeight: { xs: 1.2, md: 'inherit' } }}
          >
            {t('title')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontSize: { xs: 14, sm: 16, md: 'inherit' }, lineHeight: { xs: 1.6, md: 'inherit' }, maxWidth: 720 }}
          >
            {t('tagline')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mt: 1, width: '100%', maxWidth: 520 }}>
            <Button component={NextLink} href={`/${locale}/solutions`} fullWidth sx={{ py: { xs: 1.1, md: 1 } }} variant="contained" color="primary">{t('explore_solutions')}</Button>
            <Button component={NextLink} href={`/${locale}/contact`} fullWidth sx={{ py: { xs: 1.1, md: 1 } }} variant="outlined" color="inherit">{t('contact_now')}</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

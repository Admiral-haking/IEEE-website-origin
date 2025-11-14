import React from 'react';
import mongooseConn from '@/lib/mongoose';
import StaticPage from '@/models/StaticPage';
import { Container, Typography, Box, Stack, Link, Grid, Paper, Divider, TextField, Button, Chip } from '@mui/material';
import AssistWidget from '@/components/AssistWidget';
import ContactForm from '@/views/contact/ContactForm';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Metadata } from 'next';
import { buildListMetadata } from '@/lib/metadata';

export default async function ContactPage({ params }: { params: Promise<{ locale: 'en' | 'fa' }> }) {
  const { locale } = await params;
  // Ensure DB connection is established before querying
  await mongooseConn;
  const page = await StaticPage.findOne({ key: 'contact', locale }).lean();
  const contact = (page?.contact || {}) as any;
  const dict = locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
  return (
    <Container sx={{ py: 6 }}>
      {/* Hero */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          overflow: 'hidden',
          mb: 4,
          position: 'relative',
          backgroundImage: 'linear-gradient(135deg, rgba(156,39,176,0.08), rgba(25,118,210,0.06))'
        }}
      >
        <Stack gap={1}>
          <Typography variant="overline" color="text.secondary">{dict.contact_overline}</Typography>
          <Typography component="h1" variant="h3" fontWeight={800} sx={{ letterSpacing: -0.5 }} suppressHydrationWarning>{dict.contact}</Typography>
          <Typography color="text.secondary" maxWidth={720}>
            {dict.contact_intro}
          </Typography>
          <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
            {contact.phone && <Chip icon={<PhoneIcon />} label={contact.phone} variant="outlined" />}
            {contact.email && <Chip icon={<EmailIcon />} label={contact.email} variant="outlined" />}
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Left: Form + Rich content */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>{dict.send_message}</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{dict.prefer_email_detail}</Typography>
            <ContactForm locale={locale} emailFallback={contact.email} phoneFallback={contact.phone} />
            {page?.contentHtml && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ '& img': { maxWidth: '100%', height: 'auto' } }} dangerouslySetInnerHTML={{ __html: page?.contentHtml || '' }} />
              </>
            )}
          </Paper>
        </Grid>

        {/* Right: Contact details + Map */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack gap={3}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack gap={2}>
                {contact.phone && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PhoneIcon color="secondary" />
                    <Box>
                      <Typography variant="subtitle2">{dict.phone_label}</Typography>
                      <Typography><Link href={`tel:${contact.phone}`}>{contact.phone}</Link></Typography>
                    </Box>
                  </Stack>
                )}
                {contact.email && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <EmailIcon color="secondary" />
                    <Box>
                      <Typography variant="subtitle2">{dict.email_label}</Typography>
                      <Typography><Link href={`mailto:${contact.email}`}>{contact.email}</Link></Typography>
                    </Box>
                  </Stack>
                )}
                {contact.address && (
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <LocationOnIcon color="secondary" />
                    <Box>
                      <Typography variant="subtitle2">{dict.address_label}</Typography>
                      <Typography>{contact.address}</Typography>
                    </Box>
                  </Stack>
                )}
                {contact.openingHours && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <AccessTimeIcon color="secondary" />
                    <Box>
                      <Typography variant="subtitle2">{dict.opening_hours_label}</Typography>
                      <Typography>{contact.openingHours}</Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Paper>

            {contact.mapEmbedUrl && (
              <Paper variant="outlined" sx={{ p: 1, borderRadius: 3 }}>
                <Box component="iframe" title="map" src={contact.mapEmbedUrl}
                  sx={{ width: '100%', height: 300, border: 0, borderRadius: 2 }}
                  loading="lazy" allowFullScreen />
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
      <AssistWidget />
    </Container>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: 'en'|'fa' }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
  return buildListMetadata({ locale, path: '/contact', title: dict.contact, description: dict.contact_intro });
}

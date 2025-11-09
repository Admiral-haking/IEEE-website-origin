"use client";

import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';

const CARDS = [
  { title: 'Software Platforms', desc: 'Cloud-native services, APIs, and CI/CD at scale.' },
  { title: 'Hardware Systems', desc: 'Embedded, IoT, and high‑performance boards.' },
  { title: 'Networking', desc: 'Reliable, secure, and observable networks.' }
];

export default function SolutionsGrid() {
  return (
    <Grid container spacing={3} id="solutions">
      {CARDS.map((c) => (
        <Grid key={c.title} size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack gap={1}>
              <Typography variant="h6" fontWeight={600}>{c.title}</Typography>
              <Typography color="text.secondary">{c.desc}</Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

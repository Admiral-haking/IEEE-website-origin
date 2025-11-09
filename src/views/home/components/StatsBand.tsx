"use client";

import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';

export default function StatsBand({ stats }: { stats: { value: number | string; label: string }[] }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 4, p: { xs: 2, md: 3 }, mb: { xs: 6, md: 8 }, backgroundImage: 'linear-gradient(135deg, rgba(82,168,255,0.06), rgba(126,87,194,0.05))' }}>
      <Grid container spacing={2}>
        {stats.map((s, i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <Stack alignItems="center" textAlign="center" spacing={0.5}>
              <Typography variant="h4" fontWeight={800}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}


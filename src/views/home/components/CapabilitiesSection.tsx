"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import HealthCheck from '@/components/HealthCheck';

export default function CapabilitiesSection() {
  return (
    <Box id="capabilities" sx={{ mt: { xs: 8, md: 12 } }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Engineering, end to end</Typography>
      <Typography color="text.secondary" mb={3}>From concept to production with quality gates and telemetry.</Typography>
      <HealthCheck />
    </Box>
  );
}


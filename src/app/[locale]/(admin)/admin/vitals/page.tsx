import React from 'react';
import { Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import type { Metadata } from 'next';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { getFeatures } from '@/server/settings/service';

export default async function VitalsPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.contact' });
  const f = await getFeatures();
  if (!f.vitalsServerEnabled) {
    return (
      <Container sx={{ py: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Web Vitals</Typography>
          <Typography color="text.secondary">Web Vitals feature is disabled.</Typography>
        </Paper>
      </Container>
    );
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/_ops/vitals`, { cache: 'no-store' });
  const data = await res.json();
  const items: any[] = data?.items || [];
  return (
    <Container sx={{ py: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Web Vitals (recent)</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Metric</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Path</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((v: any, i: number) => (
              <TableRow key={v.id + i}>
                <TableCell>{new Date(v.ts).toLocaleString()}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell>{Math.round(Number(v.value) * 100) / 100}</TableCell>
                <TableCell>
                  <Chip size="small" label={v.rating || 'n/a'} color={v.rating === 'good' ? 'success' : v.rating === 'needs-improvement' ? 'warning' : 'default'} />
                </TableCell>
                <TableCell>{v.pathname}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Web Vitals' };
}

"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

type Row = { id: string; userId: string; user?: { id: string; email?: string; name?: string; username?: string }; status: 'pending'|'reviewed'|'approved'|'rejected'; form: any; notes?: string; createdAt: string };

export default function MembershipAdminView() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? (parts[0] as 'en'|'fa') : 'en';
  const [status, setStatus] = React.useState('pending');
  const [{ data, error, loading }, refetch] = useAxios({ url: '/api/membership', params: { status, page: 1, pageSize: 50 } });
  const [, patch] = useAxios({ method: 'PATCH' }, { manual: true });
  const [selected, setSelected] = React.useState<Row | null>(null);
  const onChangeStatus = async (row: Row, next: 'reviewed'|'approved'|'rejected') => {
    await patch({ url: `/api/membership/${row.id}`, data: { status: next } });
    await refetch();
    setSelected(null);
  };
  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('membership') || 'Membership'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('membership_review_desc') || 'Review and process membership applications'}</Typography>
        </Box>
        <TextField select size="small" label={t('status') as any} value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="pending">{t('pending')}</MenuItem>
          <MenuItem value="reviewed">{t('reviewed') || 'Reviewed'}</MenuItem>
          <MenuItem value="approved">{t('approved') || 'Approved'}</MenuItem>
          <MenuItem value="rejected">{t('rejected') || 'Rejected'}</MenuItem>
        </TextField>
      </Stack>
      {error && <Alert severity="error">{String((error as any)?.response?.data?.error || error)}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('user') || 'User'}</TableCell>
            <TableCell>{t('status') || 'Status'}</TableCell>
            <TableCell>{t('created') || 'Created'}</TableCell>
            <TableCell align="right">{t('actions') || 'Actions'}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.items || []).map((row: Row) => (
            <TableRow key={row.id} hover onClick={() => setSelected(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>
                {locale === 'fa'
                  ? ( (row.user as any)?.full_name || row.user?.name || row.user?.email || row.user?.username || row.userId )
                  : ( row.user?.name || (row.user as any)?.full_name || row.user?.email || row.user?.username || row.userId )}
              </TableCell>
              <TableCell><Chip size="small" label={row.status.toUpperCase()} /></TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={(e) => { e.stopPropagation(); onChangeStatus(row, 'reviewed'); }}>{t('reviewed') || 'Reviewed'}</Button>
                  <Button size="small" color="success" onClick={(e) => { e.stopPropagation(); onChangeStatus(row, 'approved'); }}>{t('approve') || 'Approve'}</Button>
                  <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); onChangeStatus(row, 'rejected'); }}>{t('reject') || 'Reject'}</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('application') || 'Application'}</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack gap={1}>
              <Typography variant="caption" color="text.secondary">{t('user') || 'User'}: {locale === 'fa' ? ((selected.user as any)?.full_name || selected.user?.name || selected.user?.email) : (selected.user?.name || (selected.user as any)?.full_name || selected.user?.email)}</Typography>
              <Typography variant="caption" color="text.secondary">{t('status') || 'Status'}: {selected.status}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>{t('form') || 'Form data'}</Typography>
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, bgcolor: '#fafafa', p: 1, borderRadius: 1 }}>
                {JSON.stringify(selected.form, null, 2)}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selected && (
            <>
              <Button onClick={() => onChangeStatus(selected, 'reviewed')}>{t('reviewed') || 'Reviewed'}</Button>
              <Button color="success" onClick={() => onChangeStatus(selected, 'approved')}>{t('approve') || 'Approve'}</Button>
              <Button color="error" onClick={() => onChangeStatus(selected, 'rejected')}>{t('reject') || 'Reject'}</Button>
            </>
          )}
          <Button onClick={() => setSelected(null)}>{t('close') || 'Close'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

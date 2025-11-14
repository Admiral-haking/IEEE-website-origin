"use client";

import React from 'react';
import { Box, Button, Container, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import useAxios from 'axios-hooks';
import axios from 'axios';
import JobDialog from './components/JobDialog';
import ConfirmDialog from '@/views/admin/users/components/ConfirmDialog';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

type Row = { id: string; title: string; slug: string; type: string; location: string; published: boolean };

export default function JobsAdminView() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(() => (isMobile ? 5 : 10));
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<Partial<Row> | undefined>(undefined);
  const [confirm, setConfirm] = React.useState<{ open: boolean; row?: Row }>({ open: false });

  const pathname = usePathname();
  const parts = (pathname || '/').split('/').filter(Boolean);
  const locale = parts[0] === 'en' || parts[0] === 'fa' ? (parts[0] as 'en' | 'fa') : 'en';
  const [{ data, error }, refetch] = useAxios({ url: '/api/jobs', params: { page: page + 1, pageSize: rowsPerPage, locale } });
  const [, createReq] = useAxios({ url: '/api/jobs', method: 'POST' }, { manual: true });
  const [, updateReq] = useAxios({ method: 'PATCH' }, { manual: true });
  const [, deleteReq] = useAxios({ method: 'DELETE' }, { manual: true });

  const items: Row[] = data?.items || [];
  const total = data?.total || 0;

  const onAdd = () => { setInitial(undefined); setOpen(true); };
  const onEdit = (row: Row) => { setInitial(row as any); setOpen(true); };
  const onSubmit = async (values: any) => {
    try {
      if ((initial as any)?.id) await updateReq({ url: `/api/jobs/${(initial as any).id}`, data: values });
      else await createReq({ data: { ...values, locale } });
      await refetch();
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      throw err;
    }
  };
  const onDelete = async (row: Row) => {
    try {
      await deleteReq({ url: `/api/jobs/${row.id}` });
      await refetch();
    } catch (err: any) {
      if (axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      throw err;
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('jobs')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('jobs_admin_sub')}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" color="secondary" onClick={onAdd}>{t('add_job')}</Button>
        </Stack>
      </Stack>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">
            {(() => { const res = (error as any)?.response; if (res?.status === 403) return (t('admin_required') as any) || 'Admin access required'; if (res?.status === 401) return (t('sign_in') as any) || 'Sign in required'; return String(res?.data?.error || 'Error'); })()}
          </Typography>
        </Box>
      )}
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>{t('title_label')}</TableCell>
              <TableCell>{t('type_label')}</TableCell>
              <TableCell>{t('location_label')}</TableCell>
              <TableCell>{t('published')}</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>{row.published ? t('yes') : t('no')}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={t('edit') as string}><IconButton size="small" onClick={() => onEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={t('delete') as string}><IconButton size="small" onClick={() => setConfirm({ open: true, row })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />

      <JobDialog open={open} onClose={() => setOpen(false)} initial={initial as any} onSubmit={onSubmit} />
      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={async () => { if (confirm.row) await onDelete(confirm.row); }} title={t('delete_job_title')} message={t('delete_job_message')} />
    </Container>
  );
}

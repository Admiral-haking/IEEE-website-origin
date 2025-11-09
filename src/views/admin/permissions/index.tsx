"use client";

import React from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { Alert, Box, Checkbox, Container, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Button, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PERMISSION_GROUPS, hasPermission, togglePermission, PermissionKey } from '@/constants/permissions';

type Row = { id: string; email: string; name?: string; role: string; permissions?: Record<string, any> };

export default function PermissionsAdminView() {
  const { t } = useTranslation();
  const [q, setQ] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [{ data, error, loading }, refetch] = useAxios({ url: '/api/users', params: { q } });
  const [, patch] = useAxios({ method: 'PATCH' }, { manual: true });

  const onToggle = async (row: Row, key: PermissionKey, val: boolean) => {
    const perms = togglePermission(row.permissions || {}, key, val);
    await patch({ url: `/api/users/${row.id}`, data: { permissions: perms } });
    await refetch();
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('permissions') || 'Permissions'}</Typography>
          <Typography variant="body2" color="text.secondary">{t('permissions') || 'Manage fine-grained permissions for users'}</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
          <TextField size="small" placeholder={t('search') as string} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} />
          <Button variant="contained" onClick={() => refetch()}>{t('search') || 'Search'}</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{String((error as any)?.response?.data?.error || error)}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('name_label') || 'Name'}</TableCell>
                  <TableCell>{t('email_label') || 'Email'}</TableCell>
                  <TableCell>{t('role_label') || 'Role'}</TableCell>
                  <TableCell width="55%">{t('permissions') || 'Permissions'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items || []).map((row: Row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name || '—'}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Stack gap={2}>
                        {PERMISSION_GROUPS.map((group) => (
                          <Box key={group.key}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t(group.labelKey) || group.labelKey}</Typography>
                              {group.descriptionKey && (
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'end' }}>
                                  {t(group.descriptionKey) || ''}
                                </Typography>
                              )}
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                              {group.permissions.map((perm) => (
                                <FormControlLabel
                                  key={perm.key}
                                  control={
                                    <Checkbox
                                      checked={hasPermission(row.permissions, perm.key)}
                                      onChange={(e) => onToggle(row, perm.key, e.target.checked)}
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>{t(perm.labelKey) || perm.key}</Typography>
                                      {perm.descriptionKey && (
                                        <Typography variant="caption" color="text.secondary">
                                          {t(perm.descriptionKey) || ''}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              ))}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
      </Paper>
    </Container>
  );
}

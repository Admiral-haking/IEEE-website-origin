"use client";
import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ACCESS_TABLE } from '@/constants/access';

export default function AccessDocClient() {
  const { t } = useTranslation();
  const rows = ACCESS_TABLE.map((r) => ({
    role: r.role,
    level: r.level,
    perms: r.perms.map((p) => {
      if (p === 'profile') return (t('profile') as any) || 'Profile';
      if (p === 'chat') return (t('chat') as any) || 'Chat';
      if (p === 'content') return (t('content_permissions') as any) || 'Content: pages, blog, media, cases, jobs, solutions, capabilities';
      if (p === 'operations') return (t('operations_permissions') as any) || 'Operations: membership review, contact messages, chat moderation';
      if (p === 'admin') return (t('admin_permissions') as any) || 'Administration: user management, fine-grained permissions, analytics';
      return p;
    })
  }));
  const label = (r: string) => (r === 'admin' ? t('user_role_admin') : r === 'executive' ? t('user_role_executive') : r === 'volunteer' ? t('user_role_volunteer') : t('user_role_member')) as string;
  const color = (r: string) => (r === 'admin' ? 'secondary' : r === 'executive' ? 'info' : r === 'member' ? 'success' : 'warning') as any;
  return (
    <>
      <Typography variant="h5" fontWeight={700} gutterBottom>{t('access') as any || 'Access'}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {(t('access_doc') as any) || 'Roles and permissions documentation'}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('role_label')}</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>{t('permissions') as any || 'Permissions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.role} hover>
                  <TableCell><Chip size="small" label={label(r.role)} color={color(r.role)} /></TableCell>
                  <TableCell>{r.level}</TableCell>
                  <TableCell>{Array.isArray(r.perms) ? r.perms.join(', ') : r.perms}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

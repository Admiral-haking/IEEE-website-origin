"use client";
import React from 'react';
import { Alert } from '@mui/material';

export default function AdminAccessAlert({ error, t, sx }: { error: any; t?: (k: string) => any; sx?: any }) {
  if (!error) return null;
  const res = (error as any)?.response;
  let msg: any = res?.data?.error || String(error);
  if (res?.status === 403) msg = (t?.('admin_required') as any) || 'Admin access required';
  else if (res?.status === 401) msg = (t?.('sign_in') as any) || 'Sign in required';
  return <Alert severity="error" sx={sx}>{msg}</Alert>;
}


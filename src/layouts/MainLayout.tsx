import React from 'react';
import { Box } from '@mui/material';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BreadcrumbsNav from '@/components/BreadcrumbsNav';
import MainLayoutClient from './MainLayoutClient';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex" minHeight="100dvh" flexDirection="column">
      <Navbar />
      <BreadcrumbsNav />
      <Box component="main" flexGrow={1}>
        <MainLayoutClient />
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

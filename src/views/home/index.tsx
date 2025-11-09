import React from 'react';
import { Container } from '@mui/material';
import Hero from './components/Hero';
import SolutionsGrid from './components/SolutionsGrid';
import CapabilitiesSection from './components/CapabilitiesSection';

export default function HomeView() {
  return (
    <>
      <Hero />
      <Container sx={{ py: { xs: 6, md: 10 } }}>
        <SolutionsGrid />
        <CapabilitiesSection />
      </Container>
    </>
  );
}


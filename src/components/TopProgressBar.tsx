"use client";

import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import Router from 'next/router';

export default function TopProgressBar() {
  const [visible, setVisible] = React.useState(false);
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let incId: any;
    let hideId: any;

    const onStart = () => {
      clearInterval(incId); clearTimeout(hideId);
      setVisible(true);
      setValue(0);
      incId = setInterval(() => {
        setValue((v) => {
          const next = v + Math.random() * 12 + 8; // 8–20 per tick
          return next < 90 ? next : 90;
        });
      }, 120);
    };
    const onDone = () => {
      clearInterval(incId);
      setValue(100);
      hideId = setTimeout(() => setVisible(false), 250);
    };

    Router.events.on('routeChangeStart', onStart);
    Router.events.on('routeChangeComplete', onDone);
    Router.events.on('routeChangeError', onDone);

    return () => {
      Router.events.off('routeChangeStart', onStart);
      Router.events.off('routeChangeComplete', onDone);
      Router.events.off('routeChangeError', onDone);
      clearInterval(incId);
      clearTimeout(hideId);
    };
  }, []);

  if (!visible) return null;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.tooltip + 1 }}>
      <LinearProgress color="secondary" variant="determinate" value={value} sx={{ height: 3 }} />
    </Box>
  );
}

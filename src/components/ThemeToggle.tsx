"use client";

import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import showReloadSpinner from '@/lib/reload-spinner';

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const { t } = useTranslation();

  const next = mode === "dark" ? "light" : "dark";
  const title =
    next === "light"
      ? t("tooltip_switch_theme_to_light", "Switch to light mode")
      : t("tooltip_switch_theme_to_dark", "Switch to dark mode");

  const handleToggle = () => {
    setMode(next);
    // Force a full reload to ensure all fields/components re-render with new theme
    if (typeof window !== 'undefined') {
      // Give MUI time to persist scheme, then reload
      const docLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      const msg = docLang.startsWith('fa') ? 'در حال تغییر پوسته…' : 'Applying theme…';
      showReloadSpinner(msg);
      setTimeout(() => { try { window.location.reload(); } catch {} }, 80);
    }
  };

  return (
    <Tooltip title={title} arrow placement="bottom">
      <IconButton
        onClick={handleToggle}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "50%",
          bgcolor: mode === "dark" ? "grey.900" : "grey.200",
          transition: "all 0.4s ease",
          boxShadow:
            mode === "dark"
              ? "0 0 10px rgba(255, 255, 255, 0.15)"
              : "0 0 10px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            bgcolor: mode === "dark" ? "grey.800" : "grey.300",
            transform: "scale(1.08)",
            boxShadow:
              mode === "dark"
                ? "0 0 20px rgba(255, 255, 255, 0.25)"
                : "0 0 20px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mode === "dark" ? (
            <motion.div
              key="sun"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Sun size={22} color="#FFD700" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Moon size={22} color="#6C63FF" />
            </motion.div>
          )}
        </AnimatePresence>
      </IconButton>
    </Tooltip>
  );
}

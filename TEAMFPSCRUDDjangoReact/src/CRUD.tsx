import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Dashboard from "./pages/Dashboard";
import Login from "./Login";
import LogoutIcon from "@mui/icons-material/Logout";

const STORAGE_TOKEN_KEY = "apiToken";

export default function CRUD() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (prefersDark) setMode("dark");
  }, [prefersDark]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode, primary: { main: "#2563eb" } },
      }),
    [mode]
  );

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "info" | "error" }>( {
    open: false,
  });

  const onLogin = (t: string) => {
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, t);
    } catch {
      /* ignore */
    }
    setToken(t);
    setSnack({ open: true, message: "Signed in", severity: "success" });
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
    setToken(null);
    setSnack({ open: true, message: "Signed out", severity: "info" });
  };

  const showSnack = (message: string, severity: "success" | "info" | "error" = "info") => {
    setSnack({ open: true, message, severity });
  };

  // If not authenticated show Login
  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Login onLogin={onLogin} onCancel={() => {}} />
          <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity || "info"} sx={{ width: "100%" }}>
              {snack.message}
            </Alert>
          </Snackbar>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage:
            mode === "dark"
              ? `linear-gradient(rgba(7,18,38,0.72), rgba(7,18,38,0.60)), url('https://wallpapers.com/images/high/cartoon-pictures-0o6lshoyz7msr8g7.webp')`
              : `linear-gradient(rgba(255,255,255,0.62), rgba(246,248,250,0.62)), url('https://wallpapers.com/images/high/cartoon-pictures-0o6lshoyz7msr8g7.webp')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          bgcolor: mode === "dark" ? "#071226" : "#f6f8fa",
          pb: 6,
        }}
      >
        <AppBar position="static" color="transparent" sx={{ bgcolor: "transparent" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>S</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Subjects & Students
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add, view and delete subjects and students
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Signed in
              </Typography>

              <Button variant="outlined" startIcon={<LogoutIcon />} onClick={logout}>
                Sign out
              </Button>

              <IconButton
                onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))} // toggles theme mode
                color="inherit"
                aria-label="toggle theme"
                sx={{ ml: 1 }}
              >
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dashboard handles fetching, forms and lists (subjects & students) */}
        <Dashboard token={token} showSnack={showSnack} />

        <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity || "info"} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
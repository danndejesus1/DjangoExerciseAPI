// src/Login.tsx

import {
  Avatar,
  Box,
  Button,
  CssBaseline,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useState } from "react";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || "http://127.0.0.1:8000";
const STORAGE_TOKEN_KEY = "apiToken";

type Props = {
  onLogin: (token: string) => void;
  onCancel?: () => void;
};

const theme = createTheme();

export default function Login({ onLogin, onCancel }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = prefersDark ? "dark" : "light";

  const doLogin = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api-token-auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.non_field_errors?.[0] || "Login failed (check credentials)");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!data.token) {
        setError("Login response missing token");
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      } catch {
        // ignore storage errors
      }
      onLogin(data.token);
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Full-bleed background */}
      <Box
        component="main"
        sx={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            mode === "dark"
                ? `linear-gradient(rgba(255, 255, 255, 0.27), rgba(6,12,24,0.62)), url('https://wallpapers.com/images/high/cartoon-pictures-0o6lshoyz7msr8g7.webp')`
                : `linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url('https://wallpapers.com/images/high/cartoon-pictures-0o6lshoyz7msr8g7.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          // ensure no white edges from scrollbars/layout
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="background"
      >
        {/* translucent centered panel (not a white card) */}
        <Box
          role="dialog"
          aria-labelledby="login-title"
          sx={{
            width: "min(420px, 94vw)",
            borderRadius: 2,
            p: { xs: 3, sm: 4 },
            // translucent backdrop so wallpaper remains visible
            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.64)" : "rgba(255,255,255,0.72)",
            color: mode === "dark" ? "rgba(32, 32, 32, 0.64)" : "rgba(0,0,0,0.87)",
            boxShadow: mode === "dark" ? "0 10px 30px rgba(255, 255, 255, 0.26)" : "0 8px 24px rgba(16,24,40,0.12)",
            backdropFilter: "blur(6px) saturate(120%)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            mx: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography id="login-title" component="h1" variant="h6" sx={{ fontWeight: 600 }}>
            Sign in
          </Typography>

          <Box sx={{ width: "100%" }}>
            <TextField
              aria-label="username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              fullWidth
              autoFocus
              variant="outlined"
              InputProps={{
                sx: {
                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "transparent",
                },
              }}
            />

            <TextField
              aria-label="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              fullWidth
              variant="outlined"
              InputProps={{
                sx: {
                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "transparent",
                },
              }}
            />

            {error ? (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            ) : null}

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button fullWidth variant="contained" onClick={doLogin} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {onCancel ? (
                <Button fullWidth variant="outlined" onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
              ) : null}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Tokens are stored in the Django admin panel key <code>{STORAGE_TOKEN_KEY}</code>.
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
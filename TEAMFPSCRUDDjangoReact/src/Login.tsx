// src/Login.tsx
import React, { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  TextField,
  Typography,
  createTheme,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || "http://127.0.0.1:8000";
const STORAGE_TOKEN_KEY = "apiToken";

type Props = {
  onLogin: (token: string) => void;
  onCancel?: () => void;
};

const theme = createTheme();

// Login component (function) with shorter, junior-style comments
export default function Login({ onLogin, onCancel }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prefers dark theme
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = prefersDark ? "dark" : "light";

  // handle sign-in
  const doLogin = async () => {
    setError(null);
    // quick validation
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      // call API
      const res = await fetch(`${API_BASE}/api-token-auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      // API error -> show message
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.non_field_errors?.[0] || "Login failed (check credentials)");
        setLoading(false);
        return;
      }

      const data = await res.json();
      // ensure token present
      if (!data.token) {
        setError("Login response missing token");
        setLoading(false);
        return;
      }

      // try save token locally
      try {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      } catch {
        // ignore storage errors
      }
      // inform parent
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
      <Box
        sx={{
          minHeight: "100vh",
          // background overlay
          backgroundImage:
            mode === "dark"
              ? `linear-gradient(rgba(7,18,38,0.72), rgba(7,18,38,0.60)), url('https://i.ytimg.com/vi/2KltPcZv6RM/maxresdefault.jpg')`
              : `linear-gradient(rgba(255,255,255,0.62), rgba(246,248,250,0.62)), url('https://i.ytimg.com/vi/2KltPcZv6RM/maxresdefault.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          bgcolor: mode === "dark" ? "#071226" : "#f6f8fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="xs" sx={{ mt: 0 }}>
          <Paper sx={{ p: 3, backdropFilter: "saturate(120%) blur(4px)" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <LockOutlinedIcon />
              </Avatar>
              <Typography component="h1" variant="h6">
                Sign in
              </Typography>

              <Box sx={{ width: "100%", mt: 1 }}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  fullWidth
                  autoFocus
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  fullWidth
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
                  The tokens are stored in the django admin panel my g
                  <code> {STORAGE_TOKEN_KEY}</code>.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
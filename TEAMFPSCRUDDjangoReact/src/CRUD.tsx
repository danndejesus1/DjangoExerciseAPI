import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Login from "./Login";

type Subject = {
  id: number | string;
  name: string;
};

const STORAGE_TOKEN_KEY = "apiToken"; // localStorage key for token
const API_BASE = (import.meta.env?.VITE_API_BASE as string) || "http://127.0.0.1:8000"; // base URL for fetch

// uses fetch; adds Accept/Content-Type and Authorization if token given
async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers["Authorization"] = `Token ${token}`; // adds token header
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: "omit" }); // native fetch
  return res;
}

// Main CRUD component
export default function CRUD() {
  // state: list of subjects from API
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // state: controlled input for new subject name
  const [name, setName] = useState("");
  // state: snackbar status/message
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "info" | "error" }>( {
    open: false,
  });
  // state: id waiting for delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // MUI hook: detect system dark mode
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  // state: UI theme mode
  const [mode, setMode] = useState<"light" | "dark">("light");
  // set initial theme from system preference (runs once)
  useEffect(() => {
    if (prefersDark) setMode("dark");
    
  }, []);

  // memoized MUI theme so it doesn't recreate every render
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode, primary: { main: "#2563eb" } },
        shape: { borderRadius: 10 },
      }),
    [mode]
  );

  // state: auth token (loaded from localStorage lazily)
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY); // read localStorage
    } catch {
      return null;
    }
  });

  // hook: reload subjects when token changes (login/logout)
  useEffect(() => {
    fetchSubjects();
  }, [token]);
  // Load subjects from the API (GET)
  const fetchSubjects = async () => {
    try {
      const res = await apiFetch("/api/subjects/", { method: "GET" }, token || undefined);
      if (res.status === 401) {
        setSubjects([]); // not authorized, clear
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      setSnack({ open: true, message: `Could not load subjects (${(err as Error).message})`, severity: "error" });
    }
  };

  // Create a new subject (POSTMALONE)
  const addSubject = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSnack({ open: true, message: "Subject name required", severity: "error" });
      return;
    }
    try {
      const payload = { name: trimmed };
      const res = await apiFetch("/api/subjects/", { method: "POST", body: JSON.stringify(payload) }, token || undefined);
      if (res.status === 401) {
        setSnack({ open: true, message: "Unauthorized — please sign in", severity: "error" });
        return;
      }
      if (res.status === 400) {
        const body = await res.json().catch(() => null);
        const message = body?.name ? `Error: ${JSON.stringify(body)}` : "Validation error";
        setSnack({ open: true, message, severity: "error" });
        return;
      }
      if (!res.ok) throw new Error(`Add failed: ${res.status}`);
      const created = await res.json();
      setSubjects((s) => [created, ...s]); // add to front of list
      setName("");
      setSnack({ open: true, message: "Subject added", severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: `Add failed: ${(err as Error).message}`, severity: "error" });
    }
  };

  // Delete subject (DELETE)
  const doDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    try {
      const res = await apiFetch(`/api/subjects/${id}/`, { method: "DELETE" }, token || undefined);
      if (res.status === 401) {
        setSnack({ open: true, message: "Unauthorized — please sign in", severity: "error" });
        setConfirmDeleteId(null);
        return;
      }
      if (res.status === 204 || res.status === 200 || res.status === 202) {
        setSubjects((s) => s.filter((x) => String(x.id) !== String(id)));
        setSnack({ open: true, message: "Subject deleted", severity: "info" });
      } else {
        const text = await res.text().catch(() => "");
        throw new Error(text || `status ${res.status}`);
      }
    } catch (err) {
      setSnack({ open: true, message: `Delete failed: ${(err as Error).message}`, severity: "error" });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // called after login: save token and update state
  const onLogin = (t: string) => {
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, t); // persist token
    } catch {
      // ignore
    }
    setToken(t);
    setSnack({ open: true, message: "Signed in", severity: "success" });
  };

  // sign out: clear token
  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {}
    setToken(null);
    setSnack({ open: true, message: "Signed out", severity: "info" });
  };

  // if no token, show Login component
  if (!token) {
    return <Login onLogin={onLogin} onCancel={() => { /* no-op */ }} />;
  }

  // Signed-in UI
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          // layered background: gradient overlay + image
          backgroundImage:
            mode === "dark"
              ? `linear-gradient(rgba(7,18,38,0.72), rgba(7,18,38,0.60)), url('https://i.ytimg.com/vi/2KltPcZv6RM/maxresdefault.jpg')`
              : `linear-gradient(rgba(255,255,255,0.62), rgba(246,248,250,0.62)), url('https://i.ytimg.com/vi/2KltPcZv6RM/maxresdefault.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // 'fixed' produces the parallax-like effect; remove if you want normal scrolling
          backgroundAttachment: "fixed",
          // fallback background color (kept for browsers that don't support bg image)
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
                  Subjects
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add, view and delete subjects (connected)
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

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
              Add Subject
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  label="Subject name"
                  value={name} // controlled input tied to `name` state
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. Mathematics"
                  autoFocus
                />
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addSubject} color="primary" aria-label="add subject">
                  Add Subject
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setName(""); // reset input
                  }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              Subject List ({subjects.length})
            </Typography>

            {subjects.length === 0 ? (
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography color="text.secondary">No subjects yet. Add one above.</Typography>
              </Card>
            ) : (
              <Paper variant="outlined">
                <List disablePadding>
                  {subjects.map((s) => (
                    <React.Fragment key={s.id}>
                      <ListItem>
                        <ListItemText primary={<Typography sx={{ fontWeight: 700 }}>{s.name}</Typography>} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" aria-label={`delete ${s.name}`} onClick={() => setConfirmDeleteId(String(s.id))}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </Container>

        {/* Delete confirmation dialog */}
        <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
          <DialogTitle>Delete subject</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this subject? This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={doDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbars */}
        <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity || "info"} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
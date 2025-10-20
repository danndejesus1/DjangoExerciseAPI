// TEAMFPSCRUDDjangoReact/src/components/StudentForm.tsx

import { Button, Grid, TextField } from "@mui/material";
import React, { useCallback, useState } from "react";

import AddIcon from "@mui/icons-material/Add";

type Props = {
  onAdd: (payload: { email: string; password: string; first_name?: string; last_name?: string }) => Promise<void>;
  disabled?: boolean;
};

export default function StudentForm({ onAdd, disabled = false }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!email.trim()) return;
    if (!password || password.length < 6) return;
    setLoading(true);
    try {
      await onAdd({ email: email.trim(), password, first_name: first.trim() || undefined, last_name: last.trim() || undefined });
      setEmail("");
      setPassword("");
      setFirst("");
      setLast("");
    } finally {
      setLoading(false);
    }
  }, [email, password, first, last, onAdd]);

  return (
    <Grid container spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
      <Grid item xs={12} md={6}>
        <TextField aria-label="student email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required type="email" />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField aria-label="student password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required placeholder="min 6 chars" />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField aria-label="student first name" label="First name" value={first} onChange={(e) => setFirst(e.target.value)} fullWidth />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField aria-label="student last name" label="Last name" value={last} onChange={(e) => setLast(e.target.value)} fullWidth />
      </Grid>
      <Grid item xs={12} sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={disabled || loading || !email || !password || password.length < 6} type="submit">Add Student</Button>
        <Button variant="outlined" onClick={() => { setEmail(""); setPassword(""); setFirst(""); setLast(""); }} disabled={loading}>Reset</Button>
      </Grid>
    </Grid>
  );
}
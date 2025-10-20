// TEAMFPSCRUDDjangoReact/src/components/SubjectForm.tsx

import { Button, Grid, TextField } from "@mui/material";
import React, { useCallback, useState } from "react";

import AddIcon from "@mui/icons-material/Add";

type Props = {
  onAdd: (name: string) => Promise<void>;
  disabled?: boolean;
};

export default function SubjectForm({ onAdd, disabled = false }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onAdd(trimmed);
      setName("");
    } finally {
      setLoading(false);
    }
  }, [name, onAdd]);

  return (
    <Grid container spacing={2} alignItems="center" component="form" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
      <Grid item xs={12} md={6}>
        <TextField aria-label="subject name" label="Subject name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required placeholder="e.g. Mathematics" />
      </Grid>
      <Grid item xs={12} sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={disabled || loading || name.trim() === ""} type="submit">
          Add Subject
        </Button>
        <Button variant="outlined" onClick={() => setName("")} disabled={loading}>Reset</Button>
      </Grid>
    </Grid>
  );
}
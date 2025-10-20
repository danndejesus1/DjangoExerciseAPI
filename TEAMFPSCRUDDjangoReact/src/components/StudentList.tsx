// TEAMFPSCRUDDjangoReact/src/components/StudentList.tsx

import { Divider, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Paper, Typography } from "@mui/material";
import React, { memo } from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Student } from "../api";

type Props = {
  students: Student[];
  onDelete: (id: string | number) => void;
};

function StudentListInner({ students, onDelete }: Props) {
  if (students.length === 0) {
    return <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">No students found.</Typography></Paper>;
  }

  return (
    <Paper variant="outlined" role="list">
      <List disablePadding>
        {students.map((s) => (
          <React.Fragment key={s.id}>
            <ListItem>
              <ListItemText primary={<Typography sx={{ fontWeight: 700 }}>{s.email}</Typography>} secondary={`${s.first_name || ""} ${s.last_name || ""}`.trim()} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label={`delete student ${s.email}`} onClick={() => onDelete(s.id)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}

export default memo(StudentListInner);
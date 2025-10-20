// TEAMFPSCRUDDjangoReact/src/components/SubjectList.tsx

import { Divider, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Paper, Typography } from "@mui/material";
import React, { memo } from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Subject } from "../api";

type Props = {
  subjects: Subject[];
  onDelete: (id: string | number) => void;
};

function SubjectListInner({ subjects, onDelete }: Props) {
  if (subjects.length === 0) {
    return <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">No subjects yet. Add one above.</Typography></Paper>;
  }

  return (
    <Paper variant="outlined" role="list">
      <List disablePadding>
        {subjects.map((s) => (
          <React.Fragment key={s.id}>
            <ListItem>
              <ListItemText primary={<Typography sx={{ fontWeight: 700 }}>{s.name}</Typography>} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label={`delete subject ${s.name}`} onClick={() => onDelete(s.id)}>
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

export default memo(SubjectListInner);
// TEAMFPSCRUDDjangoReact/src/components/ConfirmDialog.tsx

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function ConfirmDialog({ open, title = "Confirm", message = "Are you sure?", onClose, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel" }: Props) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-desc">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-desc">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
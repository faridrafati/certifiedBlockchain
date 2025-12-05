import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import './css/ConfirmDialog.css';

const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = 'primary',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="confirm-dialog"
      PaperProps={{
        className: 'confirm-dialog-paper',
      }}
    >
      <DialogTitle id="confirm-dialog-title" className="confirm-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent className="confirm-dialog-content">
        <DialogContentText
          id="confirm-dialog-description"
          className="confirm-dialog-text"
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions className="confirm-dialog-actions">
        <Button
          onClick={onCancel}
          className="confirm-dialog-cancel-btn"
          variant="outlined"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          className="confirm-dialog-confirm-btn"
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

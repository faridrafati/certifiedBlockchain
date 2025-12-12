/**
 * @file ConfirmDialog.jsx
 * @description Reusable confirmation dialog component using Material-UI
 * @author CertifiedBlockchain
 *
 * A customizable modal dialog for confirming user actions before execution.
 * Used for critical operations like deletions, transactions, etc.
 *
 * CSS: ./css/ConfirmDialog.css
 */

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

/**
 * Confirmation Dialog Component
 *
 * Displays a modal dialog asking the user to confirm or cancel an action.
 * Built with Material-UI Dialog components for consistent styling.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {string} [props.title='Confirm Action'] - Dialog title
 * @param {string} props.message - Confirmation message to display
 * @param {string} [props.confirmText='Confirm'] - Text for confirm button
 * @param {string} [props.cancelText='Cancel'] - Text for cancel button
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {Function} props.onCancel - Callback when user cancels or closes dialog
 * @param {string} [props.confirmColor='primary'] - MUI color for confirm button
 *
 * @returns {JSX.Element} Material-UI Dialog with confirm/cancel buttons
 *
 * @example
 * // Basic usage
 * <ConfirmDialog
 *   open={showDialog}
 *   message="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 *
 * @example
 * // Customized dialog
 * <ConfirmDialog
 *   open={showDialog}
 *   title="Delete Task"
 *   message="This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Keep"
 *   confirmColor="error"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 */
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
      {/* Dialog Title */}
      <DialogTitle id="confirm-dialog-title" className="confirm-dialog-title">
        {title}
      </DialogTitle>

      {/* Dialog Content/Message */}
      <DialogContent className="confirm-dialog-content">
        <DialogContentText
          id="confirm-dialog-description"
          className="confirm-dialog-text"
        >
          {message}
        </DialogContentText>
      </DialogContent>

      {/* Action Buttons */}
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

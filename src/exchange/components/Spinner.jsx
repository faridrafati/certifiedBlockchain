import React from 'react';
import { CircularProgress, Typography, TableBody, TableRow, TableCell } from '@mui/material';

export default function Spinner({ type }) {
  if (type === 'table') {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={3}>
            <div className="spinner-container">
              <CircularProgress />
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    )
  } else {
    return (
      <div className="spinner-container">
        <CircularProgress size={48} />
        <Typography className="loading-text">Loading data...</Typography>
      </div>
    )
  }
}

/**
 * @file datePicker.jsx
 * @description Code snippet example for MUI DatePicker usage
 * @author CertifiedBlockchain
 *
 * This file contains a code snippet demonstrating how to use
 * Material-UI DatePicker with Day.js adapter.
 *
 * Note: This is a reference snippet, not a functional component.
 *
 * Dependencies:
 * - @mui/x-date-pickers
 * - @mui/material
 * - dayjs
 *
 * @example
 * // Use in a functional component with useState:
 * const [value, setValue] = useState(null);
 */

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Basic example"
    value={value}
    onChange={(newValue) => {
      setValue(newValue);
    }}
    renderInput={(params) => <TextField {...params} />}
  />
</LocalizationProvider>
/**
 * @file select.jsx
 * @description Reusable dropdown select component with error display
 * @author CertifiedBlockchain
 *
 * Bootstrap-styled select dropdown that:
 * - Renders a labeled dropdown with options
 * - Displays validation errors below the select
 * - Passes through additional props to the select element
 *
 * Used By: form.jsx
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.name - Select name and id attribute
 * @param {string} props.label - Label text to display
 * @param {Array} props.options - Array of options [{_id, name}]
 * @param {string} [props.error] - Error message to display
 * @param {...any} props.rest - Additional props passed to select
 *
 * @example
 * <Select
 *   name="category"
 *   label="Category"
 *   options={[{_id: '1', name: 'Option A'}]}
 *   error={errors.category}
 * />
 */

import React from "react";

const Select = ({ name, label, options, error, ...rest }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select name={name} id={name} {...rest} className="form-control">
        <option value="" />
        {options.map(option => (
          <option key={option._id} value={option._id}>
            {option.name}
          </option>
        ))}
      </select>
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default Select;

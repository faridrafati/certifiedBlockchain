/**
 * @file input.jsx
 * @description Reusable form input component with error display
 * @author CertifiedBlockchain
 *
 * Bootstrap-styled input component that:
 * - Renders a labeled text input field
 * - Displays validation errors below the input
 * - Passes through additional props to the input element
 *
 * Used By: form.jsx, loginForm.jsx
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.name - Input name and id attribute
 * @param {string} props.label - Label text to display
 * @param {string} [props.error] - Error message to display
 * @param {...any} props.rest - Additional props passed to input
 *
 * @example
 * <Input name="email" label="Email Address" error={errors.email} />
 */

import React from "react";

const Input = ({ name, label, error, ...rest }) => {
  return (
    <div className="form-group mb-3">
      <label htmlFor={name}>{label}</label>
      <input {...rest} name={name} id={name} className="form-control" />
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default Input;

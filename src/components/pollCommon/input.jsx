/**
 * @file pollCommon/input.jsx
 * @description Poll-specific form input component with Bootstrap grid layout
 * @author CertifiedBlockchain
 *
 * Bootstrap-styled input component for poll creation forms.
 * Uses row/column grid layout for label-input alignment.
 *
 * Features:
 * - Bootstrap grid layout (2-column label, 8-column input)
 * - Small form control styling
 * - Error message display
 * - Props pass-through to input element
 *
 * Used By: pollForm.jsx
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.name - Input name and id attribute
 * @param {string} props.label - Label text to display
 * @param {string} [props.error] - Error message to display
 * @param {...any} props.rest - Additional props passed to input
 *
 * @example
 * <Input name="question" label="Question" error={errors.question} />
 */

import React from "react";

const Input = ({ name, label, error, ...rest }) => {
  return (
    <div className='form-group row my-3'>
      <label className='col-sm-2 col-form-label col-form-label-sm my-2'>
        {label}:
      </label>
      <div className='col-sm-8'>
        <input {...rest} name={name} id={name} className="form-control" />
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
};

export default Input;

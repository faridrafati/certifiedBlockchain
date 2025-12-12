/**
 * @file pollCommon/select.jsx
 * @description Poll-specific dropdown select for address selection
 * @author CertifiedBlockchain
 *
 * Bootstrap-styled select dropdown specifically for selecting
 * Ethereum wallet addresses in poll-related forms.
 *
 * Features:
 * - Default placeholder option
 * - Address-based option values
 * - Bootstrap form-control styling
 * - Props pass-through to select element
 *
 * Used By: pollForm.jsx (for recipient selection)
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.name - Select name and id attribute
 * @param {Array} props.options - Array of address objects [{address}]
 * @param {...any} props.rest - Additional props passed to select
 *
 * @example
 * <Select
 *   name="recipient"
 *   options={[{address: '0x123...'}, {address: '0x456...'}]}
 * />
 */

import React from "react";

const Select = ({ name, options, ...rest }) => {
  return (
    <div className="form-group col-auto">
      <select defaultValue={'DEFAULT'} name={name} id={name} {...rest} className="form-control">
        <option value='DEFAULT'>Open this select menu</option>
        {options.map((option,index) => (
          <option key={index} value={option.address}>
            {option.address}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;

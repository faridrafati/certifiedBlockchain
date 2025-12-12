/**
 * @file loginForm.jsx
 * @description User registration form for blockchain email system
 * @author CertifiedBlockchain
 *
 * This component handles new user registration for the Email DApp:
 * - Validates username input using Joi schema
 * - Creates a blockchain inbox for the user
 * - One-time registration process
 *
 * Features:
 * - Form validation with Joi
 * - Extends reusable Form base class
 * - Clear instructions for new users
 * - MetaMask transaction required for registration
 *
 * Used By: Email.jsx (for new user onboarding)
 * Parent Component: Form (./form.jsx)
 *
 * @example
 * <LoginForm register={handleUserRegistration} />
 */

import React from "react";
import Joi from "joi-browser";
import Form from "./form";

class LoginForm extends Form {
  state = {
    data: { username: ""},
    errors: {}
  };

  schema = {
    username: Joi.string()
      .required()
      .label("Username")
  };

  doSubmit = (name) => {
    // Call the server
    this.props.register(name.username);
  };

  render() {
    return (
      <div className="registration-form-wrapper">
        <div className="card">
          <div className="card-header">
            <h1>Registering Form</h1>
          </div>
          <div className="card-body">
            <form onSubmit={this.handleSubmit}>
              {this.renderInput("username", "Username")}
              {this.renderButton("Register")}
            </form>
          </div>
          <div className="card-footer">
            <b className="mb-3">Note:</b>
            <p className="text-muted">You are new User you need to be registered now.</p>
            <hr />
            <p className="text-muted">New user: we need to setup an inbox for you on the Ethereum blockchain. For this you will need to submit a transaction in MetaMask. You will only need to do this once.</p>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginForm;

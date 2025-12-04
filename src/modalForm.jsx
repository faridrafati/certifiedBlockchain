import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import MetamaskLogo from './metamask.svg';
import './components/css/modalForm.css';

const ModalForm = ({ message, buttonName, onClick }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
  }, [message, buttonName]);

  const handleClose = () => {
    switch (buttonName) {
      case 'Connect':
        onClick();
        setShow(false);
        break;
      case 'Install':
        window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
        // Keep modal open to remind user to install
        break;
      case 'Refresh':
        window.location.reload();
        break;
      case 'Ok':
        setShow(false);
        break;
      default:
        setShow(false);
    }
  };

  const getButtonVariant = () => {
    switch (buttonName) {
      case 'Connect':
        return 'primary';
      case 'Install':
        return 'warning';
      case 'Refresh':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getIcon = () => {
    switch (buttonName) {
      case 'Connect':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 10L9 13L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Install':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 15V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'Refresh':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16C7.79086 16 5.85216 14.7822 4.85714 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 13H5V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      show={show}
      onHide={buttonName === 'Install' ? undefined : handleClose}
      backdrop={buttonName === 'Install' ? 'static' : true}
      keyboard={false}
      centered
      className="metamask-modal"
    >
      <Modal.Body className="metamask-modal-body">
        <div className="modal-content-wrapper">
          <div className="metamask-logo-container">
            <img
              className="metamask-logo"
              src={MetamaskLogo}
              alt="MetaMask logo"
            />
            <div className="logo-pulse"></div>
          </div>

          <h3 className="modal-title">
            {buttonName === 'Connect' && 'Connect Your Wallet'}
            {buttonName === 'Install' && 'MetaMask Required'}
            {buttonName === 'Refresh' && 'Account Changed'}
            {buttonName === 'Ok' && 'Welcome!'}
          </h3>

          <p className="modal-message">
            {message}
          </p>

          {buttonName === 'Install' && (
            <div className="info-box">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4V8M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>MetaMask is a secure cryptocurrency wallet that enables you to interact with blockchain applications.</span>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="metamask-modal-footer">
        <Button
          variant={getButtonVariant()}
          onClick={handleClose}
          className="modal-action-button"
        >
          {getIcon()}
          {buttonName}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ModalForm.propTypes = {
  message: PropTypes.string.isRequired,
  buttonName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ModalForm;

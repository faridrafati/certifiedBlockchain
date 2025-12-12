/**
 * @file Navigation.jsx
 * @description Navigation bar component for tokenmaster ticketing system
 * @author CertifiedBlockchain
 *
 * Top navigation bar with branding, search, category links, and wallet connection.
 * Uses ethers.js for wallet connection via MetaMask.
 *
 * Features:
 * - Brand logo and title
 * - Search input for events
 * - Category navigation links (Concerts, Sports, Arts & Theater)
 * - Wallet connect button with address display
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.account - Connected wallet address
 * @param {Function} props.setAccount - Callback to update account state
 *
 * @example
 * <Navigation account={account} setAccount={setAccount} />
 */

import { ethers } from 'ethers'

const Navigation = ({ account, setAccount }) => {
  const connectHandler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.getAddress(accounts[0])
    setAccount(account)
  }

  return (
    <nav>
      <div className='nav__brand'>
        <h1>tokenmaster</h1>

        <input className='nav__search' type="text" placeholder='Find millions of experiences' />

        <ul className='nav__links'>
          <li><a href="/">Concerts</a></li>
          <li><a href="/">Sports</a></li>
          <li><a href="/">Arts & Theater</a></li>
          <li><a href="/">More</a></li>
        </ul>
      </div>

      {account ? (
        <button
          type="button"
          className='nav__connect'
        >
          {account.slice(0, 6) + '...' + account.slice(38, 42)}
        </button>
      ) : (
        <button
          type="button"
          className='nav__connect'
          onClick={connectHandler}
        >
          Connect
        </button>
      )}
    </nav>
  );
}

export default Navigation;
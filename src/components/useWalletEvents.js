/**
 * @file useWalletEvents.js
 * @description Shared hook for MetaMask wallet event handling
 *
 * Registers chainChanged/accountsChanged listeners once per mounted page and
 * removes them on unmount. Pages previously registered anonymous listeners
 * inside their init functions with no cleanup, so navigating between routes
 * accumulated stale listeners (each one calling window.location.reload()).
 */

import { useEffect } from 'react';

/**
 * Reloads the page when the user switches network or account so the page
 * re-initializes its contract state. Listeners are cleaned up on unmount.
 *
 * @param {function(string[]): void} [onAccountsChanged] Optional custom
 *        handler for account changes; defaults to reloading the page when
 *        at least one account is connected.
 */
export default function useWalletEvents(onAccountsChanged) {
  useEffect(() => {
    const { ethereum } = window;
    if (!ethereum?.on) return undefined;

    const handleChainChanged = () => window.location.reload();
    const handleAccountsChanged = (accounts) => {
      if (onAccountsChanged) {
        onAccountsChanged(accounts);
      } else if (accounts.length > 0) {
        window.location.reload();
      }
    };

    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
    // Listeners are intentionally registered once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

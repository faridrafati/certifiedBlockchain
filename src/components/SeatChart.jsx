/**
 * @file SeatChart.jsx
 * @description Visual seat selection chart for event ticketing
 * @author CertifiedBlockchain
 *
 * Displays an interactive venue seating map where users can view available
 * seats and purchase tickets as NFTs. The layout includes:
 * - Stage area
 * - VIP section (25 seats on left)
 * - General admission (center section)
 * - VIP section (25 seats on right)
 * - Walkways between sections
 *
 * Used in: TicketSale.jsx
 */

import { useEffect, useState } from 'react'

// Import Components
import Seat from './Seat'

// Import Assets
import close from '../assets/close.svg'

/**
 * Seat Chart Component
 *
 * Renders an interactive venue seating map for ticket purchases.
 * Fetches taken seats from the smart contract and handles seat purchases.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.occasion - Event data from smart contract
 * @param {number} props.occasion.id - Event ID
 * @param {string} props.occasion.name - Event name
 * @param {BigInt} props.occasion.cost - Ticket price in wei
 * @param {BigInt} props.occasion.maxTickets - Maximum tickets available
 * @param {Object} props.tokenMaster - Ethers.js contract instance for TicketSale
 * @param {Object} props.provider - Ethers.js provider (for signing transactions)
 * @param {Function} props.setToggle - Function to close the seat chart modal
 *
 * @returns {JSX.Element} Interactive seating chart with purchasable seats
 *
 * @example
 * <SeatChart
 *   occasion={selectedEvent}
 *   tokenMaster={ticketSaleContract}
 *   provider={ethersProvider}
 *   setToggle={setShowSeatChart}
 * />
 */
const SeatChart = ({ occasion, tokenMaster, provider, setToggle }) => {
  // State for tracking which seats are already purchased
  const [seatsTaken, setSeatsTaken] = useState(false)

  // State to trigger re-fetch after a purchase
  const [hasSold, setHasSold] = useState(false)

  /**
   * Fetches the list of taken seats from the smart contract
   */
  const getSeatsTaken = async () => {
    const seatsTaken = await tokenMaster.getSeatsTaken(occasion.id)
    setSeatsTaken(seatsTaken)
  }

  /**
   * Handles seat purchase
   * Connects to user's wallet, sends mint transaction, waits for confirmation
   *
   * @param {number} _seat - The seat number to purchase
   */
  const buyHandler = async (_seat) => {
    setHasSold(false)

    // Get signer from provider (user's wallet)
    const signer = await provider.getSigner()

    // Send mint transaction to purchase the seat as NFT
    const transaction = await tokenMaster.connect(signer).mint(occasion.id, _seat, { value: occasion.cost })
    await transaction.wait()

    // Trigger re-fetch of taken seats
    setHasSold(true)
  }

  // Fetch taken seats on mount and after each purchase
  useEffect(() => {
    getSeatsTaken()
  }, [hasSold])

  return (
    <div className="occasion">
      <div className="occasion__seating">
        {/* Event title */}
        <h1>{occasion.name} Seating Map</h1>

        {/* Close button */}
        <button onClick={() => setToggle(false)} className="occasion__close">
          <img src={close} alt="Close" />
        </button>

        {/* Stage indicator */}
        <div className="occasion__stage">
          <strong>STAGE</strong>
        </div>

        {/* Left VIP Section - 25 seats (5x5 grid) */}
        {seatsTaken && Array(25).fill(1).map((e, i) =>
          <Seat
            i={i}
            step={1}
            columnStart={0}
            maxColumns={5}
            rowStart={2}
            maxRows={5}
            seatsTaken={seatsTaken}
            buyHandler={buyHandler}
            key={i}
          />
        )}

        {/* Left walkway separator */}
        <div className="occasion__spacer--1 ">
          <strong>WALKWAY</strong>
        </div>

        {/* Center General Admission Section */}
        {seatsTaken && Array(Number(occasion.maxTickets) - 50).fill(1).map((e, i) =>
          <Seat
            i={i}
            step={26}
            columnStart={6}
            maxColumns={15}
            rowStart={2}
            maxRows={15}
            seatsTaken={seatsTaken}
            buyHandler={buyHandler}
            key={i}
          />
        )}

        {/* Right walkway separator */}
        <div className="occasion__spacer--2">
          <strong>WALKWAY</strong>
        </div>

        {/* Right VIP Section - 25 seats (5x5 grid) */}
        {seatsTaken && Array(25).fill(1).map((e, i) =>
          <Seat
            i={i}
            step={(Number(occasion.maxTickets) - 24)}
            columnStart={22}
            maxColumns={5}
            rowStart={2}
            maxRows={5}
            seatsTaken={seatsTaken}
            buyHandler={buyHandler}
            key={i}
          />
        )}
      </div>
    </div >
  );
}

export default SeatChart;

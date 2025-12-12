/**
 * @file Card.jsx
 * @description Event card component for the TicketSale feature
 * @author CertifiedBlockchain
 *
 * Displays event information in a card format including date, time, name,
 * location, and ticket price. Provides a button to view available seats
 * or shows "Sold Out" if no tickets remain.
 *
 * Used in: TicketSale.jsx
 */

import { ethers } from 'ethers'

/**
 * Event Card Component
 *
 * Renders an individual event card with details and a button to view seats.
 * When clicked, opens the seat selection modal for the event.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.occasion - Event data object from the smart contract
 * @param {string} props.occasion.name - Event name
 * @param {string} props.occasion.date - Event date
 * @param {string} props.occasion.time - Event time
 * @param {string} props.occasion.location - Event location
 * @param {BigInt} props.occasion.cost - Ticket price in wei
 * @param {BigInt} props.occasion.tickets - Number of remaining tickets
 * @param {boolean} props.toggle - Current state of the seat selection modal
 * @param {Function} props.setToggle - Function to toggle modal visibility
 * @param {Function} props.setOccasion - Function to set the selected occasion
 *
 * @returns {JSX.Element} Event card with details and action button
 *
 * @example
 * <Card
 *   occasion={eventData}
 *   toggle={showModal}
 *   setToggle={setShowModal}
 *   setOccasion={setSelectedEvent}
 * />
 */
const Card = ({ occasion, toggle, setToggle, setOccasion }) => {
  /**
   * Handles card click - opens the seat selection modal
   * Sets the current occasion and toggles the modal visibility
   */
  const togglePop = () => {
    setOccasion(occasion)
    toggle ? setToggle(false) : setToggle(true)
  }

  return (
    <div className='card'>
      <div className='card__info'>
        {/* Event Date and Time */}
        <p className='card__date'>
          <strong>{occasion.date}</strong><br />{occasion.time}
        </p>

        {/* Event Name */}
        <h3 className='card__name'>
          {occasion.name}
        </h3>

        {/* Event Location */}
        <p className='card__location'>
          <small>{occasion.location}</small>
        </p>

        {/* Ticket Price in ETH */}
        <p className='card__cost'>
          <strong>
            {ethers.formatUnits(occasion.cost.toString(), 'ether')}
          </strong>
          ETH
        </p>

        {/* Action Button - View Seats or Sold Out */}
        {occasion.tickets.toString() === "0" ? (
          <button
            type="button"
            className='card__button--out'
            disabled
          >
            Sold Out
          </button>
        ) : (
          <button
            type="button"
            className='card__button'
            onClick={() => togglePop()}
          >
            View Seats
          </button>
        )}
      </div>

      <hr />
    </div >
  );
}

export default Card;

/**
 * @file Sort.jsx
 * @description Filter/Sort component for tokenmaster event listings
 * @author CertifiedBlockchain
 *
 * Provides dropdown filters for browsing events by:
 * - Genre (event type)
 * - Dates (when events occur)
 * - Distance (proximity to user)
 *
 * Used in the TicketSale listing pages to help users
 * find relevant events.
 *
 * @component
 * @example
 * <Sort />
 */

// Assets
import down from '../assets/angle-down-solid.svg'

const Sort = () => {
  return (
    <div className="sort">
      <div className="sort__select">
        <p>Select Your Genre</p>
        <img src={down} alt="Dropdown" />
      </div>

      <div className="sort__select">
        <p>Select Your Dates</p>
        <img src={down} alt="Dropdown" />
      </div>

      <div className="sort__select">
        <p>Select Your Distance</p>
        <img src={down} alt="Dropdown" />
      </div>
    </div>
  );
}

export default Sort;
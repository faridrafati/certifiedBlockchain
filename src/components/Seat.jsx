/**
 * @file Seat.jsx
 * @description Individual seat component for the visual seat selection grid
 * @author CertifiedBlockchain
 *
 * Renders a single clickable seat in the venue seat chart.
 * Supports different visual states for available/taken seats.
 *
 * Used in: SeatChart.jsx
 */

/**
 * Individual Seat Component
 *
 * Displays a single seat in the venue grid layout.
 * Uses CSS Grid positioning for flexible seating arrangements.
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.i - Seat index in the current section
 * @param {number} props.step - Starting seat number offset for this section
 * @param {number} props.columnStart - Grid column start position
 * @param {number} props.maxColumns - Number of columns in this section
 * @param {number} props.rowStart - Grid row start position
 * @param {number} props.maxRows - Number of rows in this section
 * @param {Array<BigInt>} props.seatsTaken - Array of already purchased seat numbers
 * @param {Function} props.buyHandler - Callback function when seat is clicked
 *
 * @returns {JSX.Element} A clickable seat div with seat number
 *
 * @example
 * <Seat
 *   i={0}
 *   step={1}
 *   columnStart={0}
 *   maxColumns={5}
 *   rowStart={2}
 *   maxRows={5}
 *   seatsTaken={[1, 5, 10]}
 *   buyHandler={(seatNum) => handlePurchase(seatNum)}
 * />
 */
const Seat = ({ i, step, columnStart, maxColumns, rowStart, maxRows, seatsTaken, buyHandler }) => {
    // Calculate actual seat number
    const seatNumber = i + step;

    // Check if this seat is already taken
    const isTaken = seatsTaken.find(seat => Number(seat) == seatNumber);

    return (
        <div
            onClick={() => buyHandler(seatNumber)}
            className={isTaken ? "occasion__seats--taken" : "occasion__seats"}
            style={{
                // CSS Grid positioning for the seat
                gridColumn: `${((i % maxColumns) + 1) + columnStart}`,
                gridRow: `${Math.ceil(((i + 1) / maxRows)) + rowStart}`
            }}
        >
            {seatNumber}
        </div>
    );
}

export default Seat;

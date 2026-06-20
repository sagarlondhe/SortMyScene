import SeatLegend from './SeatLegend';

const SeatMap = ({ seats, selectedSeats, onSeatToggle }) => {
  const getSeatClass = (seat) => {
    if (selectedSeats.includes(seat.seat_number)) return 'selected';
    return seat.status;
  };

  const handleClick = (seat) => {
    if (seat.status !== 'available') return;
    onSeatToggle(seat.seat_number);
  };

  return (
    <div>
      <SeatLegend />
      <div className="seat-grid">
        {seats.map((seat) => (
          <button
            key={seat.id || seat.seat_number}
            className={`seat ${getSeatClass(seat)}`}
            onClick={() => handleClick(seat)}
            disabled={seat.status !== 'available' && !selectedSeats.includes(seat.seat_number)}
            title={`${seat.seat_number} - ${seat.status}`}
          >
            {seat.seat_number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeatMap;

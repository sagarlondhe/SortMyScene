import React from 'react';

/**
 * Seat Component
 * Props:
 *   seatId     — MongoDB _id (used to identify seat on select)
 *   label      — display text inside the seat, e.g. "A3"
 *   status     — 'available' | 'selected' | 'booked' | 'reserved'
 *   onSelect   — called with seatId when an available seat is clicked
 *   disabled   — force-disable (e.g. during active reservation)
 */
const Seat = ({ seatId, label, status, onSelect, disabled = false }) => {
  const isClickable = !disabled && status === 'available';

  const base =
    'relative w-9 h-9 sm:w-10 sm:h-10 rounded-t-xl border-b-4 flex items-center justify-center ' +
    'text-[10px] sm:text-xs font-bold transition-all duration-150 select-none focus:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-400';

  const variants = {
    available:
      'bg-emerald-400 border-emerald-600 text-white hover:bg-emerald-300 hover:scale-110 cursor-pointer shadow-sm',
    selected:
      'bg-blue-500 border-blue-700 text-white scale-110 shadow-md cursor-pointer ring-2 ring-blue-300',
    booked:
      'bg-rose-400 border-rose-600 text-white opacity-70 cursor-not-allowed',
    reserved:
      'bg-amber-400 border-amber-600 text-white opacity-80 cursor-not-allowed',
  };

  const cls = `${base} ${variants[status] ?? variants.available}`;

  return (
    <button
      type="button"
      onClick={() => isClickable && onSelect?.(seatId)}
      disabled={!isClickable}
      className={cls}
      title={`${label} — ${status}`}
      aria-label={`Seat ${label}, ${status}`}
      aria-pressed={status === 'selected'}
    >
      {label}
    </button>
  );
};

export default Seat;

import React, { useMemo } from 'react';
import Seat from './Seat';

/**
 * SeatGrid — cinema-style interactive seat map.
 *
 * Expects each seat object (from the API) to have:
 *   id          — MongoDB _id string
 *   seatNumber  — e.g. "A3"   (full label used for selection logic)
 *   row         — e.g. "A"    (populated by Seat model pre-save hook)
 *   seatIndex   — e.g. 3     (numeric position within the row)
 *   status      — 'available' | 'reserved' | 'booked'
 *
 * Props:
 *   seats          — array of seat objects
 *   selectedSeats  — array of seatNumber strings currently selected
 *   onSeatSelect   — called with the seat _id when a seat is toggled
 */
const SeatGrid = ({ seats = [], selectedSeats = [], onSeatSelect }) => {
  // ── 1. Group & sort seats by row ────────────────────────────────────────────
  const { rowOrder, seatsByRow } = useMemo(() => {
    const map = {};

    seats.forEach((seat) => {
      // Derive row from seatNumber if the row field is missing
      const row =
        seat.row ||
        (seat.seatNumber ? seat.seatNumber.match(/^([A-Z]+)/)?.[1] : null) ||
        '?';

      if (!map[row]) map[row] = [];
      map[row].push({ ...seat, _row: row });
    });

    // Sort rows A → Z
    const order = Object.keys(map).sort((a, b) => a.localeCompare(b));

    // Sort seats within each row by seatIndex (or parsed number from seatNumber)
    order.forEach((row) => {
      map[row].sort((a, b) => {
        const ai = a.seatIndex ?? parseInt(a.seatNumber?.replace(/\D/g, ''), 10) ?? 0;
        const bi = b.seatIndex ?? parseInt(b.seatNumber?.replace(/\D/g, ''), 10) ?? 0;
        return ai - bi;
      });
    });

    return { rowOrder: order, seatsByRow: map };
  }, [seats]);

  if (seats.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <p>No seats available for this event.</p>
      </div>
    );
  }

  const maxSeatsInRow = Math.max(...rowOrder.map((r) => seatsByRow[r].length));

  return (
    <div className="w-full">
      {/* ── SCREEN ── */}
      <div className="mb-8 px-4">
        <div
          className="relative mx-auto h-10 rounded-b-[50%] flex items-end justify-center pb-1
                     bg-gradient-to-b from-gray-200 to-gray-100 shadow-inner border border-gray-300"
          style={{ maxWidth: `${Math.min(maxSeatsInRow * 44 + 80, 800)}px` }}
        >
          <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Screen
          </span>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2 tracking-wide">
          All eyes this way ↑
        </p>
      </div>

      {/* ── SEAT MAP ── */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex flex-col gap-2 min-w-max mx-auto px-4">
          {rowOrder.map((row, rowIdx) => {
            const rowSeats = seatsByRow[row];
            // Insert an aisle gap after every 5 seats visually
            const AISLE_AFTER = 5;

            return (
              <div key={row} className="flex items-center gap-2">
                {/* Left row label */}
                <span className="w-7 shrink-0 text-center text-xs font-bold text-gray-500 uppercase">
                  {row}
                </span>

                {/* Seats with optional aisle gap */}
                <div className="flex gap-1.5">
                  {rowSeats.map((seat, seatIdx) => {
                    const status = selectedSeats.includes(seat.seatNumber)
                      ? 'selected'
                      : seat.status;

                    return (
                      <React.Fragment key={seat.id}>
                        {/* Aisle gap every AISLE_AFTER seats */}
                        {seatIdx > 0 && seatIdx % AISLE_AFTER === 0 && (
                          <span className="w-4 shrink-0" aria-hidden="true" />
                        )}
                        <Seat
                          seatId={seat.id}
                          label={seat.seatNumber}
                          status={status}
                          onSelect={onSeatSelect}
                          disabled={!onSeatSelect}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Right row label */}
                <span className="w-7 shrink-0 text-center text-xs font-bold text-gray-500 uppercase">
                  {row}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 border-t border-gray-100 pt-5">
        {[
          { color: 'bg-emerald-400 border-emerald-600', label: 'Available' },
          { color: 'bg-blue-500 border-blue-700',   label: 'Selected'  },
          { color: 'bg-rose-400 border-rose-600',   label: 'Booked'    },
          { color: 'bg-amber-400 border-amber-600', label: 'Reserved'  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-t-lg border-b-4 inline-block ${color}`}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* ── SELECTION COUNTER ── */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 text-center">
          <span className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-200">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected:{' '}
            {selectedSeats.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;

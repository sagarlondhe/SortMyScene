import { useState, useCallback } from 'react';

/**
 * useSeatSelection Hook - Manages seat selection state
 */
export const useSeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  const toggleSeat = useCallback((seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  const addSeats = useCallback((seatIds) => {
    setSelectedSeats((prev) => [...prev, ...seatIds.filter((id) => !prev.includes(id))]);
  }, []);

  const removeSeats = useCallback((seatIds) => {
    setSelectedSeats((prev) => prev.filter((id) => !seatIds.includes(id)));
  }, []);

  return {
    selectedSeats,
    toggleSeat,
    clearSelection,
    addSeats,
    removeSeats,
    count: selectedSeats.length,
  };
};

export default useSeatSelection;

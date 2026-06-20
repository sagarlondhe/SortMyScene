import React from 'react';
import Button from '../common/Button';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

/**
 * BookingSummary Component - Sticky booking summary sidebar
 */
const BookingSummary = ({
  selectedSeats = [],
  onReserve,
  onConfirm,
  isLoading = false,
  eventName,
  isMobile = false,
  showConfirm = false,
  reservationId,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!isMobile);

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">Booking Summary</h3>
        {eventName && <p className="text-sm text-gray-600 mt-1">{eventName}</p>}
      </div>

      <div className="border-t border-gray-200" />

      {/* Selected Seats */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Seats</h4>
        {selectedSeats.length > 0 ? (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 font-mono leading-relaxed">
              {selectedSeats.join(', ')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700">Please select seats first</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200" />

      {/* Actions */}
      <div className="space-y-2">
        {!showConfirm ? (
          <Button
            onClick={onReserve}
            isLoading={isLoading}
            disabled={selectedSeats.length === 0 || isLoading}
            className="w-full"
          >
            Reserve Seats
          </Button>
        ) : (
          <>
            <Button
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              Confirm Booking
            </Button>
            <p className="text-xs text-center text-gray-500">
              Reservation ID:{' '}
              <span className="font-mono text-primary-600">{reservationId}</span>
            </p>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-primary-50 p-3 rounded-lg">
        <p className="text-xs text-primary-700">
          ℹ️ Your reservation will be held for 10 minutes. Complete your booking before the time expires.
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-card-lg z-30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-900">
            Booking Summary
            {selectedSeats.length > 0 && (
              <span className="ml-2 text-primary-600">({selectedSeats.length} seats)</span>
            )}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200 max-h-96 overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6 sticky top-24 h-fit">
      {content}
    </div>
  );
};

export default BookingSummary;

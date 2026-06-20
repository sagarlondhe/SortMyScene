import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsAPI, reservationAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SeatGrid, CountdownTimer, BookingSummary } from '../components/features';
import { Alert, Loader, Skeleton } from '../components/common';
import { ArrowLeft, Calendar, MapPin, Users, Clock } from 'lucide-react';

/**
 * EventDetail Page - Event seat selection and booking
 */
const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // State
  const [event, setEvent] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    try {
      const { data } = await eventsAPI.getById(id);
      setEvent(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(fetchEvent, 30000);
    return () => clearInterval(interval);
  }, [fetchEvent]);

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle seat selection — seatId here is the MongoDB _id string
  const handleSeatSelect = (seatId) => {
    if (reservation) return;
    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  // Map selected MongoDB _ids → seat number strings (e.g. "A3") for display & API
  const getSelectedSeatNumbers = () => {
    if (!event?.seats) return [];
    return selectedSeatIds
      .map((seatId) => {
        const seat = event.seats.find((s) => s.id === seatId);
        return seat ? seat.seatNumber : null;
      })
      .filter(Boolean);
  };

  // Handle reserve button
  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setError('');
    setSuccess('');
    setIsActionLoading(true);

    try {
      const { data } = await reservationAPI.reserve({
        eventId: id,
        seatNumbers: getSelectedSeatNumbers(),
      });

      setReservation({
        id: data.data.reservationId,
        expiresAt: data.data.expiresAt,
        seatIds: selectedSeatIds,
      });
      setSuccess('Seats reserved! Complete your booking before the timer expires.');
      await fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || 'Reservation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    setError('');
    setSuccess('');
    setIsActionLoading(true);

    try {
      const { data } = await bookingAPI.confirm({
        reservationId: reservation.id,
      });
      setSuccess('Booking confirmed successfully!');
      setTimeout(() => {
        navigate(`/bookings?confirmed=${data.data.bookingId}`, { state: { bookingId: data.data.bookingId } });
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Booking failed';
      setError(message);
      if (message.includes('Expired') || message.includes('expired')) {
        setReservation(null);
        setSelectedSeatIds([]);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle reservation expiry
  const handleReservationExpire = async () => {
    setError('Your reservation has expired. Please select seats again.');
    setReservation(null);
    setSelectedSeatIds([]);
    await fetchEvent();
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="mb-6">
            <Skeleton width="w-24" height="h-4" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton height="h-32" />
              <Skeleton height="h-96" />
            </div>
            <Skeleton height="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <Alert
            type="error"
            title="Event Not Found"
            message={error || 'The event you are looking for does not exist or has been removed.'}
            closeable={false}
          />
        </div>
      </div>
    );
  }

  const availableSeats = event.totalSeats - (event.bookedSeats || 0) - (event.reservedSeats || 0);
  const selectedSeatNumbers = getSelectedSeatNumbers();

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError('')}
            className="mb-6"
          />
        )}

        {success && (
          <Alert
            type="success"
            title="Success"
            message={success}
            closeable={false}
            className="mb-6"
          />
        )}

        {/* Event Details Card */}
        <div className="bg-white rounded-xl shadow-card p-6 sm:p-8 mb-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Event Info */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Venue</p>
                    <p className="text-gray-900 font-medium">{event.venue}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                    <p className="text-gray-900 font-medium">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Time</p>
                    <p className="text-gray-900 font-medium">{formatTime(event.date)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Availability</p>
                    <p className="text-gray-900 font-medium">{availableSeats} / {event.totalSeats} seats</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Seats', value: event.totalSeats },
                { label: 'Available', value: availableSeats },
                { label: 'Booked', value: event.bookedSeats || 0 },
                { label: 'Reserved', value: event.reservedSeats || 0 },
                { label: 'Occupancy', value: `${(((event.bookedSeats || 0) + (event.reservedSeats || 0)) / event.totalSeats * 100).toFixed(0)}%` },
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Seat Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Select Your Seats</h2>
                {selectedSeatIds.length > 0 && !reservation && (
                  <button
                    onClick={() => setSelectedSeatIds([])}
                    className="text-xs text-gray-500 hover:text-error-600 underline transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {!isAuthenticated && (
                <Alert
                  type="info"
                  title="Login Required"
                  message="Please log in to select and reserve seats"
                  closeable={false}
                  className="mb-4"
                />
              )}

              {reservation && (
                <Alert
                  type="success"
                  title="Seats Reserved"
                  message="Your seats are held. Complete booking before the timer runs out."
                  closeable={false}
                  className="mb-4"
                />
              )}

              <SeatGrid
                seats={event.seats || []}
                selectedSeats={selectedSeatNumbers}
                onSeatSelect={!reservation ? handleSeatSelect : undefined}
              />
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          {!isMobile && (
            <div>
              <BookingSummary
                selectedSeats={selectedSeatNumbers}
                onReserve={handleReserve}
                onConfirm={handleConfirmBooking}
                isLoading={isActionLoading}
                eventName={event.name}
                showConfirm={!!reservation}
                reservationId={reservation?.id}
              />

              {/* Countdown Timer */}
              {reservation && (
                <div className="mt-6">
                  <CountdownTimer
                    expiryTime={reservation.expiresAt}
                    onExpire={handleReservationExpire}
                    showWarning
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Booking Summary */}
        {isMobile && (
          <>
            {reservation && (
              <div className="mt-6">
                <CountdownTimer
                  expiryTime={reservation.expiresAt}
                  onExpire={handleReservationExpire}
                  showWarning
                />
              </div>
            )}
            <div className="mt-24">
              <BookingSummary
                selectedSeats={selectedSeatNumbers}
                onReserve={handleReserve}
                onConfirm={handleConfirmBooking}
                isLoading={isActionLoading}
                eventName={event.name}
                isMobile={true}
                showConfirm={!!reservation}
                reservationId={reservation?.id}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetail;

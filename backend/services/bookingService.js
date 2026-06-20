const ReservationRepository = require('../repositories/reservationRepository');
const SeatRepository = require('../repositories/seatRepository');
const BookingRepository = require('../repositories/bookingRepository');
const EventRepository = require('../repositories/eventRepository');
const ApiError = require('../utils/ApiError');

const reservationRepository = new ReservationRepository();
const seatRepository        = new SeatRepository();
const bookingRepository     = new BookingRepository();
const eventRepository       = new EventRepository();

const toBookingDto = (booking) => ({
  id:             booking._id,
  bookingId:      booking._id,
  bookingReference: booking.booking_reference,
  userId:         booking.user_id,
  eventId:        booking.event_id?._id || booking.event_id,
  event: booking.event_id && typeof booking.event_id === 'object'
    ? {
        id:    booking.event_id._id,
        name:  booking.event_id.name,
        venue: booking.event_id.venue,
        date:  booking.event_id.event_date,
      }
    : null,
  eventName:    booking.event_id?.name,
  venueName:    booking.event_id?.venue,
  eventDate:    booking.event_id?.event_date,
  reservationId: booking.reservation_id?._id || booking.reservation_id,
  seatNumbers:  booking.seat_numbers || [],
  seatIds:      booking.seat_ids || [],
  numberOfSeats: booking.seat_numbers?.length || 0,
  bookingTime:  booking.booking_time,
  status:       booking.status,
  paymentStatus: booking.payment_status,
});

class BookingService {
  /**
   * Confirm booking without MongoDB transactions.
   *
   * Double-booking is prevented by:
   *   1. markCompletedIfActive  — atomic findOneAndUpdate on the reservation
   *      (only succeeds if status='active' AND expires_at > now AND user matches)
   *   2. bookReservedSeats      — atomic updateMany on seats
   *      (only marks 'booked' if status='reserved' AND reserved_by=userId AND not expired)
   *
   * If step 2 fails after step 1 succeeded, we roll both back manually
   * (compensating transaction pattern). This is safe because the booking
   * doc hasn't been exposed to the user yet at that point.
   *
   * Works on standalone MongoDB — no replica set required.
   */
  async confirmBooking(userId, { reservationId }) {
    if (!userId)        throw new ApiError(400, 'User ID is required');
    if (!reservationId) throw new ApiError(400, 'Reservation ID is required');

    // ── 1. Load & validate reservation ──────────────────────────────────────
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    if (reservation.user_id.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to confirm this reservation');
    }
    if (reservation.status === 'expired')   throw new ApiError(410, 'Reservation has expired');
    if (reservation.status === 'completed') throw new ApiError(409, 'Reservation has already been completed');
    if (reservation.status === 'cancelled') throw new ApiError(400, 'Reservation has been cancelled');
    if (reservation.status !== 'active')    throw new ApiError(400, 'Reservation is not active');
    if (new Date() > new Date(reservation.expires_at)) {
      throw new ApiError(410, 'Reservation has expired');
    }

    // ── 2. Load event ────────────────────────────────────────────────────────
    const event = await eventRepository.findById(reservation.event_id);
    if (!event) throw new ApiError(404, 'Event not found');

    // ── 3. Verify seats are still reserved by this user ──────────────────────
    const seats = await seatRepository.findByEventAndSeatNumbers(
      reservation.event_id,
      reservation.seat_numbers
    );

    if (seats.length !== reservation.seat_numbers.length) {
      throw new ApiError(409, 'Some seats could not be found');
    }

    const invalidSeats = seats.filter(
      (seat) =>
        seat.status !== 'reserved' ||
        !seat.reserved_by ||
        seat.reserved_by.toString() !== userId.toString() ||
        !seat.reservation_expiry ||
        seat.reservation_expiry <= new Date()
    );

    if (invalidSeats.length > 0) {
      const nums = invalidSeats.map((s) => s.seat_number);
      throw new ApiError(409, `Seats no longer available: ${nums.join(', ')}`);
    }

    const seatIds = seats.map((s) => s._id);

    // ── 4. ATOMIC: mark reservation completed ────────────────────────────────
    //   Only succeeds if status='active' AND expires_at > now AND user matches.
    //   A concurrent request that also reaches this point will get null back.
    const completedReservation = await reservationRepository.markCompletedIfActive(
      reservationId,
      userId
    );

    if (!completedReservation) {
      throw new ApiError(410, 'Reservation expired or was already completed by another request');
    }

    // ── 5. Create booking document ───────────────────────────────────────────
    let booking;
    try {
      booking = await bookingRepository.createBooking({
        user_id:        userId,
        event_id:       reservation.event_id,
        reservation_id: reservation._id,
        seat_numbers:   reservation.seat_numbers,
        seat_ids:       seatIds,
        booking_time:   new Date(),
        total_amount:   0,
        price_per_seat: 0,
        status:         'confirmed',
        payment_status: 'completed',
      });
    } catch (err) {
      // Roll back reservation status so the user can retry
      await reservationRepository.markActive(reservationId);
      throw new ApiError(500, 'Failed to create booking. Please try again.');
    }

    // ── 6. ATOMIC: mark seats as booked ──────────────────────────────────────
    //   Only updates seats that are still reserved by this user and not expired.
    const bookResult = await seatRepository.bookReservedSeats(
      seatIds,
      userId,
      booking._id
    );

    if (bookResult.modifiedCount !== seatIds.length) {
      // Partial failure — roll back both booking and reservation
      await bookingRepository.updateStatus(booking._id, 'cancelled');
      await reservationRepository.markActive(reservationId);
      throw new ApiError(
        409,
        'Some seats became unavailable during booking. Please try again.'
      );
    }

    // ── 7. Link booking ID onto the completed reservation ────────────────────
    await reservationRepository.update(reservationId, { booking_id: booking._id });

    return {
      bookingId:        booking._id,
      bookingReference: booking.booking_reference,
      seatNumbers:      booking.seat_numbers,
      seatCount:        booking.seat_numbers.length,
      numberOfSeats:    booking.seat_numbers.length,
      bookingTime:      booking.booking_time,
      event: {
        id:    event._id,
        name:  event.name,
        venue: event.venue,
        date:  event.event_date,
      },
      message: 'Booking confirmed successfully',
    };
  }

  async getUserBookings(userId, options = {}) {
    if (!userId) throw new ApiError(400, 'User ID is required');
    const { limit = 20, skip = 0, status } = options;
    const bookings = await bookingRepository.findByUserId(userId, { limit, skip, status });
    return bookings.map(toBookingDto);
  }

  async getBookingById(bookingId, userId) {
    if (!bookingId) throw new ApiError(400, 'Booking ID is required');
    const booking = await bookingRepository.findById(bookingId);
    if (!booking)   throw new ApiError(404, 'Booking not found');
    if (booking.user_id.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to view this booking');
    }
    return toBookingDto(booking);
  }

  async cancelBooking(userId, bookingId) {
    if (!userId)    throw new ApiError(400, 'User ID is required');
    if (!bookingId) throw new ApiError(400, 'Booking ID is required');

    const booking = await bookingRepository.findById(bookingId);
    if (!booking)   throw new ApiError(404, 'Booking not found');

    if (booking.user_id.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to cancel this booking');
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(400, 'Cannot cancel a booking that is not confirmed');
    }

    const event = await eventRepository.findById(booking.event_id);
    if (event && new Date(event.event_date) < new Date()) {
      throw new ApiError(400, 'Cannot cancel bookings for past events');
    }

    const cancelled = await bookingRepository.cancel(bookingId, userId);
    if (!cancelled) throw new ApiError(400, 'Failed to cancel booking');

    if (booking.seat_ids?.length > 0) {
      await seatRepository.releaseSeats(booking.seat_ids);
    }

    return { message: 'Booking cancelled successfully', bookingId: cancelled._id };
  }

  async getUserBookingStats(userId) {
    if (!userId) throw new ApiError(400, 'User ID is required');
    const bookings = await bookingRepository.findByUserId(userId);
    const stats = { total: bookings.length, confirmed: 0, cancelled: 0, totalSeats: 0 };
    bookings.forEach((b) => {
      if (stats[b.status] !== undefined) stats[b.status]++;
      stats.totalSeats += b.seat_numbers?.length || 0;
    });
    return stats;
  }
}

module.exports = new BookingService();

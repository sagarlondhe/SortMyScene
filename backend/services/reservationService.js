const EventRepository = require('../repositories/eventRepository');
const SeatRepository = require('../repositories/seatRepository');
const ReservationRepository = require('../repositories/reservationRepository');
const ApiError = require('../utils/ApiError');

const eventRepository = new EventRepository();
const seatRepository = new SeatRepository();
const reservationRepository = new ReservationRepository();

const RESERVATION_MINUTES = parseInt(process.env.RESERVATION_DURATION_MINUTES, 10) || 10;
const MAX_SEATS_PER_RESERVATION = 20;

class ReservationService {
  /**
   * Reserve seats without MongoDB transactions.
   *
   * Double-booking is prevented by a single atomic updateMany that matches
   * ONLY seats whose status is 'available' (or reserved-but-expired).
   * The modifiedCount is the authoritative guard — if it doesn't equal the
   * number of requested seats, another request won the race and we reject.
   *
   * This approach works on standalone MongoDB (no replica set required).
   */
  async reserveSeats(userId, { eventId, seatNumbers }) {
    if (!userId)    throw new ApiError(400, 'User ID is required');
    if (!eventId)   throw new ApiError(400, 'Event ID is required');
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throw new ApiError(400, 'Seat numbers array is required');
    }

    // Normalise & deduplicate
    const uniqueSeatNumbers = [
      ...new Set(seatNumbers.map((s) => s.trim().toUpperCase())),
    ];

    const invalidSeats = uniqueSeatNumbers.filter(
      (s) => !/^[A-Z]{1,2}\d{1,3}$/.test(s)
    );
    if (invalidSeats.length > 0) {
      throw new ApiError(400, `Invalid seat numbers: ${invalidSeats.join(', ')}`);
    }

    if (uniqueSeatNumbers.length > MAX_SEATS_PER_RESERVATION) {
      throw new ApiError(
        400,
        `Cannot reserve more than ${MAX_SEATS_PER_RESERVATION} seats at once`
      );
    }

    // ── 1. Validate event ────────────────────────────────────────────────────
    const event = await eventRepository.findById(eventId);
    if (!event)          throw new ApiError(404, 'Event not found');
    if (!event.is_active) throw new ApiError(400, 'Event is not active for booking');
    if (new Date(event.event_date) < new Date()) {
      throw new ApiError(400, 'Cannot reserve seats for past events');
    }

    // ── 2. Verify all requested seat numbers exist for this event ────────────
    const seats = await seatRepository.findByEventAndSeatNumbers(
      eventId,
      uniqueSeatNumbers
    );

    if (seats.length !== uniqueSeatNumbers.length) {
      const found   = seats.map((s) => s.seat_number);
      const missing = uniqueSeatNumbers.filter((s) => !found.includes(s));
      throw new ApiError(404, `Seats not found: ${missing.join(', ')}`);
    }

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    // ── 3. ATOMIC reserve — only matches truly available seats ───────────────
    //   updateMany with a conditional filter is a single atomic write in MongoDB.
    //   If another request reserved a seat between step 2 and here, its
    //   reservation_expiry will be in the future, so the $or condition won't
    //   match it and modifiedCount will be < requested — caught below.
    const reserveResult = await seatRepository.reserveSeatsForReservation(
      eventId,
      uniqueSeatNumbers,
      userId,
      expiresAt
    );

    if (reserveResult.modifiedCount !== uniqueSeatNumbers.length) {
      // Some seats were taken — roll back the ones we did reserve
      await seatRepository.releaseSeatsForUser(
        eventId,
        uniqueSeatNumbers,
        userId
      );
      throw new ApiError(
        409,
        'One or more seats are no longer available. Please refresh and try again.'
      );
    }

    // ── 4. Fetch the seat IDs we just reserved (needed for reservation doc) ──
    const reservedSeats = await seatRepository.findByEventAndSeatNumbers(
      eventId,
      uniqueSeatNumbers
    );
    const seatIds = reservedSeats.map((s) => s._id);

    // ── 5. Create reservation document ──────────────────────────────────────
    let reservation;
    try {
      reservation = await reservationRepository.create({
        user_id:      userId,
        event_id:     eventId,
        seat_numbers: uniqueSeatNumbers,
        seat_ids:     seatIds,
        expires_at:   expiresAt,
        status:       'active',
      });
    } catch (err) {
      // Reservation doc failed — roll back seat state
      await seatRepository.releaseSeatsForUser(eventId, uniqueSeatNumbers, userId);
      throw new ApiError(500, 'Failed to create reservation. Seats have been released.');
    }

    return {
      reservationId: reservation._id,
      expiresAt:     reservation.expires_at,
      seatNumbers:   reservation.seat_numbers,
      seatCount:     reservation.seat_numbers.length,
      message:       'Seats reserved successfully',
    };
  }

  // ── Supporting methods (no transactions needed) ───────────────────────────

  async getUserActiveReservations(userId) {
    if (!userId) throw new ApiError(400, 'User ID is required');
    const reservations = await reservationRepository.findActiveByUserId(userId);
    const now = new Date();
    return reservations.filter((r) => new Date(r.expires_at) > now);
  }

  async cancelReservation(userId, reservationId) {
    if (!userId)        throw new ApiError(400, 'User ID is required');
    if (!reservationId) throw new ApiError(400, 'Reservation ID is required');

    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation)   throw new ApiError(404, 'Reservation not found');

    if (reservation.user_id.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to cancel this reservation');
    }
    if (reservation.status !== 'active') {
      throw new ApiError(400, 'Cannot cancel a reservation that is not active');
    }
    if (new Date(reservation.expires_at) < new Date()) {
      throw new ApiError(410, 'Reservation has already expired');
    }

    const cancelled = await reservationRepository.cancel(reservationId, userId);
    if (!cancelled) throw new ApiError(400, 'Failed to cancel reservation');

    if (reservation.seat_ids?.length > 0) {
      await seatRepository.releaseSeats(reservation.seat_ids);
    }

    return { message: 'Reservation cancelled successfully', reservationId: cancelled._id };
  }

  async extendReservation(userId, reservationId) {
    if (!userId)        throw new ApiError(400, 'User ID is required');
    if (!reservationId) throw new ApiError(400, 'Reservation ID is required');

    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation)   throw new ApiError(404, 'Reservation not found');

    if (reservation.user_id.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to extend this reservation');
    }
    if (reservation.status !== 'active') {
      throw new ApiError(400, 'Cannot extend a reservation that is not active');
    }
    if (new Date(reservation.expires_at) < new Date()) {
      throw new ApiError(410, 'Reservation has already expired');
    }

    const newExpiry = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
    const updated   = await reservationRepository.update(reservationId, { expires_at: newExpiry });

    if (reservation.seat_ids?.length > 0) {
      await seatRepository.extendSeatsExpiry(reservation.seat_ids, newExpiry);
    }

    return {
      message:        'Reservation extended successfully',
      reservationId:  updated._id,
      newExpiresAt:   newExpiry,
    };
  }
}

module.exports = new ReservationService();

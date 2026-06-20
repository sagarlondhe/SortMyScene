const SeatRepository        = require('../repositories/seatRepository');
const ReservationRepository = require('../repositories/reservationRepository');
const ApiError = require('../utils/ApiError');

const seatRepository        = new SeatRepository();
const reservationRepository = new ReservationRepository();

class ExpirationService {
  /**
   * Expire reservations and release their seats.
   * Runs as a cron job every minute.
   *
   * No transaction needed — both updateMany calls are idempotent.
   * If one succeeds and the server crashes before the other, the cron
   * will find the remaining work on the next tick and finish it.
   * Works on standalone MongoDB.
   */
  async expireReservations() {
    const now = new Date();

    const expiredReservations = await reservationRepository.findExpiredActive(now);
    if (expiredReservations.length === 0) {
      return { expiredCount: 0, releasedSeats: 0, timestamp: now };
    }

    const reservationIds = expiredReservations.map((r) => r._id);
    const seatIds        = expiredReservations.flatMap((r) => r.seat_ids || []);

    // Release seats first — if we crash here, the cron re-runs and the
    // reservation is still 'active' with expires_at in the past, so it
    // gets picked up again next minute.
    const seatResult = await seatRepository.releaseExpiredSeatsByIds(seatIds, now);

    // Mark reservations expired
    const reservationResult = await reservationRepository.expireReservations(reservationIds);

    const releasedSeats = seatResult.modifiedCount;
    const expiredCount  = reservationResult.modifiedCount;

    if (expiredCount > 0) {
      console.log(
        `[ExpirationService] Expired ${expiredCount} reservation(s), released ${releasedSeats} seat(s)`
      );
    }

    return { expiredCount, releasedSeats, timestamp: now };
  }

  async getExpirationStats() {
    const now = new Date();
    const expiredReservations = await reservationRepository.findExpiredActive(now);
    return {
      pendingExpiration: expiredReservations.length,
      seatsToRelease:    expiredReservations.flatMap((r) => r.seat_ids || []).length,
      timestamp:         now,
    };
  }
}

module.exports = new ExpirationService();

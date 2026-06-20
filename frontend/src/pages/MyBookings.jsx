import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { Alert, GridSkeleton, EmptyState, Badge, Modal } from '../components/common';
import {
  Ticket, CheckCircle, Calendar, MapPin, Users,
  Download, Share2, QrCode, X, Copy, Check,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'N/A';

const formatBookingTime = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'N/A';

const statusVariant = (s) => {
  switch (s?.toLowerCase()) {
    case 'confirmed': return 'success';
    case 'cancelled':
    case 'expired':   return 'error';
    default:          return 'warning';
  }
};

// ─── Ticket Modal ────────────────────────────────────────────────────────────

const TicketModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const seats = booking.seatNumbers?.join(', ') || 'N/A';
  const ref   = booking.bookingReference || '—';

  return (
    <Modal isOpen={!!booking} onClose={onClose} size="md">
      {/* Ticket card */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg -m-2">

        {/* Header strip */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Ticket className="w-5 h-5 opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
              E-Ticket
            </span>
          </div>
          <h2 className="text-xl font-bold leading-tight">
            {booking.eventName || 'Event'}
          </h2>
          <p className="text-primary-200 text-sm mt-0.5">
            {booking.venueName || ''}
          </p>
        </div>

        {/* Dotted tear-line */}
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 border border-gray-200" />
          <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
          <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 border border-gray-200" />
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Date</p>
            <p className="font-semibold text-gray-900">{formatDate(booking.eventDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Seats</p>
            <p className="font-semibold text-gray-900 font-mono">{seats}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Booked On</p>
            <p className="font-semibold text-gray-900">{formatBookingTime(booking.bookingTime)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
              booking.status === 'confirmed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {booking.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tear-line */}
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 border border-gray-200" />
          <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
          <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 border border-gray-200" />
        </div>

        {/* QR + reference */}
        <div className="px-6 py-5 flex flex-col items-center gap-3">
          {/* QR Code rendered with inline SVG pattern (no external lib needed) */}
          <QRCodeBox value={ref} />
          <p className="text-xs text-gray-500 text-center">
            Booking Reference
          </p>
          <p className="font-mono font-bold text-primary-700 text-sm tracking-widest">
            {ref}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// ─── Minimal QR code visual (grid pattern keyed on the reference string) ────
// Uses a simple checksum-based pattern — gives each booking a unique look
// without needing a QR library. For a real scannable QR, add `qrcode.react`.
const QRCodeBox = ({ value }) => {
  const SIZE  = 9;  // grid squares
  const CELL  = 20; // px per cell
  const total = SIZE * SIZE;

  // Deterministic "hash" so same ref always renders same pattern
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  const cells = Array.from({ length: total }, (_, i) => {
    // Always fill the 3 finder-pattern corners (top-left, top-right, bottom-left)
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const inCorner =
      (r < 3 && c < 3) ||
      (r < 3 && c >= SIZE - 3) ||
      (r >= SIZE - 3 && c < 3);
    if (inCorner) return true;
    return Boolean((hash >> (i % 32)) & 1);
  });

  return (
    <div
      className="border-2 border-gray-800 p-1.5 rounded"
      style={{ display: 'inline-block', background: '#fff' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`,
          gap: 1,
        }}
      >
        {cells.map((filled, i) => (
          <div
            key={i}
            style={{
              width: CELL,
              height: CELL,
              background: filled ? '#1e293b' : '#fff',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Download helper — opens a styled print page ────────────────────────────
const downloadTicket = (booking) => {
  const seats = booking.seatNumbers?.join(', ') || 'N/A';
  const html  = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Ticket — ${booking.eventName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f1f5f9;
           display: flex; justify-content: center; padding: 40px 16px; }
    .ticket { width: 420px; background: #fff; border-radius: 16px;
              overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,.12); }
    .header { background: linear-gradient(135deg,#0284c7,#0369a1);
              color:#fff; padding: 24px; }
    .header h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
    .header p  { font-size:13px; opacity:.75; }
    .tear { border-top: 2px dashed #e2e8f0; margin: 0 16px; }
    .body { padding: 20px 24px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .field label { font-size:10px; text-transform:uppercase; letter-spacing:.08em;
                   color:#94a3b8; font-weight:600; }
    .field p { font-size:14px; font-weight:600; color:#1e293b; margin-top:2px; }
    .footer { padding: 20px 24px; text-align:center; border-top:1px solid #f1f5f9; }
    .ref { font-family:monospace; font-size:15px; font-weight:700;
           color:#0284c7; letter-spacing:.1em; margin-top:6px; }
    .badge { display:inline-block; background:#dcfce7; color:#166534;
             padding:2px 10px; border-radius:9999px; font-size:11px; font-weight:700; }
    @media print {
      body { background:#fff; padding:0; }
      .ticket { box-shadow:none; width:100%; max-width:420px; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <p style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">
        E-Ticket · SortMyScene
      </p>
      <h1>${booking.eventName || 'Event'}</h1>
      <p>${booking.venueName || ''}</p>
    </div>
    <div class="tear"></div>
    <div class="body">
      <div class="field"><label>Date</label><p>${formatDate(booking.eventDate)}</p></div>
      <div class="field"><label>Seats</label><p style="font-family:monospace">${seats}</p></div>
      <div class="field"><label>Booked On</label><p>${formatBookingTime(booking.bookingTime)}</p></div>
      <div class="field"><label>Status</label><p><span class="badge">${(booking.status || '').toUpperCase()}</span></p></div>
    </div>
    <div class="tear"></div>
    <div class="footer">
      <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">Booking Reference</p>
      <p class="ref">${booking.bookingReference || '—'}</p>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) {
    win.addEventListener('afterprint', () => URL.revokeObjectURL(url));
  }
};

// ─── Share helper ────────────────────────────────────────────────────────────
const shareTicket = async (booking, setCopied) => {
  const seats = booking.seatNumbers?.join(', ') || 'N/A';
  const text  =
    `🎟️ ${booking.eventName}\n` +
    `📍 ${booking.venueName || ''}\n` +
    `📅 ${formatDate(booking.eventDate)}\n` +
    `💺 Seats: ${seats}\n` +
    `🔖 Ref: ${booking.bookingReference}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: booking.eventName, text });
    } catch { /* user cancelled */ }
    return;
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    setCopied(booking.id);
    setTimeout(() => setCopied(null), 2500);
  } catch {
    alert('Could not copy to clipboard. Please copy the reference manually:\n' + booking.bookingReference);
  }
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const MyBookings = () => {
  const location = useLocation();

  const [bookings,       setBookings]       = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ticketBooking,  setTicketBooking]  = useState(null); // booking shown in modal
  const [copiedId,       setCopiedId]       = useState(null); // share clipboard feedback

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('confirmed')) {
      setSuccessMessage('Your booking has been confirmed!');
    }
  }, [location]);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data } = await bookingAPI.getMyBookings();
      setBookings(data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="page-title">My Bookings</h1>
          <p className="subtitle text-gray-600">View and manage all your event bookings</p>
        </div>

        {successMessage && (
          <Alert type="success" title="Booking Confirmed!"
            message={successMessage} onClose={() => setSuccessMessage('')} className="mb-6" />
        )}
        {error && (
          <Alert type="error" title="Error"
            message={error} onClose={() => setError('')} className="mb-6" />
        )}

        {/* Loading */}
        {isLoading && (
          <div>
            <p className="text-gray-500 mb-4">Loading your bookings…</p>
            <GridSkeleton count={3} />
          </div>
        )}

        {/* Booking cards */}
        {!isLoading && bookings.length > 0 && (
          <div className="grid gap-5">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-card hover:shadow-card-lg
                           transition-shadow overflow-hidden border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row">

                  {/* ── Left: booking info ─────────────────────────────── */}
                  <div className="flex-1 p-6">
                    {/* Title + badge */}
                    <div className="flex flex-wrap items-start gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.eventName || 'Event'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant={statusVariant(booking.status)}>
                            {booking.status || 'active'}
                          </Badge>
                          {booking.bookingReference && (
                            <span className="text-xs font-mono text-gray-400 bg-gray-50
                                             border border-gray-200 px-2 py-0.5 rounded">
                              Ref: {booking.bookingReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4-column detail grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500 text-xs">Venue</p>
                          <p className="font-medium text-gray-900 leading-snug">
                            {booking.venueName || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500 text-xs">Event Date</p>
                          <p className="font-medium text-gray-900 leading-snug">
                            {formatDate(booking.eventDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500 text-xs">Seats</p>
                          <p className="font-medium text-gray-900 font-mono leading-snug">
                            {booking.seatNumbers?.join(', ') || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Ticket className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500 text-xs">Booked On</p>
                          <p className="font-medium text-gray-900 leading-snug">
                            {formatBookingTime(booking.bookingTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Right: action buttons ──────────────────────────── */}
                  <div className="sm:w-44 flex sm:flex-col gap-2 p-4 sm:p-5
                                  border-t sm:border-t-0 sm:border-l border-gray-100
                                  bg-gray-50 justify-center">

                    {/* View Ticket */}
                    <button
                      onClick={() => setTicketBooking(booking)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2
                                 px-3 py-2.5 bg-primary-600 hover:bg-primary-700
                                 text-white text-sm font-semibold rounded-lg
                                 transition-colors shadow-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View Ticket</span>
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => downloadTicket(booking)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2
                                 px-3 py-2.5 bg-white hover:bg-gray-100
                                 text-gray-700 text-sm font-semibold rounded-lg
                                 transition-colors border border-gray-200 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => shareTicket(booking, setCopiedId)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2
                                 px-3 py-2.5 bg-white hover:bg-gray-100
                                 text-gray-700 text-sm font-semibold rounded-lg
                                 transition-colors border border-gray-200 shadow-sm"
                    >
                      {copiedId === booking.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && bookings.length === 0 && (
          <EmptyState
            icon={Ticket}
            title="No Bookings Yet"
            description="You haven't booked any tickets yet. Browse events and reserve your seats!"
            action={
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5
                           bg-primary-600 text-white rounded-lg hover:bg-primary-700
                           transition-colors font-medium"
              >
                Browse Events →
              </Link>
            }
          />
        )}
      </div>

      {/* Ticket modal */}
      <TicketModal
        booking={ticketBooking}
        onClose={() => setTicketBooking(null)}
      />
    </div>
  );
};

export default MyBookings;

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Calendar, MapPin, Users, Ticket, ChevronRight } from 'lucide-react';

/**
 * EventCard Component - Displays event information in card format
 */
const EventCard = ({ event, onViewSeats }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const availableSeats = event.totalSeats - (event.bookedSeats || 0) - (event.reservedSeats || 0);
  const occupancyPercent = ((event.bookedSeats || 0) / event.totalSeats) * 100;

  const isLowAvailability = availableSeats < 5;
  const isSoldOut = availableSeats === 0;

  return (
    <Link to={`/events/${event.id}`} className="group">
      <div className="card overflow-hidden flex flex-col h-full hover:shadow-card-lg transition-all duration-300 transform hover:-translate-y-1">
        {/* Image Placeholder */}
        <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 aspect-video overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-400">
              <Ticket className="w-16 h-16 opacity-20" />
            </div>
          )}

          {/* Badge */}
          <div className="absolute top-3 right-3">
            {isSoldOut ? (
              <Badge variant="error">Sold Out</Badge>
            ) : isLowAvailability ? (
              <Badge variant="warning">Limited Seats</Badge>
            ) : (
              <Badge variant="success">{availableSeats} Available</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="card-title mb-2 mt-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {event.name}
          </h3>

          {/* Venue and Date */}
          <div className="space-y-2 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span className="text-truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>{availableSeats}/{event.totalSeats} seats available</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  occupancyPercent > 80
                    ? 'bg-error-500'
                    : occupancyPercent > 50
                      ? 'bg-warning-500'
                      : 'bg-success-500'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {occupancyPercent.toFixed(0)}% occupied
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              onViewSeats?.(event.id);
            }}
            variant={isSoldOut ? 'secondary' : 'primary'}
            size="sm"
            className="w-full mt-auto"
            disabled={isSoldOut}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            {isSoldOut ? 'Sold Out' : 'View Seats'}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;

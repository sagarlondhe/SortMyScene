import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { EventCard } from '../components/features';
import { Alert, GridSkeleton, EmptyState } from '../components/common';
import { Calendar, AlertCircle } from 'lucide-react';

/**
 * EventList Page - Display all upcoming events
 */
const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, ending-soon

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data } = await eventsAPI.getAll();
      setEvents(data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSeats = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (filter === 'available') {
      const available = event.totalSeats - (event.bookedSeats || 0) - (event.reservedSeats || 0);
      return available > 0;
    }
    if (filter === 'ending-soon') {
      const eventDate = new Date(event.date);
      const now = new Date();
      const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);
      return daysUntilEvent <= 7 && daysUntilEvent >= 0;
    }
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Hero Section */}
        <div className="section">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="page-title">Upcoming Events</h1>
              <p className="subtitle text-gray-600">
                Discover and book tickets to amazing events
              </p>
            </div>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              type="error"
              title="Failed to Load Events"
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All Events' },
              { value: 'available', label: 'Available Only' },
              { value: 'ending-soon', label: 'Ending Soon' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`
                  px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors
                  ${
                    filter === tab.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div>
              <p className="text-gray-600 mb-4">Loading events...</p>
              <GridSkeleton count={6} />
            </div>
          )}

          {/* Events Grid */}
          {!isLoading && filteredEvents.length > 0 && (
            <div className="grid-auto-fit">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewSeats={handleViewSeats}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredEvents.length === 0 && (
            <EmptyState
              icon={Calendar}
              title={
                filter === 'all'
                  ? 'No Events Available'
                  : filter === 'available'
                    ? 'No Available Events'
                    : 'No Events Ending Soon'
              }
              description={
                filter === 'all'
                  ? 'Check back soon for upcoming events'
                  : filter === 'available'
                    ? 'All events are sold out or reserved. Try other filters.'
                    : 'No events are ending within the next 7 days'
              }
              action={
                filter !== 'all' ? (
                  <button
                    onClick={() => setFilter('all')}
                    className="text-primary-600 hover:text-primary-700 font-semibold underline"
                  >
                    View all events →
                  </button>
                ) : null
              }
            />
          )}
        </div>

        {/* Info Banner */}
        {filteredEvents.length > 0 && (
          <div className="mt-12 p-6 bg-primary-50 border border-primary-200 rounded-lg flex gap-4">
            <AlertCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-1">How it Works</h3>
              <ol className="text-sm text-primary-800 space-y-1">
                <li>1. Select an event and click "View Seats"</li>
                <li>2. Choose your seats on the interactive seat map</li>
                <li>3. Reserve your seats (held for 10 minutes)</li>
                <li>4. Complete your booking</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;

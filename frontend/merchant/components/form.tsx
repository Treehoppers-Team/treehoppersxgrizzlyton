import React, { useState } from 'react';

const EventForm = () => {
    const [eventName, setEventName] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [venue, setVenue] = useState('');
    const [capacity, setCapacity] = useState('');
    const [symbol, setSymbol] = useState<File | null>(null);
  
    return (
      <form className="bg-gray-100 p-6 rounded-lg shadow-md w-1/3 sm:w-1/2 m-auto">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="event-name">Event Name</label>
          <input
            className="border border-gray-400 p-2 w-full rounded-md"
            id="event-name"
            type="text"
            placeholder="Enter the event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="date-time">Date/Time</label>
          <input
            className="border border-gray-400 p-2 w-full rounded-md"
            id="date-time"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="venue">Venue (Location)</label>
          <input
            className="border border-gray-400 p-2 w-full rounded-md"
            id="venue"
            type="text"
            placeholder="Enter the venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="capacity">Capacity</label>
          <input
            className="border border-gray-400 p-2 w-full rounded-md"
            id="capacity"
            type="number"
            placeholder="Enter the capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="symbol">Symbol</label>
          <input
            className="border border-gray-400 p-2 w-full rounded-md"
            id="symbol"
            type="file"
            value={symbol?.name}
            onChange={(e) => setSymbol(e.target.files?.[0] || null)}
          />
        </div>
      </form>
  )
}

export default EventForm;
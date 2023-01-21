import React, { useState } from "react";
import { database } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

interface EventFormProps {
    eventName2: string;
    description2: string;
    price2: string;
    dateTime2: string;
    venue2: string;
    capacity2: string;

}

const EventForm = ({eventName2,description2,price2,dateTime2,venue2,capacity2}:EventFormProps) => {
  const [eventName, setEventName] = useState(eventName2);
  const [description, setDescription] = useState(description2);
  const [price, setPrice] = useState(price2);
  const [dateTime, setDateTime] = useState(dateTime2);
  const [venue, setVenue] = useState(venue2);
  const [capacity, setCapacity] = useState(capacity2);
  const [symbol, setSymbol] = useState<File | null>(null);

  function handleClick() {
    console.log(eventName, dateTime, venue, capacity, symbol);
    uploadData({ title: eventName, description: description, price: price, time: dateTime, venue: venue, capacity: capacity})
  }

  const uploadData = (data: { title: string; description: string; price: string; time: string; venue: string; capacity: string; } | undefined) => {
    // const dbInstance = collection(database, '/MerchantCollection');
    if (data) {
      const dbInstance = doc(database, "/events", data.title);
      setDoc(dbInstance, data).then(() => {
        window.location.reload()
        console.log("uploaded form data");
      });
    }

  };

  return (
    <form className="bg-gray-100 p-4 rounded-lg shadow-md">
                <img
          className="rounded-t-lg h-48 w-full object-cover object-center"
          src="https://source.unsplash.com/random"
          alt="event image"
        />
      <div className="my-4">
        <h1 className="text-2xl font-bold text-center">{eventName}</h1>
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="event-name"
        >
          Description
        </label>
        <input
          className="border border-gray-400 p-2 w-full rounded-md"
          id="description"
          type="text"
          placeholder="Enter the event description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="event-name"
        >
          Price
        </label>
        <input
          className="border border-gray-400 p-2 w-full rounded-md"
          id="price"
          type="text"
          placeholder="Enter the registration price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="date-time"
        >
          Date/Time
        </label>
        <input
          className="border border-gray-400 p-2 w-full rounded-md"
          id="date-time"
          type="datetime-local"
          value={dateTime}
          onChange={(e) => {setDateTime(e.target.value)
          console.log(e.target.value)}}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2" htmlFor="venue">
          Venue (Location)
        </label>
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
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="capacity"
        >
          Capacity
        </label>
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
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="symbol"
        >
          Symbol
        </label>
        <input
          className="border border-gray-400 p-2 w-full rounded-md"
          id="symbol"
          type="file"
          
          onChange={(e) => setSymbol(e.target.files?.[0] || null)}
        />
      </div>
      <button
      type="button"
        className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        onClick={handleClick}
      >
        Submit
      </button>
    </form>
  );
};

export default EventForm;

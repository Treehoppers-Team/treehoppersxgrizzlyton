import { useState } from "react";
import Form from "./form";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import EditForm from "./editForm";
import { database } from "@/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

interface CardProps {
  title: string;
  description: string;
  price: string;
  time: string;
  venue: string;
  capacity: string;
}

export default function Card({
  title,
  description,
  price,
  time,
  venue,
  capacity,
}: CardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleted, setDeleted] = useState(false);

  function dateFormat(dateString: string | number | Date) {
    let date = new Date(dateString);
    return date.toLocaleString();
  }

  async function handleDelete() {
    await deleteDoc(doc(database, "events", title + time));
    setDeleted(true);
    window.location.reload()
  }

  const imageSrc = `https://firebasestorage.googleapis.com/v0/b/treehoppers-mynt.appspot.com/o/${
    title + time
  }?alt=media&token=07ddd564-df85-49a5-836a-c63f0a4045d6`;

  return (
    <>
      <div
        className={
          deleted
            ? "invisible absolute"
            : "" +
              "w-full bg-gray-100 rounded-lg justify-center ml-4 my-2 mr-2"
        }
      >
        <img
          className="rounded-t-lg h-72 w-full object-cover object-center"
          // src="https://source.unsplash.com/random"
          src={imageSrc}
          alt="event image"
        />
        <div className="p-2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-left">{title}</h2>
          <a className="font-light text-gray-600 tracking-tight">
            {dateFormat(time)}
          </a>

          <h5 className="my-2 tracking-tight text-gray-900">{description}</h5>
          <div className="flex flex-wrap justify-left">
            <a className="flex flex-wrap items-center text-sm my-1 mr-1 p-2 tracking-tight bg-slate-300 rounded-lg text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>

              {capacity}
            </a>
            <a className="flex flex-wrap items-center text-sm my-1 p-2 tracking-tight bg-slate-300 rounded-lg text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              {venue}
            </a>
          </div>
        </div>

        <div className="px-2 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">${price}</span>
            <div className="flex justify-end">
              
              <button
                onClick={onOpen}
                className="mx-1 text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
              <Link
                onClick={handleDelete}
                href="/"
                className="mx-1 text-white bg-red-500 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col justify-center">
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit Event</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <EditForm
                  eventName2={title}
                  description2={description}
                  price2={price}
                  dateTime2={time}
                  venue2={venue}
                  capacity2={capacity}
                />
              </ModalBody>

              <ModalFooter>
                <button
                  className="w-full my-2 mx-auto text-white bg-red-500 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  onClick={onClose}
                >
                  Close
                </button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </div>
    </>
  );
}

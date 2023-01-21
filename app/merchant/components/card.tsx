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

  return (
    <>
      <div className="w-96 max-w-sm bg-gray-100 rounded-lg shadow-md justify-center">
        <img
          className="rounded-t-lg h-48 w-full object-cover object-center"
          src="https://source.unsplash.com/random"
          alt="event image"
        />
        <div className="p-2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-left">{title}</h2>
          <a className="font-light text-gray-600 tracking-tight">{time}</a>

          <h5 className="my-2 tracking-tight text-gray-900">{description}</h5>
          <div className="flex flex-wrap justify-left">
            <a className="text-sm mr-1 p-2 tracking-tight bg-slate-300 rounded-lg text-gray-900">
              Capacity: {capacity}
            </a>
            <a className="text-sm p-2 tracking-tight bg-slate-300 rounded-lg text-gray-900">
              {venue}
            </a>
          </div>
        </div>

        <div className="px-2 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">${price}</span>
            <button
              onClick={onOpen}
              className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Edit
            </button>
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

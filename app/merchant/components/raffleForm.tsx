import React, { useState } from "react";
import { database, storage } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import axios from "axios";

const JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjODA1MzJhMC01YmU2LTQyZTItYmRlNS1hMTkwYWZkMzNkZjkiLCJlbWFpbCI6ImFkdmFpdC5iaGFyYXQuZGVzaHBhbmRlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJhMTkyMTNjOGE4YzM1MGNiMjMwMCIsInNjb3BlZEtleVNlY3JldCI6IjA1YjcwMTY0OWEzMGUxOWY5NDE1MzY2OWE4MDNiYjczZGY4MTU5ODIxM2ZiNzlmM2MyYzk3MGViOWQyMjFlNmUiLCJpYXQiOjE2NzUzNzI0MjF9.mmLYahJJ-etF5u_sRdOyJ2irM7F848vMaJ_Z9rK2G0A"

interface EventFormProps {
  eventName2: string;
  description2: string;
  price2: string;
  dateTime2: string;
  venue2: string;
  capacity2: string;
  users: string[];
  address: string[];
}

const RaffleForm = ({
  eventName2,
  description2,
  price2,
  dateTime2,
  venue2,
  capacity2,
  users,
  address
}: EventFormProps) => {

  const [symbol, setSymbol] = useState("");
  const [image, setImage] = useState<File>();

  function dateFormat(dateString: string | number | Date) {
    let date = new Date(dateString);
    return date.toLocaleString();
  }

  const pinataMetadataUpload = async (data: any) => {
    const res = await fetch('http://localhost:3000/uploadMetadata', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await res.text()
    return result
  }

  const pinataUpload = async (image: any) => {
    const formData: {
      append: (arg0: string, arg1: any) => void;
      _boundary: any;
    } = new FormData() as any;
    formData.append("file", image);

    const metadata = JSON.stringify({
      name: "File name",
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            Authorization: `Bearer ${JWT}`,
          },
        }
      );
      console.log(res.data.IpfsHash);
      return res.data.IpfsHash;
    } catch (error) {
      console.log(error);
    }
  };

  function raffleSelect(users: any, amount: number) {
    const result = [];
    const tempArr = [...users];
    for (let i = 0; i < amount; i++) {
      if (tempArr.length === 0) {
        break;
      }
      const randomIndex = Math.floor(Math.random() * tempArr.length);
      result.push(tempArr[randomIndex]);
      tempArr.splice(randomIndex, 1);
    }
    return result;
  }
  

  async function conductRaffle() {
    const amount = parseInt(capacity2);
    const winners = raffleSelect(users, amount);
    // find users in registration db and set status to success
    // make post request to /insertRegistration and in request body pass in userid and event title
    console.log(winners)
    for (let i = 0; i < winners.length; i++) {
      const data = {
        user_id: winners[i].id,
        event_title: eventName2,
        status: "success",
      };

      axios
        .post("http://localhost:3000/insertRegistration", data)
        .then(() => axios.post("http://localhost:3000/mintNft", data))
        .then((response: { data: any; }) => {
          console.log(response.data);
        })
        .catch((error: any) => {
          console.log(error);
        });
    }
  }

  function handleClick() {
    console.log(eventName2, dateTime2, venue2, capacity2, image);
      // Upload image to /uploadFile endpoint using Pinata
      pinataUpload(image).then(async (hash) => {
        const metadata = {
          title: eventName2,
          symbol: symbol,
          description: description2,
          image: `https://ipfs.io/ipfs/${hash}`,
          attributes: [
            { trait_type: "Date/Time", value: dateFormat(dateTime2) },
            { trait_type: "Ticket Price", value: price2 },
            { trait_type: "Venue", value: venue2 },
          ],
          properties: {
            files: [
              {
                uri: `https://ipfs.io/ipfs/${hash}`,
                type: "image/png",
              },
            ],
            category: null,
          },
        };
        console.log(metadata)
        return metadata
      }).then((data) => {
        pinataMetadataUpload(data).then((res) => {
          
          uploadData(
            {
              merchantKey: address[0],
              symbol: symbol,
              title: eventName2,
              uri: `https://ipfs.io/ipfs/${res}`,
            },
            image!
          );
          conductRaffle();
        })

      })
}
  

  const storageRef = ref(storage, eventName2 + "-nft" + dateTime2);

  const uploadData = (
    data:
      | {
        merchantKey: string;
        symbol: string;
        title: string;
        uri: string;
        }
      | undefined,
    image: File
  ) => {
    // const dbInstance = collection(database, '/MerchantCollection');
    if (data) {
      const title = data.title + "-nft";
      const dbInstance = doc(database, "/nfts", title + dateTime2);
      setDoc(dbInstance, data).then(() => {
        window.location.reload()
        console.log("uploaded form data");
      });

      if (image) {
        uploadBytes(storageRef, image!).then((snapshot) => {
          console.log("Uploaded a blob or file!");
        });
      }
    }
  };

  return (
    <form className="bg-gray-100 p-4 rounded-lg shadow-md">
      <div className="my-4">
        <h1 className="text-2xl font-bold text-center">{eventName2}</h1>
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
          id="description"
          type="text"
          placeholder="Enter the NFT Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2" htmlFor="image">
          Image
        </label>
        <input
          className="border border-gray-400 p-2 w-full rounded-md"
          id="image"
          type="file"
          onChange={(e) => setImage(e.target.files?.[0])}
        />
      </div>
      <button
        type="button"
        className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        onClick={handleClick}
      >
        Conduct Raffle
      </button>
    </form>
  );
};

export default RaffleForm;

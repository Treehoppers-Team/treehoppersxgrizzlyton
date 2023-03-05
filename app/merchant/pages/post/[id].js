import { useRouter } from "next/router";
import Event from "../../components/event";
import User from "../../components/user";
import EventStats from "../../components/eventStats";
import { useEffect, useState } from "react";
import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";
import QrReader from "react-qr-scanner";
import axios from "axios";
import Table from "../../components/dataTable";

// const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TEST_TOKEN
const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT;
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const Content = () => {
  const router = useRouter();
  const [event, setEvent] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({
    name: "",
    userId: "",
    eventTitle: "",
    status: "",
    chat_id: "",
  });
  const [scan, setScan] = useState(false);
  const attendees = users.filter((user) => {
    return user.status.toLowerCase() === "successful";
  });

  const openScanner = () => {
    if (scan) {
      setScan(false);
    } else {
      setScan(true);
    }
  };

  const downloadCSV = () => {
    const csvRows = [];
    
    // Create the headers for the CSV file
    const headers = ['name', 'handle', 'contact', 'status']
    csvRows.push(headers.join(','));
    
    // Create a row for each user
    for (const user of users) {
      const values = headers.map(header => user[header]);
      csvRows.push(values.join(','));
    }
    
    // Combine all rows into a single string
    const csvData = csvRows.join('\n');
    
    // Create a link to download the CSV file
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData));
    link.setAttribute('download', 'users.csv');
    document.body.appendChild(link);
    
    // Click the link to download the CSV file
    link.click();
    
    // Remove the link from the DOM
    document.body.removeChild(link);
  };
  

  const handleScan = (data) => {
    console.log("scanning");
    if (data) {
      console.log(data);
      const parsedData = JSON.parse(data.text);

      // check if parsedData user id is inside the attendees userid
      const user = attendees.find((user) => {
        return user.id === parsedData.userId;
      });

      if (parsedData.eventTitle === event.title && user) {
        alert("Verified!");
        const text = "You have been successfully verified! Please enter the event venue :)"
        const chat_id = parsedData.chatId;
        console.log(chat_id);
        const telegramPush = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${chat_id}&text=${text}`;
        fetch(telegramPush).then((res) => {
          console.log(res);
        });
        const currentTime = new Date();
        const redemptionTime = currentTime.toISOString();
        const data = {
          user_id: parsedData.userId,
          event_title: parsedData.eventTitle,
          status: "REDEEMED",
          mint_account: user.mint_account,
          redemption_time:  redemptionTime,
        };

        axios
          .post(BASE + "/updateRegistration", data)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            console.log(error);
          });

        getUserInfo(parsedData.userId).then((res) => {
          setResult({
            name: res.name,
            userId: parsedData.userId,
            eventTitle: parsedData.eventTitle,
            status: res.status,
            chat_id: parsedData.chatId,
          });
        });
      } else {
        alert("User is not registered for this event!");
        return;
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  async function getEvents() {
    const res = await fetch(BASE + "/viewEvents");
    const data = await res.json();

    return data;
  }

  async function getRegistrations(eventId) {
    const res = await fetch(BASE + `/getEventRegistrations/${eventId}`
    );
    const data = await res.json();

    return data;
  }

  async function getUserInfo(userId) {
    const res = await fetch(BASE + `/getUserInfo/${userId}`);
    const data = await res.json();

    return data;
  }

  useEffect(() => {
    getEvents().then((res) => {
      for (let i = 0; i < res.length; i++) {
        let eventData = {};
        if (res[i].id === router.query.id) {
          eventData = res[i];
          getRegistrations(res[i].title).then((res2) => {
            let userData = [];
            console.log(res2);
            const requests = res2.map((r) => getUserInfo(r.userId));
            Promise.all(requests).then((data) => {
              for (let i = 0; i < data.length; i++) {
                userData.push({
                  id: res2[i].userId,
                  status: res2[i].status,
                  mint_account: res2[i].mint_account,
                  registration_time: res2[i].registration_time,
                  redemption_time: res2[i].redemption_time,
                  ...data[i],
                });
              }

              console.log("event", eventData);
              console.log("users", userData);
              setLoading(false);
              setEvent(eventData);
              setUsers(userData);
            });
          });
        }
      }
    });
  }, []);

  const tableData = users.map((user) => {
    return {
      name: user.name,
      handle: user.handle,
      number: user.contact,
      status: user.status,
      mint_account: user.mint_account,
      registration_time: user.registration_time,
      redemption_time: user.redemption_time,
    };
  });

  return (
    <div className="flex flex-col justify-center">
      <div className="flex flex-wrap justify-center"></div>
      <div className="flex flex-wrap justify-start">
        {!loading ? (
          <Event
            title={event.title}
            description={event.description}
            price={event.price}
            time={event.time}
            venue={event.venue}
            capacity={event.capacity}
            users={users}
          />
        ) : null}
      </div>

      {!loading ? (
        <>
          <div className="flex flex-col justify-center">
          <div className="mb-2">
          <EventStats
            events={{
              "Total Registered": users.length,
              // "Total Successful": users.filter(user => user.status === "SUCCESSFUL").length + "/"+ users.length,
              "Total Redeemed":
                users.filter((user) => user.status === "REDEEMED").length +
                "/" +
                users.length,
              Revenue:
                "$" +
                users.filter((user) => user.status === "REDEEMED").length *
                  event.price,
            }}
          />
          </div>

          <div className="m-2">
            <Table data={tableData} />
          </div>
          </div>

          <div className="my-10 flex justify-center">
            <button
              onClick={openScanner}
              className="flex flex-wrap w-1/6 items-center mx-1 text-white bg-green-500 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center"
            >
              {scan ? "Close Scanner" : "Open Scanner"}
            </button>
            <button
              onClick={downloadCSV}
              className="flex flex-wrap w-1/6 items-center mx-1 text-white bg-yellow-500 hover:bg-yellow-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center"
            >
              Download CSV
            </button>
          </div>

          {scan ? (
            <>
              <h1 className="mt-4 font-bold text-3xl text-center">Scanner</h1>
              <div className="mx-auto my-5">
                <p>Name: {result.name}</p>
                <QrReader
                  delay={200}
                  onError={handleError}
                  onScan={handleScan}
                  style={{
                    height: 240,
                    width: 320,
                  }}
                />
              </div>
            </>
          ) : null}
        </>
      ) : (
        <Box margin="2" padding="2" boxShadow="lg" bg="white">
          <Skeleton height={64} />
          <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="42" />
        </Box>
      )}
    </div>
  );
};

// ml-4 my-2 mr-2

const Post = () => {
  return (
    <div>
      <Content />
    </div>
  );
};
export async function getServerSideProps(context) {
  return {
    props: {},
  };
}
export default Post;

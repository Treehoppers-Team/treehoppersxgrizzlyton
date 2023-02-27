import { useRouter } from "next/router";
import Event from "../../components/event";
import User from "../../components/user";
import EventStats from "../../components/eventStats";
import { useEffect, useState } from "react";
import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";
import QrReader from 'react-qr-scanner';

// const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TEST_TOKEN
const TELEGRAM_TOKEN = "5756526738:AAFw_S43pkP1rQV1vw0WVsNil_xrV25aWAc"

const Content = () => {
  const router = useRouter();
  const [event, setEvent] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({name:"",userId:"",eventTitle:"",status:"",chat_id:""});
  const [scan, setScan] = useState(false);
  const attendees = users.filter((user) => {
    return user.status.toLowerCase() === "successful";
  })

  const openScanner = () => {
    if (scan) {
      setScan(false);
    } else {
      setScan(true);
    }
  }

  const handleScan = (data) => {
    console.log("scanning")
    if (data) {
      console.log(data)
      const parsedData = JSON.parse(data.text);

      // check if parsedData user id is inside the attendees userid
      const user = attendees.find((user) => {
        return user.id === parsedData.userId;
      })

      if (parsedData.eventTitle === event.title && user) {
        alert("Verified!")
        const chat_id = parsedData.chatId;
        console.log(chat_id)
        const telegramPush = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${chat_id}&text=Verified`
        fetch(telegramPush).then((res) => {
          console.log(res)
        })

        getUserInfo(parsedData.userId).then((res) => {
          setResult({
            name: res.name,
            userId: parsedData.userId,
            eventTitle: parsedData.eventTitle,
            status: parsedData.status,
            chat_id: parsedData.chatId
          });
        })
      }
      else {
        alert("User is not registered for this event!");
        return;
      }
    }
  };

  const handleError = err => {
    console.error(err);
  };

  async function getEvents() {
    const res = await fetch("http://localhost:3000/viewEvents");
    const data = await res.json();

    return data;
  }

  async function getRegistrations(eventId) {
    const res = await fetch(
      `http://localhost:3000/getEventRegistrations/${eventId}`
    );
    const data = await res.json();

    return data;
  }

  // async function getEventStats(eventId) {
  //   const res = await fetch(
  //     `http://localhost:3000/getEventStats/${eventId}`
  //   )
  //   const data = await res.json();
  //   const totalRegistered = data["Total Registered"]
  //   const attendance = data["Attendance"]
  //   const result = [totalRegistered, attendance]
  //   console.log(result)
  //   return data;
  // }

  async function getUserInfo(userId) {
    const res = await fetch(`http://localhost:3000/getUserInfo/${userId}`);
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
            console.log(res2)
            const requests = res2.map((r) => getUserInfo(r.userId));
            Promise.all(requests).then((data) => {
              for (let i = 0; i < data.length; i++) {
                userData.push({id:res2[i].userId,status:res2[i].status,...data[i]});
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

  return (
    <div className="flex flex-col justify-center">
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
          <h1 className="mt-4 font-bold text-3xl text-center">
            Interested Users
          </h1>
          <div className="flex flex-wrap justify-center">
            <EventStats events={[users.length,users.filter(user => user.status === "SUCCESSFUL").length, users.length * event.price]} />
            {/* <EventStats events={getEventStats(event.title)} /> */}

          </div>
          <div className="flex flex-wrap justify-center">
            {users.map((user, index) => {
              return (
                <div key={index} className="m-2">
                  <User
                    key={index}
                    name={user.name}
                    contact={user.contact}
                    handle={user.handle}
                    pending={
                      user.status.toLowerCase() === "pending" ||
                      user.status.toLowerCase() === "unsuccessful"
                        ? true
                        : false
                    }
                  />
                </div>
              );
            })}
          </div>
          <div className="my-10 flex justify-center">
          <button
            onClick={openScanner}
            className="flex flex-wrap w-1/6 items-center mx-1 text-white bg-green-500 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center"
          >
            {scan ? "Close Scanner" : "Open Scanner"}
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

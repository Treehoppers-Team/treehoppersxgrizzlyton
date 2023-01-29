import { useRouter } from "next/router";
import Event from "../../components/event";
import User from "../../components/user";
import { useEffect, useState } from "react";
import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";

const Content = () => {
  const router = useRouter();
  const [event, setEvent] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
                userData.push({status:res2[i].status,...data[i]});
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
            {users.map((user, index) => {
              return (
                <div key={index} className="m-2">
                  <User
                    key={index}
                    name={user.name}
                    contact={user.contact}
                    handle={user.handle}
                    pending={user.status === "pending" ? true : false}
                  />
                </div>
              );
            })}
          </div>
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

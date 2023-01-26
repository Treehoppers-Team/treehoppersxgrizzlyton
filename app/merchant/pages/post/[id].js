import { useRouter } from "next/router";
import Event from "../../components/event";
import User from "../../components/user";
import { useEffect, useState } from "react";

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
      `http://localhost:3000/getRegistrations/${eventId}`
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
          getRegistrations(res[i].id).then((res2) => {
            let userData = [];
            const requests = res2.map((r) => getUserInfo(r.userId));
            Promise.all(requests).then((data) => {
              userData = data;
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
            />
          
        ) : null}
      </div>
      
      <h1 className="mt-4 font-bold text-3xl text-center">Interested Users</h1>
      <div className="flex flex-wrap justify-center">
        {users.map((user, index) => {
          return (
            <div key={index} className="m-2">
              <User
                key={index}
                name={user.name}
                contact={user.contact}
                handle={user.handle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

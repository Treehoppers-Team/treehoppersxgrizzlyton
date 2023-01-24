const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const firebase = require("firebase/app");
const { initializeApp } = require("firebase/app");
const {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  getFirestore,
} = require("firebase/firestore");

// Setup Express.js server
const port = 3000;
const app = express();
const fs = require("fs");
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const firebaseConfig = {
  apiKey: "AIzaSyAkhEEbHzLsVNnl6iVJtXegV9zuljKB5i8",
  authDomain: "treehoppers-mynt.firebaseapp.com",
  projectId: "treehoppers-mynt",
  storageBucket: "treehoppers-mynt.appspot.com",
  messagingSenderId: "751257459683",
  appId: "1:751257459683:web:10c7f44cd9684098205ed6",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Firebase Methods
const getEventsFirebase = async () => {
  const querySnapshot = await getDocs(collection(db, "events"));
  const eventInfos = [];
  querySnapshot.forEach((doc) => {
    // const eventTitle = doc.id
    const eventData = doc.data();
    // eventData.title = eventTitle
    eventInfos.push(eventData);
  });
  return eventInfos;
};

const registerUserFirebase = async (userInfo) => {
  docData = {
    handle: userInfo.user_handle,
    name: userInfo.user_name,
    contact: userInfo.user_contact,
    event: userInfo.event_title,
    status: "pending",
  };
  // Doc ID needs to be a string
  setDoc(doc(db, "users", userInfo.user_id.toString()), docData);
};

const getUserInfoFirebase = async (userId) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return {result: "No Such User Exists"}
  }
};

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.get("/viewEvents", (req, res) => {
  try {
    getEventsFirebase().then((result) => res.send(result));
  } catch (err) {
    console.log(err);
  }
});

app.post("/uploadUserInfo", (req, res) => {
  // Extract user data from the request body
  const { user_id, user_handle, user_name, user_contact, event_title } =
    req.body;
  const userInfo = {
    user_id,
    user_handle,
    user_name,
    user_contact,
    event_title,
  };
  try {
    registerUserFirebase(userInfo).then(() => {
      res.status(200).json({ message: "User successfully registered" });
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/checkRegistration/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  try {
    getUserInfoFirebase(user_id).then((result) => {
      res.send(result);
    });
  } catch (err) {
    console.log("/checkRegistration", err);
  }
});

// Start the Express.js web server
app.listen(port, () => console.log("Express.js API listening on port 3000"));

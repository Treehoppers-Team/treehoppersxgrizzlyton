const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const firebase = require("firebase/app");
const { initializeApp } = require("firebase/app");
const { 
  collection, doc, getDoc, getDocs, setDoc, getFirestore 
} = require("firebase/firestore"); 

// Setup Express.js server
const port = 3000;
const app = express();
const fs = require('fs');
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

const firebaseConfig = {
  apiKey: "AIzaSyAkhEEbHzLsVNnl6iVJtXegV9zuljKB5i8",
  authDomain: "treehoppers-mynt.firebaseapp.com",
  projectId: "treehoppers-mynt",
  storageBucket: "treehoppers-mynt.appspot.com",
  messagingSenderId: "751257459683",
  appId: "1:751257459683:web:10c7f44cd9684098205ed6"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Firebase Methods
const getEventsFirebase = async() => {
  const querySnapshot = await getDocs(collection(db, "events"));
  const eventInfos = []
  querySnapshot.forEach((doc) => {
    // const eventTitle = doc.id
    const eventData = doc.data()
    // eventData.title = eventTitle
    eventInfos.push(eventData)
  })
  return eventInfos
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.get("/viewEvents", (req, res) => {
  try {
    getEventsFirebase().then((result) => res.send(result))
  } catch (err) {
    console.log(err)
  }
})

app.post('/uploadUserInfo', (req, res) => {
  // Extract user data from the request body
  const user_handle = req.body.user_handle;
  const user_name = req.body.user_name;
  const user_contact = req.body.user_contact;
  const event_title = req.body.event_title
  // Logic to upload user data to firebase
  docData = {
    name: user_name,
    contact: user_contact,
    event: event_title,
    status: 'pending'
  };
  setDoc(doc(db, "users", user_handle), docData);
  
  // Send a response to the client
  res.status(200).json({ message: 'User information received' });
});

// Start the Express.js web server
app.listen(port, () => console.log("Express.js API listening on port 3000"));
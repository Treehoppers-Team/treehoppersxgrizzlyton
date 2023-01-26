const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const {
  getEventsFirebase,
  insertUserFirebase,
  insertRegistrationFirebase,
  getRegistrationFirebase,
  getUserFirebase,
} = require("./helpers/helpers");

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
  const { user_id, user_handle, user_name, user_contact } =
    req.body;
  const userInfo = {
    user_id,
    user_handle,
    user_name,
    user_contact,
  };
  try {
    insertUserFirebase(userInfo)
      .then(() => res.status(200).json({ message: "User data successfully saved" }))
  } catch (err) {
    console.log(err);
  }
});

app.get("/getUserInfo/:user_id", (req ,res) => {
  const user_id = req.params.user_id;
  try {
    getUserFirebase(user_id).then((result) => {
      res.send(result)
    })
  } catch (err) {
    console.log(err)
  }
})

app.post("/insertRegistration", (req, res) => {
  const { user_id, event_title } = req.body
  const registrationInfo = { user_id, event_title}
  try {
    insertRegistrationFirebase(registrationInfo).then(() => {
      res.status(200).json({ message: "User successfully registered for event" })
    })
  } catch (err) {
    console.log("/insertRegistration error", err)
  }
})

app.get("/checkRegistration/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  try {
    getRegistrationFirebase(user_id).then((result) => {
      res.send(result);
    });
  } catch (err) {
    console.log("/checkRegistration", err);
  }
});

// Start the Express.js web server
app.listen(port, () => console.log(`Express.js API listening on port ${port}`));

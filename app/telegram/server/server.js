const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const {
  getEventsFirebase,
  getUserFirebase, 
  insertUserFirebase,
  insertRegistrationFirebase,
  getRegistrationsFirebase,
  getSuccessfulRegistrationsFirebase,
  insertPaymentFirebase,
  getUserWalletFirebase,
  getNftInfoFirebase,
  mintNft,
} = require("./helpers/helpers");

// Setup Express.js server
const port = 3000;
const app = express();
const fs = require("fs");
const { PublicKey, Keypair } = require("@solana/web3.js");
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

app.get("/getEventRegistrations/:event_title", (req, res) => {
  const event_title = req.params.event_title;
  try {
    getEventRegistrationsFirebase(event_title).then((result) => res.send(result));
  } catch (err) {
    console.log(err);
  }
});

app.get("/getUserInfo/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  try {
    getUserFirebase(user_id).then((result) => res.send(result));
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

app.post("/insertRegistration", (req, res) => {
  const { user_id, event_title, status } = req.body
  const registrationInfo = { user_id, event_title, status}
  try {
    insertRegistrationFirebase(registrationInfo).then(() => {
      res.status(200).json({ message: "User successfully registered for event" })
    })
  } catch (err) {
    console.log("/insertRegistration error", err)
  }
});

app.get("/getRegistrations/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  try {
    getRegistrationsFirebase(user_id).then((result) => res.send(result));
  } catch (err) {
    console.log(err);
  }
});

app.get("/getSuccessfulRegistrations/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  try {
    getSuccessfulRegistrationsFirebase(user_id).then((result) => {
      res.send(result);
    });
  } catch (err) {
    console.log("/getSuccessfulRegistrations", err);
  }
});

app.post("/insertPayment", (req, res) => {
  const { user_id, event_title } = req.body
  const paymentInfo = { user_id, event_title }
  try {
    insertPaymentFirebase(paymentInfo).then(() => {
      res.status(200).json({ message: "User successfully paid for the event" })
    })
  } catch (err) {
    console.log("/insertPayment error", err)
  }
})

app.post("/mintNft", (req, res) => {
  const { user_id, event_title } = req.body
  try {
    handleMint(user_id, event_title).then(result => {
      console.log("/mintNft ")
      res.status(200).json(result)
    })
  } catch (err) {
    console.log("/mintNft error ", err)
  }
})

const handleMint = async(userId, eventTitle) => {
  const walletKeys = await getUserWalletFirebase(userId)
  const userKeypair = Keypair.fromSecretKey(walletKeys.privateKey)
  console.log("User Keypair: ", userKeypair)

  const nftInfo = await getNftInfoFirebase(eventTitle)
  console.log("Nft Info: ", nftInfo)

  const { merchantKey, title, symbol, uri } = nftInfo[0]
  const creatorKey = new PublicKey(merchantKey)

  const mintTransaction = await mintNft(userKeypair, creatorKey, title, symbol, uri)
  return mintTransaction
}

// Start the Express.js web server
app.listen(port, () => console.log(`Express.js API listening on port ${port}`));

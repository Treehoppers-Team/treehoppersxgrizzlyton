const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const {
  getWalletBalanceFirebase,
  getTransactionHistoryFirebase,
  getUserFirebase,
  insertUserFirebase,
  updateUserBalanceFirebase,
  insertTransactionFirebase,
  updateBankBalanceFirebase,
  updateRegistrationFirebase,
  getEventsFirebase,
  getEventRegistrationsFirebase,
  getRegistrationsFirebase,
  insertRegistrationFirebase,
  mintNft,
  getUserWalletFirebase,
  getNftInfoFirebase
} = require("./helpers/helpers");

// Setup Express.js server
const port = 3000;
const app = express();
const fs = require("fs");
const { PublicKey, Keypair } = require("@solana/web3.js");
const pinataSDK = require("@pinata/sdk");
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjODA1MzJhMC01YmU2LTQyZTItYmRlNS1hMTkwYWZkMzNkZjkiLCJlbWFpbCI6ImFkdmFpdC5iaGFyYXQuZGVzaHBhbmRlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJhMTkyMTNjOGE4YzM1MGNiMjMwMCIsInNjb3BlZEtleVNlY3JldCI6IjA1YjcwMTY0OWEzMGUxOWY5NDE1MzY2OWE4MDNiYjczZGY4MTU5ODIxM2ZiNzlmM2MyYzk3MGViOWQyMjFlNmUiLCJpYXQiOjE2NzUzNzI0MjF9.mmLYahJJ-etF5u_sRdOyJ2irM7F848vMaJ_Z9rK2G0A";
const pinata = new pinataSDK({ pinataJWTKey: JWT });
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

app.get("/viewWalletBalance/:user_id", (req, res) => {
  try {
    const userId = req.params.user_id;
    getWalletBalanceFirebase(userId).then((result) => res.send(result));
  } catch (err) {
    console.log(err);
  }
});

app.get("/viewTransactionHistory/:user_id", (req, res) => {
  try {
    const userId = req.params.user_id;
    getTransactionHistoryFirebase(userId).then((result) => res.send(result));
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
  const { user_id, user_handle, user_name, user_contact, chat_id } = req.body;
  const userInfo = {
    user_id,
    user_handle,
    user_name,
    user_contact,
    chat_id,
  };
  try {
    insertUserFirebase(userInfo).then(() =>
      res.status(200).json({ message: "User data successfully saved" })
    );
  } catch (err) {
    console.log(err);
  }
});

app.post("/topUpWallet", (req, res) => {
  const { user_id, amount, transaction_type, timestamp } = req.body;
  const userBalanceObject = { user_id, amount, transaction_type };
  const newTransaction = { user_id, amount, transaction_type, timestamp };
  const bankBalanceObject = { amount, transaction_type };

  try {
    updateUserBalanceFirebase(userBalanceObject)
      .then(() => insertTransactionFirebase(newTransaction))
      .then(() => updateBankBalanceFirebase(bankBalanceObject))
      .then(() => {
        console.log("Response Sent");
        res.status(200).json({ message: "Payment successfully processed" });
      });
  } catch (err) {
    console.log("/topUpWallet error", err);
  }
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

app.post("/updateRegistration", (req, res) => {
  const { user_id, event_title, status } = req.body
  const registrationInfo = { user_id, event_title, status}
  try {
    updateRegistrationFirebase(registrationInfo).then(() => {
      res.status(200).json({ message: `${registrationInfo.user_id} status successfully updated to ${registrationInfo.status}` })
    })
  } catch (err) {
    console.log("/updatetRegistration error", err)
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

app.post("/ticketSale", (req, res) => {
  const { user_id, amount, transaction_type, timestamp, event_title } = req.body;
  const userBalanceObject = { user_id, amount, transaction_type };
  const newTransaction = { user_id, amount, transaction_type, timestamp, event_title };
  const bankBalanceObject = { amount, transaction_type };

  try {
    updateUserBalanceFirebase(userBalanceObject)
      .then(() => insertTransactionFirebase(newTransaction))
      .then(() => updateBankBalanceFirebase(bankBalanceObject))
      .then(() => {
        console.log("Response Sent");
        res.status(200).json({ message: "Payment successfully processed" });
      });
  } catch (err) {
    console.log("/ticketSale error", err);
  }
});

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

app.post("/raffleRefund", (req, res) => {
  const { user_id, amount, transaction_type, timestamp, event_title } = req.body;
  const userBalanceObject = { user_id, amount, transaction_type };
  const newTransaction = { user_id, amount, transaction_type, timestamp, event_title };
  const bankBalanceObject = { amount, transaction_type };

  try {
    updateUserBalanceFirebase(userBalanceObject)
      .then(() => insertTransactionFirebase(newTransaction))
      .then(() => updateBankBalanceFirebase(bankBalanceObject))
      .then(() => {
        console.log("Response Sent");
        res.status(200).json({ message: "Payment successfully processed" });
      });
  } catch (err) {
    console.log("/raffleRefund error", err);
  }
});

app.post('/uploadMetadata', (req, res) => {
  // Construct URI, using IPFS browser gateway
  // image_URI = req.body["image_URI"]
  // title = req.body["title"]
  // symbol = req.body["symbol"]
  const options = {
    pinataMetadata: {
      name: "test"
    },
    pinataOptions: {
      cidVersion: 0
    }
  };
  const metadata = req.body
  pinata.pinJSONToIPFS(metadata, options)
  .then((result) =>  {
    console.log(result["IpfsHash"])
    res.send(result["IpfsHash"])
  })
  .catch((err) => console.log(err));
})

const handleMint = async(userId, eventTitle) => {
  const walletKeys = await getUserWalletFirebase(userId)
  const userKeypair = Keypair.fromSecretKey(walletKeys.privateKey)

  const nftInfo = await getNftInfoFirebase(eventTitle)
  console.log("Nft Info: ", nftInfo)

  const { merchantKey, title, symbol, uri } = nftInfo[0]
  const creatorKey = new PublicKey(merchantKey)

  const mintTransaction = await mintNft(userKeypair, creatorKey, title, symbol, uri)
  return mintTransaction
}

// Start the Express.js web server
app.listen(port, () => console.log(`Express.js API listening on port ${port}`));

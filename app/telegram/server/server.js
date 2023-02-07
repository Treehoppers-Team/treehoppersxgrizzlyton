const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: "../../../.env" });

const { getWalletBalanceFirebase, getTransactionHistoryFirebase } = require("./helpers/helpers");

// Setup Express.js server
const port = 3000;
const app = express();
const fs = require("fs");
const { PublicKey, Keypair } = require("@solana/web3.js");
const pinataSDK = require('@pinata/sdk');
const JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjODA1MzJhMC01YmU2LTQyZTItYmRlNS1hMTkwYWZkMzNkZjkiLCJlbWFpbCI6ImFkdmFpdC5iaGFyYXQuZGVzaHBhbmRlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJhMTkyMTNjOGE4YzM1MGNiMjMwMCIsInNjb3BlZEtleVNlY3JldCI6IjA1YjcwMTY0OWEzMGUxOWY5NDE1MzY2OWE4MDNiYjczZGY4MTU5ODIxM2ZiNzlmM2MyYzk3MGViOWQyMjFlNmUiLCJpYXQiOjE2NzUzNzI0MjF9.mmLYahJJ-etF5u_sRdOyJ2irM7F848vMaJ_Z9rK2G0A"
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
    getTransactionHistoryFirebase(userId).then((result) => {
      console.log(result)
      res.send(result)
    });
  } catch (err) {
    console.log(err);
  }
});

// Start the Express.js web server
app.listen(port, () => console.log(`Express.js API listening on port ${port}`));

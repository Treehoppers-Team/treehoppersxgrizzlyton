const {
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} = require("@solana/spl-token");
const {
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
} = require("@solana/web3.js");
const { AnchorProvider, Program } = require("@project-serum/anchor");
const firebase = require("firebase/app");
const { initializeApp } = require("firebase/app");
const {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  getFirestore,
  addDoc,
  query,
  where,
  updateDoc,
} = require("firebase/firestore");
const {
  default: NodeWallet,
} = require("@project-serum/anchor/dist/cjs/nodewallet");
require("dotenv").config({ path: "../../../../.env" });

const idl = require("../idl.json");
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
const CUSTOM_DEVNET_RPC = process.env.CUSTOM_DEVNET_RPC;

// Firebase Methods
module.exports = {
  getWalletBalanceFirebase: async (userId) => {
    const docRef = doc(db, "users", userId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { balance } = docSnap.data()
      return { balance }
    } else {
      return { balance : 0 };
    }
  },

  getTransactionHistoryFirebase: async (userId) => {
    const transactionRef = collection(db, "transactions");
    // UserId needs to be converted from number to string prior to the check
    const filter = query(
      transactionRef,
      where("userId", "==", userId.toString())
    );
    const querySnapshot = await getDocs(filter);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const transactionData = doc.data();
      transactions.push(transactionData);
    });
    return transactions;
  }, 

  getUserFirebase: async (userId) => {
    const docRef = doc(db, "users", userId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return { name: "No Such User Exists" };
    }
  },

  insertUserFirebase: async (userInfo) => {
    docData = {
      handle: userInfo.user_handle,
      name: userInfo.user_name,
      contact: userInfo.user_contact,
      balance: 0
    };
    // Doc ID needs to be a string
    await setDoc(doc(db, "users", userInfo.user_id.toString()), docData);
  },

  updateUserBalanceFirebase: async (userBalanceInfo) => {
    if (userBalanceInfo.transaction_type == "TOP_UP") {
      const userId = userBalanceInfo.user_id
      const docRef = doc(db, "users", userId.toString())
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentBalance = docSnap.data().balance
        const newBalance = currentBalance + userBalanceInfo.amount
        await updateDoc(docRef, {balance: newBalance})
        console.log(`User ${userId} topped up ${userBalanceInfo.amount} successfully`)
      } else {
        return { error : "User does not exist"}
      }
    }
  },

  insertTransactionFirebase: async (transactionInfo) => {
    docData = {
      userId: transactionInfo.user_id.toString(), 
      transactionType: transactionInfo.transaction_type, 
      amount: transactionInfo.amount, 
      timestamp: transactionInfo.timestamp
    }
    const docId = docData.userId + " " + docData.timestamp
    await setDoc(doc(db, "transactions", docId), docData);
    console.log(`Transaction ${docId} inserted successfully`)
  },

  updateBankBalanceFirebase: async (bankBalanceInfo) => {
    if (bankBalanceInfo.transaction_type == "TOP_UP") {
      const docRef = doc(db, "bank", "MYNT_BANK")
      const docSnap = await getDoc(docRef)
      const currentDeposits = docSnap.data().totalDeposits
      const updatedDeposits = currentDeposits + bankBalanceInfo.amount
      await updateDoc(docRef, {totalDeposits: updatedDeposits})
      console.log(`Bank Total Deposits updated to be ${updatedDeposits}`)
    }
  }

};

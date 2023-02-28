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
const CUSTOM_DEVNET_RPC = "https://solana-devnet.g.alchemy.com/v2/3G5jrH0s66-ueZNp9clzqeoDwvylCa_4";

// Firebase Methods
module.exports = {
  getWalletBalanceFirebase: async (userId) => {
    const docRef = doc(db, "users", userId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { balance } = docSnap.data();
      return { balance };
    } else {
      return { balance: 0 };
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
      balance: 0,
      chat_id: userInfo.chat_id
    };
    // Doc ID needs to be a string
    await setDoc(doc(db, "users", userInfo.user_id.toString()), docData);
  },

  updateUserBalanceFirebase: async (userBalanceInfo) => {
    const userId = userBalanceInfo.user_id;
    const docRef = doc(db, "users", userId.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentBalance = docSnap.data().balance;
      if (userBalanceInfo.transaction_type == "TOP_UP") {
        const newBalance = currentBalance + userBalanceInfo.amount;
        await updateDoc(docRef, { balance: newBalance });
        console.log(
          `User ${userId} topped up ${userBalanceInfo.amount} successfully`
        );
      }
      if (userBalanceInfo.transaction_type == "SALE") {
        const newBalance = currentBalance - userBalanceInfo.amount;
        await updateDoc(docRef, { balance: newBalance });
        console.log(
          `${userBalanceInfo.amount} deducted from user ${userId} balance`
        );
      }
      if (userBalanceInfo.transaction_type == "REFUND") {
        const newBalance = currentBalance + userBalanceInfo.amount;
        await updateDoc(docRef, { balance: newBalance });
        console.log(
          `User ${userId} refunded ${userBalanceInfo.amount} successfully`
        );
      }
    } else {
      return { error: "User does not exist" };
    }
  },

  insertTransactionFirebase: async (transactionInfo) => {
    docData = {
      userId: transactionInfo.user_id.toString(),
      transactionType: transactionInfo.transaction_type,
      amount: transactionInfo.amount,
      timestamp: transactionInfo.timestamp,
    };
    if ("event_title" in transactionInfo) {
      docData.eventTitle = transactionInfo.event_title;
    }
    const docId = docData.userId + " " + docData.timestamp;
    await setDoc(doc(db, "transactions", docId), docData);
    console.log(`Transaction ${docId} inserted successfully`);
  },

  updateBankBalanceFirebase: async (bankBalanceInfo) => {
    const docRef = doc(db, "bank", "MYNT_BANK");
    const docSnap = await getDoc(docRef);
    if (bankBalanceInfo.transaction_type == "TOP_UP") {
      const currentDeposits = docSnap.data().totalDeposits;
      const updatedDeposits = currentDeposits + bankBalanceInfo.amount;
      await updateDoc(docRef, { totalDeposits: updatedDeposits });
      console.log(`Bank Total Deposits updated to be ${updatedDeposits}`);
    }
    if (bankBalanceInfo.transaction_type == 'SALE') {
      const currentSales = docSnap.data().totalSales;
      const updatedSales= currentSales + bankBalanceInfo.amount;
      await updateDoc(docRef, { totalSales: updatedSales });
      console.log(`Bank Total Sales updated to be ${updatedSales}`);
    }
    if (bankBalanceInfo.transaction_type == 'REFUND') {
      const currentSales = docSnap.data().totalSales;
      const updatedSales= currentSales - bankBalanceInfo.amount;

      await updateDoc(docRef, {
        totalSales: updatedSales,
      });

      console.log(`Bank Total Sales updated to be ${updatedSales}`);
    }
  },

  getEventRegistrationsFirebase: async (eventTitle) => {
    const querySnapshot = await getDocs(collection(db, "registrations"));
    const registrationInfos = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().eventTitle === eventTitle) {
        registrationInfos.push(doc.data());
      }
    });
    return registrationInfos;
  },

  getEventsFirebase: async () => {
    const querySnapshot = await getDocs(collection(db, "events"));
    const eventInfos = [];
    querySnapshot.forEach((doc) => {
      // const eventTitle = doc.id
      const eventData = { id: doc.id, ...doc.data() };
      // eventData.title = eventTitle
      eventInfos.push(eventData);
    });
    return eventInfos;
  },

  getRegistrationsFirebase: async (userId) => {
    const registrationRef = collection(db, "registrations");
    // UserId needs to be converted from number to string prior to the check
    const filter = query(
      registrationRef,
      where("userId", "==", userId.toString())
    );
    const querySnapshot = await getDocs(filter);
    const registrationInfos = [];
    querySnapshot.forEach((doc) => {
      const registrationData = doc.data();
      registrationInfos.push(registrationData);
    });
    return registrationInfos;
  },

  getAllRegistrationsFirebase: async () => {
    const registrationRef = collection(db, "registrations");
    // UserId needs to be converted from number to string prior to the check
    const filter = query(
      registrationRef
    );
    const querySnapshot = await getDocs(filter);
    const registrationInfos = [];
    querySnapshot.forEach((doc) => {
      const registrationData = doc.data();
      registrationInfos.push(registrationData);
    });
    return registrationInfos;
  },

  insertRegistrationFirebase: async (registrationInfo) => {
    docData = {
      // Inserting as a string bc user_id in user collection is string as well
      userId: registrationInfo.user_id.toString(),
      eventTitle: registrationInfo.event_title,
      status: registrationInfo.status,
    };
    // Doc ID needs to be a string
    const docId = docData.userId + docData.eventTitle;
    await setDoc(doc(db, "registrations", docId.toString()), docData);
  },

  updateRegistrationFirebase: async (registrationInfo) => {
    docData = {
      userId: registrationInfo.user_id.toString(),
      eventTitle: registrationInfo.event_title,
      status: registrationInfo.status,
    };
    
    const docId = docData.userId + docData.eventTitle;
    const docRef = doc(db, "registrations", docId.toString());

    // updating the status of the registration after raffle
    await updateDoc(docRef,{
      status: docData.status
    })
    // await setDoc(doc(db, "registrations", docId.toString()), docData);
  },

  getNftInfoFirebase: async (eventTitle) => {
    try {
      const nftRef = collection(db, "nfts");
      const filter = query(nftRef, where("title", "==", eventTitle));
      const querySnapshot = await getDocs(filter);
      const nftInfo = [];
      querySnapshot.forEach((doc) => {
        const nftDetails = doc.data();
        nftInfo.push(nftDetails);
      });
      return nftInfo;
    } catch (err) {
      console.log("getNftInfoFirebase error ", err);
    }
  },

  getUserWalletFirebase: async (userId) => {
    const createUserWalletFirebase = async (userId) => {
      try {
        // Generate keypair and airdrop some SOL to user account
        const keypair = new Keypair();
        const publicKey = keypair.publicKey;
        const privateKey = keypair.secretKey;

        const customConnection = new Connection(CUSTOM_DEVNET_RPC);
        const airdrop = await customConnection.requestAirdrop(
          publicKey,
          2 * LAMPORTS_PER_SOL
        );
        console.log(`Airdrop transaction for ${userId} `, airdrop);

        // Save public & private key in user's record
        const userRef = doc(db, "users", userId.toString());
        await updateDoc(userRef, {
          publicKey: publicKey.toString(),
          privateKey: Array.from(privateKey),
        }); 

        return { publicKey, privateKey };
      } catch (err) {
        console.log("createUserWalletFirebase error ", err);
      }
    };

    try {
      const docRef = doc(db, "users", userId.toString());
      const docSnap = await getDoc(docRef);
      const userInfo = docSnap.data();
      if ("publicKey" in userInfo && "privateKey" in userInfo) {
        const rawPrivateKey = userInfo.privateKey;
        const privateKeyArray = Uint8Array.from(
          Object.entries(rawPrivateKey).map(([key, value]) => value)
        );
        const userKeyPair = Keypair.fromSecretKey(privateKeyArray);
        const publicKey = userKeyPair.publicKey;
        const privateKey = userKeyPair.secretKey;
        console.log(`Retrieving wallet for ${userId}`);
        return { publicKey, privateKey };
      } else {
        const walletKeys = await createUserWalletFirebase(userId);
        return walletKeys;
      }
    } catch (err) {
      console.log("getUserWalletFirebase error ", err);
    }
  },

  mintNft: async (userKeypair, creatorKey, title, symbol, uri) => {
    try {
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );
      const TREEHOPPERS_PROGRAM_ID = new PublicKey(
        "BgAh9RE8D5119VA1q28MxPMx77mdbYxWc7DPB5ULAB5x"
      );

      // Setup for contract interaction
      const connection = new Connection(CUSTOM_DEVNET_RPC);
      const provider = new AnchorProvider(
        connection,
        new NodeWallet(userKeypair),
        AnchorProvider.defaultOptions()
      );
      const program = new Program(idl, TREEHOPPERS_PROGRAM_ID, provider);

      const mintAccount = Keypair.generate();
      let nftTokenAccount;
      let metadataAccount;
      let masterEditionAccount;

      const getMetadataAccount = async (mintAccount) => {
        return (
          await PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintAccount.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )
        )[0];
      };

      const getMasterEditionAccount = async (mintAccount) => {
        return (
          await PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintAccount.toBuffer(),
              Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )
        )[0];
      };

      const createAndInitializeAccounts = async () => {
        // Create & Initialize Mint Account
        const rentLamports = await getMinimumBalanceForRentExemptMint(
          program.provider.connection
        );
        const createMintInstruction = SystemProgram.createAccount({
          fromPubkey: userKeypair.publicKey,
          newAccountPubkey: mintAccount.publicKey,
          lamports: rentLamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        });
        const initializeMintInstruction = createInitializeMintInstruction(
          mintAccount.publicKey,
          0,
          userKeypair.publicKey,
          userKeypair.publicKey
        );
        // Get address of (Associated) Token Account
        nftTokenAccount = await getAssociatedTokenAddress(
          mintAccount.publicKey,
          userKeypair.publicKey
        );
        const createAtaInstruction = createAssociatedTokenAccountInstruction(
          userKeypair.publicKey,
          nftTokenAccount,
          userKeypair.publicKey,
          mintAccount.publicKey
        );
        const transactions = new Transaction().add(
          createMintInstruction,
          initializeMintInstruction,
          createAtaInstruction
        );
        const response = await provider.sendAndConfirm(
          transactions,
          [mintAccount, userKeypair],
          { commitment: "processed" }
        );

        console.log("Transaction Signature: ", response);
        console.log("Mint Account address: ", mintAccount.publicKey.toString());
        console.log("User Account address: ", userKeypair.publicKey.toString());
        console.log(
          "[NFT] Token Account address: ",
          nftTokenAccount.toString(),
          {
            skipPreflight: true,
          }
        );
      };

      const sendMintTransaction = async () => {
        metadataAccount = await getMetadataAccount(mintAccount.publicKey);
        masterEditionAccount = await getMasterEditionAccount(
          mintAccount.publicKey
        );
        const mintTransaction = await program.methods
          .mintNft(creatorKey, uri, title, symbol)
          .accounts({
            mintAuthority: userKeypair.publicKey,
            mintAccount: mintAccount.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            metadataAccount: metadataAccount,
            tokenAccount: nftTokenAccount,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            payer: userKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            masterEdition: masterEditionAccount,
          })
          .signers([userKeypair])
          .rpc({ skipPreflight: true, commitment: "processed" });
        console.log("Transaction Signature: ", mintTransaction);
        return mintTransaction;
      };

      await createAndInitializeAccounts();
      const response = await sendMintTransaction();
      return {
        mintAccount: mintAccount.publicKey.toString(),
        transaction: response,
      };
    } catch (err) {
      console.log("mintNft error ", err);
    }
  },

};

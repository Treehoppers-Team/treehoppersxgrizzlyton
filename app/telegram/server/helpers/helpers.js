const { Keypair, Connection, LAMPORTS_PER_SOL } = require("@solana/web3.js");
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
require("dotenv").config({ path: "../../../../.env" });

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
    };
    // Doc ID needs to be a string
    await setDoc(doc(db, "users", userInfo.user_id.toString()), docData);
  },

  insertRegistrationFirebase: async (registrationInfo) => {
    docData = {
      // Inserting as a string bc user_id in user collection is string as well
      userId: registrationInfo.user_id.toString(),
      eventTitle: registrationInfo.event_title,
      status: "pending",
    };
    await addDoc(collection(db, "registrations"), docData);
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

  getSuccessfulRegistrationsFirebase: async (userId) => {
    const registrationRef = collection(db, "registrations");
    // UserId needs to be converted from number to string prior to the check
    const filter = query(
      registrationRef,
      where("userId", "==", userId.toString()),
      where("status", "==", "success")
    );
    const querySnapshot = await getDocs(filter);
    const registrationInfos = [];
    querySnapshot.forEach((doc) => {
      const registrationData = doc.data();
      registrationInfos.push(registrationData);
    });
    return registrationInfos;
  },

  insertPaymentFirebase: async (paymentInfo) => {
    const registrationCol = collection(db, "registrations");
    // UserId needs to be converted from number to string prior to the check
    const filter = query(
      registrationCol,
      where("userId", "==", paymentInfo.user_id.toString()),
      where("eventTitle", "==", paymentInfo.event_title)
    );
    const querySnapshot = await getDocs(filter);

    // Retrieve the document ID
    const documentId = [];
    querySnapshot.forEach((doc) => {
      const docId = doc.id;
      documentId.push(docId);
    });

    // Update the payment field of the registration doc
    const registrationRef = doc(db, "registrations", documentId[0]);
    await updateDoc(registrationRef, {
      paymentMade: true
    });
    return { result: "Paymen info successfully saved" };
  },

  // createUserWalletFirebase: async (userId) => {
  //   try {
  //     // Generate keypair and airdrop some SOL to user account
  //     const keypair = new Keypair();
  //     const publicKey = keypair.publicKey;
  //     const privateKey = keypair.secretKey;
  
  //     const customConnection = new Connection(CUSTOM_DEVNET_RPC)
  //     const airdrop = await customConnection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL)
  //     console.log("Airdrop transaction: ", airdrop)

  //     // Save public & private key in user's record
  //     const userRef = doc(db, "users", userId.toString());
  //     await updateDoc(userRef, {
  //       publicKey: publicKey.toString(),
  //       privateKey: Array.from(privateKey),
  //     });

  //     return {publicKey, privateKey}
  //   } catch (err) {
  //     console.log("createUserWalletFirebase error ", err)
  //   }
  // },

  getUserWalletFirebase: async (userId) => {

    const createUserWalletFirebase = async (userId) => {
      try {
        // Generate keypair and airdrop some SOL to user account
        const keypair = new Keypair();
        const publicKey = keypair.publicKey;
        const privateKey = keypair.secretKey;
    
        const customConnection = new Connection(CUSTOM_DEVNET_RPC)
        const airdrop = await customConnection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL)
        console.log("Airdrop transaction: ", airdrop)
    
        // Save public & private key in user's record
        const userRef = doc(db, "users", userId.toString());
        await updateDoc(userRef, {
          publicKey: publicKey.toString(),
          privateKey: Array.from(privateKey),
        });
    
        return {publicKey, privateKey}
      } catch (err) {
        console.log("createUserWalletFirebase error ", err)
      }
    }

    try {
      const docRef = doc(db, "users", userId.toString());
      const docSnap = await getDoc(docRef);
      const userInfo = docSnap.data()
      if ('publicKey' in userInfo && 'privateKey' in userInfo) {
        const rawPrivateKey = userInfo.privateKey
        const privateKeyArray = Uint8Array.from(
          Object.entries(rawPrivateKey).map(([key, value]) => value)
        );
        const userKeyPair = Keypair.fromSecretKey(privateKeyArray)
        const publicKey = userKeyPair.publicKey;
        const privateKey = userKeyPair.secretKey;
        return {publicKey, privateKey}
      }
      else {
        const walletKeys = await createUserWalletFirebase(userId)
        return walletKeys
      }
    } catch (err) {
      console.log("getUserWalletFirebase error ", err)
    }
  }
};
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
} = require("firebase/firestore");

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
module.exports = {
    getEventsFirebase : async () => {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventInfos = [];
        querySnapshot.forEach((doc) => {
        // const eventTitle = doc.id
        const eventData = doc.data();
        // eventData.title = eventTitle
        eventInfos.push(eventData);
        });
        return eventInfos;
    },
    
    insertUserFirebase : async (userInfo) => {
        docData = {
        handle: userInfo.user_handle,
        name: userInfo.user_name,
        contact: userInfo.user_contact,
        };
        // Doc ID needs to be a string
        await setDoc(doc(db, "users", userInfo.user_id.toString()), docData);
    },
    
    getUserFirebase : async (userId) => {
        const docRef = doc(db, "users", userId.toString());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
        return docSnap.data();
        } else {
        return {name: "No Such User Exists"}
        }
    },
    
    insertRegistrationFirebase : async (registrationInfo) => {
        docData = {
        // Inserting as a string bc user_id in user collection is string as well
        userId: registrationInfo.user_id.toString(), 
        eventTitle: registrationInfo.event_title,
        status: "pending",
        }
        await addDoc(collection(db, "registrations"), docData);
    },
    
    getRegistrationFirebase : async (userId) => {
        const registrationRef = collection(db, "registrations");
        // UserId needs to be converted from number to string prior to the check
        const filter = query(registrationRef, where("userId", "==", userId.toString()));
        const querySnapshot = await getDocs(filter);
        const registrationInfos = [];
        querySnapshot.forEach((doc) => {
        const registrationData = doc.data()
        registrationInfos.push(registrationData)
        });
        return registrationInfos
    }
};
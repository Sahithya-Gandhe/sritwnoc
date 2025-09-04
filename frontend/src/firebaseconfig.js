import { initializeApp } from "firebase/app";
import { getAuth , GoogleAuthProvider} from "firebase/auth";
import { getFirestore} from "firebase/firestore";
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtMqpnHjRCaZGK-eLAeNnNxdRBHdJwZF0",
  authDomain: "sritwnoc.firebaseapp.com",
  projectId: "sritwnoc",
  storageBucket: "sritwnoc.firebasestorage.app",
  messagingSenderId: "1089143493984",
  appId: "1:1089143493984:web:bd19d67824ffee6aa17a05",
  measurementId: "G-R304N1PBTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleprovider = new GoogleAuthProvider();
const db = getFirestore(app);
const analytics = getAnalytics(app);

export {auth, googleprovider , db}
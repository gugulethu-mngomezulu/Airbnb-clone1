import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBehkVsdyholYgxDI9pYSOEPupAP6R2Deo",
  authDomain: "airbnb-clone-d8a9c.firebaseapp.com",
  databaseURL: "https://airbnb-clone-d8a9c-default-rtdb.firebaseio.com",
  projectId: "airbnb-clone-d8a9c",
  storageBucket: "airbnb-clone-d8a9c.appspot.com",
  messagingSenderId: "749954329468",
  appId: "1:749954329468:web:b3a28f12ab0531fbe012f9",
  measurementId: "G-JMGYH5WGSM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

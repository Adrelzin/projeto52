import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBPJvcLK5FoaqExoRYzlB_EKmeBZXALczo",
  authDomain: "tarefaprog-85681.firebaseapp.com",
  projectId: "tarefaprog-85681",
  storageBucket: "tarefaprog-85681.appspot.com",
  messagingSenderId: "614033347459",
  appId: "1:614033347459:web:f994d411b84ec041a99cb6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
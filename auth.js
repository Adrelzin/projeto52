import { auth } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

export const login = (email, senha) => {
  return signInWithEmailAndPassword(auth, email, senha);
};

export const cadastrar = (email, senha) => {
  return createUserWithEmailAndPassword(auth, email, senha);
};
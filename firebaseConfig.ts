import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwriza4xTWn0kT-clamqFWQOmZenk8oQ8",
  authDomain: "lideranca-irv.firebaseapp.com",
  projectId: "lideranca-irv",
  storageBucket: "lideranca-irv.firebasestorage.app",
  messagingSenderId: "420842927514",
  appId: "1:420842927514:web:1508be5f38c7c824ea3623",
  measurementId: "G-HWPGGE7SBX"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);

// Exporta os serviços
export const db = app.firestore();
export const auth = app.auth();

export default app;
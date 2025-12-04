  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js"
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js"
  
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC382YyDcU6KWEPOeEkjmfCkuCJQNiLIoA",
    authDomain: "benly-1a313.firebaseapp.com",
    projectId: "benly-1a313",
    storageBucket: "benly-1a313.firebasestorage.app",
    messagingSenderId: "71204882220",
    appId: "1:71204882220:web:60cde2dfd2b74124b48e89"
  };

  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app)
  

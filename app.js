// app.js
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCrjswSQGWxkWKF_z1ugFRI4x-0AqVbxhY",
  authDomain: "swag-c5ed5.firebaseapp.com",
  databaseURL: "https://swag-c5ed5-default-rtdb.firebaseio.com",
  projectId: "swag-c5ed5",
  storageBucket: "swag-c5ed5.firebasestorage.app",
  messagingSenderId: "269038394526",
  appId: "1:269038394526:web:252ac714a9de03aee96f8f",
  measurementId: "G-6GCM26CXHV"
};
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
// import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
// import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// Логика UI
document.addEventListener("DOMContentLoaded", () => {
    
    // Обработка формы загрузки
    const uploadForm = document.getElementById('uploadForm');
    if(uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackName = document.getElementById('trackName').value;
            const file = document.getElementById('audioFile').files[0];
            
            alert(`Имитация загрузки трека: ${trackName}. \nПодключите Firebase Storage для реальной загрузки!`);
            // Здесь будет код uploadBytes(storageRef, file) из Firebase
        });
    }

    // Обработка логина
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Имитация входа. Подключите Firebase Auth!");
            window.location.href = "index.html"; // Редирект после "входа"
        });
    }
});
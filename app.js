// Импортируем нужные модули Firebase (версия 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ваш конфиг
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

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. ЛОГИКА АВТОРИЗАЦИИ (login.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            btn.innerText = "Загрузка...";

            try {
                // Пытаемся войти
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "index.html"; // Успешный вход
            } catch (error) {
                // Если аккаунта нет, создаем новый (Регистрация)
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        alert("Вы успешно зарегистрировались!");
                        window.location.href = "index.html";
                    } catch (regError) {
                        alert("Ошибка регистрации: " + regError.message);
                    }
                } else {
                    alert("Ошибка: " + error.message);
                }
            }
            btn.innerText = "Войти / Регистрация";
        });
    }

    // --- 2. ЛОГИКА ЗАГРУЗКИ ТРЕКОВ (upload.html) ---
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Проверяем, вошел ли пользователь
            const user = auth.currentUser;
            if (!user) {
                alert("Пожалуйста, сначала войдите в аккаунт!");
                window.location.href = "login.html";
                return;
            }

            const trackName = document.getElementById('trackName').value;
            const file = document.getElementById('audioFile').files[0];
            const btn = uploadForm.querySelector('button');
            
            btn.innerText = "Идет выгрузка...";
            btn.disabled = true;

            try {
                // 1. Загружаем MP3 файл в Firebase Storage
                const storageRef = ref(storage, 'tracks/' + Date.now() + '_' + file.name);
                await uploadBytes(storageRef, file);
                
                // 2. Получаем ссылку на загруженный файл
                const downloadURL = await getDownloadURL(storageRef);

                // 3. Сохраняем информацию о треке в базу данных (Firestore)
                await addDoc(collection(db, "tracks"), {
                    title: trackName,
                    audioUrl: downloadURL,
                    artist: user.email.split('@')[0], // Имя артиста - часть email
                    timestamp: Date.now()
                });

                alert("Трек успешно выгружен в сеть!");
                window.location.href = "index.html"; // Возвращаем на главную
            } catch (error) {
                alert("Ошибка выгрузки: " + error.message);
                btn.innerText = "Загрузить в сеть";
                btn.disabled = false;
            }
        });
    }

 // --- 3. ЛОГИКА ОТОБРАЖЕНИЯ ТРЕКОВ НА ГЛАВНОЙ (index.html) ---
    const recommendations = document.getElementById('recommendations');
    if (recommendations) {
        async function loadTracks() {
            try {
                const q = query(collection(db, "tracks"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                recommendations.innerHTML = ""; 
                
                querySnapshot.forEach((doc) => {
                    const track = doc.data();
                    // Ссылка на профиль артиста сделана кликабельной!
                    recommendations.innerHTML += `
                        <div class="card">
                            <h3>${track.title}</h3>
                            <p style="color: #fff; text-shadow: var(--neon-glow);">
                                Artist: <a href="profile.html?user=${track.artist}" style="color: inherit; text-decoration: underline;">${track.artist}</a>
                            </p>
                            <audio controls src="${track.audioUrl}" style="width: 100%; margin-top: 15px; border-radius: 5px;"></audio>
                        </div>
                    `;
                });

                if(querySnapshot.empty) {
                    recommendations.innerHTML = "<p>Треков пока нет.</p>";
                }
            } catch (error) {
                console.error("Ошибка загрузки треков: ", error);
            }
        }
        loadTracks();
    }

// --- 4. ЛОГИКА ПРОФИЛЯ (profile.html) ---
    const profileTracks = document.getElementById('profileTracks');
    const profileNameEl = document.getElementById('profileName');
    const profileAvatarEl = document.getElementById('profileAvatar');

    if (profileTracks && profileNameEl) {
        // Смотрим, есть ли никнейм в ссылке (чужой профиль)
        const urlParams = new URLSearchParams(window.location.search);
        let profileUser = urlParams.get('user');

        // Функция: ставим имя, подбираем аватарку и грузим треки
        function loadProfileData(username) {
            // 1. Убираем надпись "Загрузка" и ставим никнейм
            profileNameEl.innerText = username;

            // 2. Магия: превращаем никнейм в число от 1 до 5 (чтобы аватар был постоянным)
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash += username.charCodeAt(i);
            }
            const avatarNumber = (hash % 5) + 1; 

            // 3. Показываем картинку avatar1.png, avatar2.png и т.д.
            profileAvatarEl.src = `avatar${avatarNumber}.png`;
            profileAvatarEl.style.display = "block";

            // 4. Ищем треки этого артиста
            fetchTracksForUser(username);
        }

        // РЕШАЕМ ПРОБЛЕМУ "ЗАГРУЗКИ"
        if (profileUser) {
            // Если мы перешли по ссылке на чужой профиль — грузим сразу!
            loadProfileData(profileUser);
        } else {
            // Если мы нажали кнопку "Профиль" в меню — ждем проверки авторизации
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    profileUser = user.email.split('@')[0];
                    loadProfileData(profileUser);
                } else {
                    alert("Сначала войдите в систему!");
                    window.location.href = "login.html";
                }
            });
        }

        // Функция запроса треков из базы данных
        async function fetchTracksForUser(username) {
            try {
                const q = query(collection(db, "tracks"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                profileTracks.innerHTML = ""; 
                let hasTracks = false;
                
                querySnapshot.forEach((doc) => {
                    const track = doc.data();
                    if(track.artist === username) {
                        hasTracks = true;
                        profileTracks.innerHTML += `
                            <div class="card">
                                <h3>${track.title}</h3>
                                <audio controls src="${track.audioUrl}" style="width: 100%; margin-top: 15px; border-radius: 5px; outline: none;"></audio>
                            </div>
                        `;
                    }
                });

                if(!hasTracks) {
                    profileTracks.innerHTML = "<p style='color: #888;'>Этот артист пока ничего не выпустил.</p>";
                }
            } catch (error) {
                console.error("Ошибка профиля: ", error);
                profileTracks.innerHTML = "<p style='color: red;'>Ошибка при загрузке треков.</p>";
            }
        }
    }

// 1. Импорты Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Твой конфиг Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrjswSQGWxkWKF_z1ugFRI4x-0AqVbxhY",
  authDomain: "swag-c5ed5.firebaseapp.com",
  databaseURL: "https://swag-c5ed5-default-rtdb.firebaseio.com",
  projectId: "swag-c5ed5",
  storageBucket: "swag-c5ed5.firebasestorage.app",
  messagingSenderId: "269038394526",
  appId: "1:269038394526:web:252ac714a9de03aee96f8f"
};

// 3. Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ждем загрузки страницы
document.addEventListener("DOMContentLoaded", () => {
    
    // --- РАЗДЕЛ 1. ЛОГИКА АВТОРИЗАЦИИ (login.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            btn.innerText = "Загрузка...";

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "index.html"; // Успешный вход
            } catch (error) {
                // Если аккаунта нет - регистрируем
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

    // --- РАЗДЕЛ 2. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (index.html) ---
    const recommendations = document.getElementById('recommendations');
    if (recommendations) {
        async function loadTracks() {
            try {
                const q = query(collection(db, "tracks"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                recommendations.innerHTML = ""; 
                
                querySnapshot.forEach((doc) => {
                    const track = doc.data();
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
                    recommendations.innerHTML = "<p>Треков пока нет. Отправь первый!</p>";
                }
            } catch (error) {
                console.error("Ошибка загрузки треков: ", error);
                recommendations.innerHTML = "<p>Ошибка связи с базой данных.</p>";
            }
        }
        loadTracks();
    }

    // --- РАЗДЕЛ 3. ЛОГИКА ПРОФИЛЯ (profile.html) ---
    const profileTracks = document.getElementById('profileTracks');
    const profileNameEl = document.getElementById('profileName');
    const profileAvatarEl = document.getElementById('profileAvatar');

    if (profileTracks && profileNameEl) {
        const urlParams = new URLSearchParams(window.location.search);
        let profileUser = urlParams.get('user');

        // Функция: ставим имя, подбираем аватарку и грузим треки
        function loadProfileData(username) {
            profileNameEl.innerText = username;

            // Вычисляем аватарку от 1 до 5
            let hash = 0;
            for (let i = 0; i < username.length; i++) {
                hash += username.charCodeAt(i);
            }
            const avatarNumber = (hash % 5) + 1; 

            profileAvatarEl.src = `avatar${avatarNumber}.png`;
            profileAvatarEl.style.display = "block";

            fetchTracksForUser(username);
        }

        // Если перешли по ссылке на чужой профиль
        if (profileUser) {
            loadProfileData(profileUser);
        } else {
            // Если нажали "Профиль" в меню — ждем проверки авторизации
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

        // Загрузка треков конкретного юзера
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

}); // <-- ВОТ ЭТИ СКОБКИ У ТЕБЯ ПОТЕРЯЛИСЬ, ТЕПЕРЬ ОНИ НА МЕСТЕ!

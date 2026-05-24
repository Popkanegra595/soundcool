// 1. Импорты Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Конфиг
const firebaseConfig = {
  apiKey: "AIzaSyCrjswSQGWxkWKF_z1ugFRI4x-0AqVbxhY",
  authDomain: "swag-c5ed5.firebaseapp.com",
  databaseURL: "https://swag-c5ed5-default-rtdb.firebaseio.com",
  projectId: "swag-c5ed5",
  storageBucket: "swag-c5ed5.firebasestorage.app",
  messagingSenderId: "269038394526",
  appId: "1:269038394526:web:252ac714a9de03aee96f8f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allTracks = []; // Глобальный массив для поиска

document.addEventListener("DOMContentLoaded", () => {
    
    // --- ГЛОБАЛЬНО: НИЖНЯЯ ПАНЕЛЬ И АВАТАРКА ---
    const bottomNavProfile = document.getElementById('bottomNavProfile');
    if (bottomNavProfile) {
        onAuthStateChanged(auth, (user) => {
            const navAvatar = document.getElementById('navAvatar');
            const navPlaceholder = document.getElementById('navAvatarPlaceholder');
            const navName = document.getElementById('navName');

            if (user) {
                const username = user.email.split('@')[0];
                navName.innerText = username;
                bottomNavProfile.href = "profile.html"; // Если вошел - кнопка ведет в профиль

                let hash = 0;
                for (let i = 0; i < username.length; i++) { hash += username.charCodeAt(i); }
                const avatarNumber = (hash % 5) + 1; 

                navAvatar.src = `avatar${avatarNumber}.png`;
                navAvatar.style.display = "block";
                navPlaceholder.style.display = "none";
            } else {
                navName.innerText = "Войти";
                bottomNavProfile.href = "login.html"; // Если не вошел - ведет на логин
                navAvatar.style.display = "none";
                navPlaceholder.style.display = "flex";
            }
        });
    }

    // --- ЛОГИКА АВТОРИЗАЦИИ (login.html) ---
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
                window.location.href = "index.html"; 
            } catch (error) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        alert("Вы успешно зарегистрировались!");
                        window.location.href = "index.html";
                    } catch (regError) {
                        alert("Ошибка: " + regError.message);
                    }
                } else {
                    alert("Ошибка: " + error.message);
                }
            }
            btn.innerText = "Войти / Регистрация";
        });
    }

    // --- ЛОГИКА ГЛАВНОЙ И ПОИСКА (index.html) ---
    const recommendations = document.getElementById('recommendations');
    const searchInput = document.getElementById('searchInput');

    if (recommendations) {
        // Функция отрисовки с КАСКАДНОЙ АНИМАЦИЕЙ
        function renderTracks(tracksToRender) {
            recommendations.innerHTML = ""; 
            
            if(tracksToRender.length === 0) {
                recommendations.innerHTML = "<p style='text-align:center;'>Ничего не найдено.</p>";
                return;
            }

            tracksToRender.forEach((track, index) => {
                // Создаем карточку (пока невидимую)
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${track.title}</h3>
                    <p style="color: #fff; text-shadow: var(--neon-glow);">
                        Artist: <a href="profile.html?user=${track.artist}" style="color: inherit; text-decoration: underline;">${track.artist}</a>
                    </p>
                    <audio controls src="${track.audioUrl}" style="width: 100%; margin-top: 15px; border-radius: 5px; outline: none;"></audio>
                `;
                recommendations.appendChild(card);

                // Запускаем анимацию появления по очереди (задержка 150мс на каждую карту)
                setTimeout(() => {
                    card.classList.add('show');
                }, index * 150); 
            });
        }

        async function loadTracks() {
            try {
                const q = query(collection(db, "tracks"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                
                allTracks = []; 
                querySnapshot.forEach((doc) => {
                    allTracks.push(doc.data());
                });

                renderTracks(allTracks); 
            } catch (error) {
                recommendations.innerHTML = "<p>Ошибка загрузки.</p>";
            }
        }
        
        loadTracks();

        // Поиск (исправленный)
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                
                if (searchText === "") {
                    renderTracks(allTracks); // Если строка пустая - показываем всё
                } else {
                    const filteredTracks = allTracks.filter(track => 
                        track.title.toLowerCase().includes(searchText) || 
                        track.artist.toLowerCase().includes(searchText)
                    );
                    renderTracks(filteredTracks);
                }
            });
        }
    }

    // --- ЛОГИКА ПРОФИЛЯ (profile.html) ---
    const profileTracks = document.getElementById('profileTracks');
    const profileNameEl = document.getElementById('profileName');
    
    if (profileTracks && profileNameEl) {
        const urlParams = new URLSearchParams(window.location.search);
        let profileUser = urlParams.get('user');

        function loadProfileData(username) {
            profileNameEl.innerText = username;
            let hash = 0;
            for (let i = 0; i < username.length; i++) { hash += username.charCodeAt(i); }
            const avatarNumber = (hash % 5) + 1; 
            document.getElementById('profileAvatar').src = `avatar${avatarNumber}.png`;
            document.getElementById('profileAvatar').style.display = "block";
            fetchTracksForUser(username);
        }

        if (profileUser) {
            loadProfileData(profileUser);
        } else {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    profileUser = user.email.split('@')[0];
                    loadProfileData(profileUser);
                } else {
                    alert("Войдите для просмотра своего профиля.");
                    window.location.href = "login.html";
                }
            });
        }

        async function fetchTracksForUser(username) {
            try {
                const q = query(collection(db, "tracks"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                profileTracks.innerHTML = ""; 
                let hasTracks = false;
                
                let trackIndex = 0; // Для анимации в профиле
                querySnapshot.forEach((doc) => {
                    const track = doc.data();
                    if(track.artist === username) {
                        hasTracks = true;
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.innerHTML = `
                            <h3>${track.title}</h3>
                            <audio controls src="${track.audioUrl}" style="width: 100%; margin-top: 15px; border-radius: 5px; outline: none;"></audio>
                        `;
                        profileTracks.appendChild(card);
                        
                        setTimeout(() => { card.classList.add('show'); }, trackIndex * 150);
                        trackIndex++;
                    }
                });

                if(!hasTracks) profileTracks.innerHTML = "<p>Этот артист пока ничего не выпустил.</p>";
            } catch (error) {
                console.error("Ошибка профиля: ", error);
            }
        }
    }
});

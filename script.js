import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvBTVTYSuFjHjMiZYGiFFN4yviglcXDB4",
    authDomain: "mdt-onlinerp.firebaseapp.com",
    projectId: "mdt-onlinerp",
    storageBucket: "mdt-onlinerp.firebasestorage.app",
    appId: "1:102349354657:web:7085e7db36adec678d22e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = null;

// --- AUTHENTIFICATION ---

window.toggleRegister = (show) => {
    document.getElementById('auth-fields').style.display = show ? 'none' : 'block';
    document.getElementById('register-fields').style.display = show ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value;
    const n = document.getElementById('reg-nom').value;
    const g = document.getElementById('reg-grad').value;
    const m = document.getElementById('reg-mat').value;
    const ps = document.getElementById('reg-pass').value;
    
    if(p && n && g && m && ps) {
        await addDoc(collection(db, "users"), { 
            prenom: p, nom: n, grade: g, matricule: m, mdp: ps, 
            en_service: false, panic: false 
        });
        alert("Agent enregistré ! Connectez-vous.");
        toggleRegister(false);
    } else {
        alert("Remplissez tous les champs.");
    }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const userDoc = snap.docs[0];
        currentUser = userDoc.data();
        currentUser.id = userDoc.id;

        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        
        // Mise à jour badge
        document.getElementById('display-name').innerText = currentUser.nom;
        document.getElementById('display-grade').innerText = currentUser.grade;

        initRealtime();
    } else {
        alert("Identifiants incorrects.");
    }
};

// --- ACTIONS ---

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const status = btn.innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: status });
    btn.innerText = status ? "EN SERVICE" : "HORS SERVICE";
    btn.className = status ? "status-btn on" : "status-btn off";
};

window.triggerPanic = async () => {
    // On récupère la donnée actuelle pour inverser
    const newState = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: newState });
    currentUser.panic = newState;
};

// --- SYNCHRONISATION TEMPS RÉEL (CORRIGÉ) ---

function initRealtime() {
    // Surveillance des agents (Dispatch + Effectifs + Panic)
    onSnapshot(collection(db, "users"), (snap) => {
        const listUnits = document.getElementById('list-units');
        const listEffectifs = document.getElementById('list-effectifs');
        const panicZone = document.getElementById('panic-zone');
        
        listUnits.innerHTML = "";
        listEffectifs.innerHTML = "";
        panicZone.innerHTML = "";

        snap.forEach(d => {
            const u = d.data();

            // 1. Mise à jour de l'onglet Dispatch (Agents en service)
            if (u.en_service) {
                listUnits.innerHTML += `
                    <div class="card" style="border-left: 4px solid #2ecc71; display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 5px;">
                        <span>[${u.matricule}] ${u.grade} ${u.nom}</span>
                        <span style="color: #2ecc71; font-weight: bold;">● ACTIF</span>
                    </div>`;
            }

            // 2. Mise à jour de l'onglet Effectifs (Tous les agents)
            listEffectifs.innerHTML += `
                <div class="card">
                    <b style="color: var(--accent); font-size: 0.8rem;">${u.grade}</b><br>
                    <span style="font-size: 1.1rem; font-weight: bold;">${u.prenom} ${u.nom}</span><br>
                    <small>Matricule : ${u.matricule}</small>
                </div>`;

            // 3. Gestion de l'annonce Panic
            if (u.panic) {
                panicZone.innerHTML += `
                    <div style="background: #ff0000; color: white; padding: 20px; text-align: center; font-weight: bold; border: 4px solid white; margin-bottom: 20px; animation: pulse 0.6s infinite;">
                        🚨 ATTENTION : PANIC BUTTON ACTIVÉ PAR [${u.matricule}] ${u.nom} 🚨
                    </div>`;
            }
        });
    });

    // Surveillance des BOLO
    onSnapshot(collection(db, "bolos"), (snap) => {
        const list = document.getElementById('list-bolo');
        list.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            list.innerHTML += `
                <div class="card" style="border-left: 5px solid red;">
                    <h3 style="color: red;">AVIS DE RECHERCHE</h3>
                    <p><b>CIBLE :</b> ${b.sujet}</p>
                    <p>${b.raison}</p>
                </div>`;
        });
    });

    // Surveillance des Civils
    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens');
        list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            list.innerHTML += `
                <div class="card">
                    <b>${c.prenom} ${c.nom}</b>
                    <button onclick="addCrime('${d.id}')" style="display:block; margin-top:10px; font-size:10px;">+ Ajouter Crime</button>
                </div>`;
        });
    });
}

// --- NAVIGATION ---

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

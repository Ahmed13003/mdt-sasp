import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, deleteDoc, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvBTVTYSuFjHjMiZYGiFFN4yviglcXDB4",
    authDomain: "mdt-onlinerp.firebaseapp.com",
    projectId: "mdt-onlinerp",
    storageBucket: "mdt-onlinerp.firebasestorage.app",
    messagingSenderId: "102349354657",
    appId: "1:102349354657:web:7085e7db36adec678d22e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = null;

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data();
        currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `OFFICIER : ${currentUser.nom}`;
        initRealtime();
    } else alert("Identifiants incorrects.");
};

// PANIC BUTTON
window.triggerPanic = async () => {
    const newState = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: newState });
    currentUser.panic = newState;
};

// RAPPORTS
window.addReport = async () => {
    const t = document.getElementById('rep-titre').value;
    const c = document.getElementById('rep-contenu').value;
    if(t && c) {
        await addDoc(collection(db, "reports"), { 
            titre: t, contenu: c, auteur: currentUser.nom, date: serverTimestamp() 
        });
        document.getElementById('rep-titre').value = "";
        document.getElementById('rep-contenu').value = "";
        alert("Rapport enregistré.");
    }
};

window.toggleService = async () => {
    const isNow = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    document.getElementById('service-btn').innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isNow ? "service-status active" : "service-status";
};

function initRealtime() {
    // USERS & PANIC
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = ""; pZone.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}; font-weight:bold; margin-bottom:10px;">● [${u.matricule}] ${u.nom} ${u.panic ? ' (URGENCE !)' : ''}</div>`;
            if(u.panic) pZone.innerHTML += `<div class="panic-active-banner">⚠️ OFFICIER ${u.nom.toUpperCase()} EN DANGER (BOUTON PANIQUE ACTIVÉ) ⚠️</div>`;
        });
    });

    // RAPPORTS
    onSnapshot(query(collection(db, "reports"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-reports');
        list.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            list.innerHTML += `<div class="card"><strong>${r.titre}</strong><p style="margin-top:10px; font-size:0.9rem;">${r.contenu}</p><small style="opacity:0.5;">Par: ${r.auteur}</small></div>`;
        });
    });

    // BOLO
    onSnapshot(collection(db, "bolo"), (snap) => {
        const list = document.getElementById('list-bolo');
        const dash = document.getElementById('dash-bolo');
        list.innerHTML = ""; dash.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            const h = `<div class="card" style="border-left:5px solid gold;"><strong>⚠️ ${b.sujet}</strong><p>${b.raison}</p></div>`;
            list.innerHTML += h; dash.innerHTML += h;
        });
    });
}

// NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

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
        
        if (currentUser.statut === "en_attente") return alert("Compte non validé.");
        
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        
        // CORRECTION ICI : Affiche "COMMANDER : Miller" au lieu de "OFFICIER : Miller"
        document.getElementById('display-name').innerText = `${currentUser.grade.toUpperCase()} : ${currentUser.nom.toUpperCase()}`;
        
        const g = currentUser.grade.toLowerCase();
        if(g.includes("commander") || g.includes("sergent") || g.includes("commandant") || g.includes("chef")) {
            if(document.getElementById('form-sasp')) document.getElementById('form-sasp').style.display = 'block';
        }
        initRealtime();
    } else alert("Identifiants incorrects.");
};

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isNow = btn.innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    btn.innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isNow ? "service-status active" : "service-status";
};

window.triggerPanic = async () => {
    const newState = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: newState });
    currentUser.panic = newState;
};

// ... (Le reste des fonctions addReport, addBolo, addCivil reste identique)

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = ""; pZone.innerHTML = "";
        
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) {
                units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}; font-weight:bold; margin-bottom:10px;">● [${u.matricule}] ${u.grade} ${u.nom} ${u.panic ? ' (URGENCE !)' : ''}</div>`;
            }
            // CORRECTION ICI : Le bandeau de panique affiche maintenant le vrai grade (ex: COMMANDER Miller)
            if(u.panic) {
                pZone.innerHTML += `<div class="panic-banner">🚨 ALERTE PANIQUE : ${u.grade.toUpperCase()} ${u.nom.toUpperCase()} EN DANGER ! 🚨</div>`;
            }
        });
    });

    // On garde les snapshots pour les rapports, bolo et civils
    onSnapshot(query(collection(db, "reports"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-reports');
        list.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            list.innerHTML += `<div class="card"><strong>${r.titre}</strong><p style="margin-top:10px;">${r.contenu}</p><small>Par: ${r.auteur}</small></div>`;
        });
    });

    onSnapshot(collection(db, "bolo"), (snap) => {
        const dash = document.getElementById('dash-bolo');
        const list = document.getElementById('list-bolo');
        dash.innerHTML = ""; list.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            const h = `<div class="card" style="border-left:5px solid gold;"><strong>⚠️ ${b.sujet}</strong><p>${b.raison}</p></div>`;
            dash.innerHTML += h; list.innerHTML += h;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens');
        list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            list.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong></div>`;
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

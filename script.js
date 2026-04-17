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

// --- AUTHENTIFICATION ---
window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value;
    const n = document.getElementById('reg-nom').value;
    const m = document.getElementById('reg-mat').value;
    const ps = document.getElementById('reg-pass').value;
    if(p && n && m && ps) {
        await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, mdp: ps, grade: "Officier I", en_service: false, statut: "en_attente", panic: false });
        alert("Demande envoyée !"); window.toggleRegister(false);
    } else alert("Remplissez tout !");
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data(); currentUser.id = snap.docs[0].id;
        if (currentUser.statut === "en_attente") return alert("Compte non validé.");
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${currentUser.grade.toUpperCase()} : ${currentUser.nom.toUpperCase()}`;
        initRealtime();
    } else alert("Identifiants incorrects.");
};

// --- ACTIONS ---
window.toggleService = async () => {
    const isNow = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    document.getElementById('service-btn').innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isNow ? "service-status active" : "service-status";
};

window.triggerPanic = async () => {
    await updateDoc(doc(db, "users", currentUser.id), { panic: !currentUser.panic });
    currentUser.panic = !currentUser.panic;
};

window.handleMapClick = async (e) => {
    if(e.target.classList.contains('map-marker')) return;
    const rect = document.getElementById('tactical-map').getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const label = prompt("NOM DU POINT :");
    if(label) await addDoc(collection(db, "markers"), { x, y, label, auteur: currentUser.nom });
};

window.addReport = async () => {
    const t = document.getElementById('rep-titre').value;
    const c = document.getElementById('rep-contenu').value;
    if(t && c) await addDoc(collection(db, "reports"), { titre: t, contenu: c, auteur: currentUser.nom, date: serverTimestamp() });
};

window.addBolo = async () => {
    const s = document.getElementById('bolo-sujet').value;
    const r = document.getElementById('bolo-raison').value;
    if(s && r) await addDoc(collection(db, "bolo"), { sujet: s, raison: r, auteur: currentUser.nom, date: serverTimestamp() });
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n });
};

// --- REALTIME ---
function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = "<h3>UNITÉS EN SERVICE</h3>"; pZone.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<p style="color:${u.panic?'red':'#00ff00'}">● [${u.matricule}] ${u.grade} ${u.nom}</p>`;
            if(u.panic) pZone.innerHTML += `<div class="panic-banner">🚨 ${u.grade.toUpperCase()} ${u.nom.toUpperCase()} EN DANGER ! 🚨</div>`;
        });
    });

    onSnapshot(collection(db, "markers"), (snap) => {
        const map = document.getElementById('tactical-map');
        map.querySelectorAll('.map-marker').forEach(m => m.remove());
        snap.forEach(d => {
            const m = d.data();
            const el = document.createElement('div'); el.className = 'map-marker';
            el.style.left = m.x + '%'; el.style.top = m.y + '%';
            el.oncontextmenu = (e) => { e.preventDefault(); deleteDoc(doc(db, "markers", d.id)); };
            el.innerHTML = `<div class="marker-label">${m.label.toUpperCase()}</div>`;
            map.appendChild(el);
        });
    });

    onSnapshot(query(collection(db, "reports"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-reports'); list.innerHTML = "";
        snap.forEach(d => { const r = d.data(); list.innerHTML += `<div style="background:rgba(255,255,255,0.05); padding:15px; margin-top:10px; border-radius:5px;"><strong>${r.titre}</strong><p>${r.contenu}</p><small>Par: ${r.auteur}</small></div>`; });
    });

    onSnapshot(collection(db, "bolo"), (snap) => {
        const dash = document.getElementById('dash-bolo');
        dash.innerHTML = "<h3>AVIS DE RECHERCHE</h3>";
        snap.forEach(d => { const b = d.data(); dash.innerHTML += `<div style="border-left:4px solid gold; padding-left:10px; margin-top:10px;"><strong>${b.sujet}</strong><br>${b.raison}</div>`; });
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

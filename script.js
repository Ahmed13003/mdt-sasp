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

// --- AUTHENTIFICATION (FIXÉ) ---

window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value.trim();
    const n = document.getElementById('reg-nom').value.trim();
    const m = document.getElementById('reg-mat').value.trim();
    const ps = document.getElementById('reg-pass').value.trim();

    if(!p || !n || !m || !ps) return alert("Veuillez remplir tous les champs !");

    try {
        await addDoc(collection(db, "users"), {
            prenom: p,
            nom: n,
            matricule: m,
            mdp: ps,
            grade: "Officier I", // Grade par défaut
            en_service: false,
            statut: "en_attente",
            panic: false
        });
        alert("Demande de création de compte envoyée au haut commandement !");
        window.toggleRegister(false);
    } catch (e) { alert("Erreur lors de l'inscription."); }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    
    if(!mat || !pass) return alert("Champs vides !");

    try {
        const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const userDoc = snap.docs[0];
            currentUser = userDoc.data();
            currentUser.id = userDoc.id;

            if (currentUser.statut === "en_attente") return alert("Votre compte n'a pas encore été validé par un Commandant.");

            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('mdt-app').style.display = 'flex';
            
            // Affichage du grade réel (COMMANDER, etc)
            document.getElementById('display-name').innerText = `${currentUser.grade.toUpperCase()} : ${currentUser.nom.toUpperCase()}`;
            
            // Affichage du menu recrutement si gradé
            const g = currentUser.grade.toLowerCase();
            if(g.includes("commander") || g.includes("sergent") || g.includes("commandant") || g.includes("chef")) {
                if(document.getElementById('form-sasp')) document.getElementById('form-sasp').style.display = 'block';
            }
            initRealtime();
        } else {
            alert("Matricule ou Mot de passe incorrect.");
        }
    } catch (e) { console.error(e); alert("Erreur de connexion."); }
};

// --- SERVICES & PANIC ---

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

// --- CARTE INTERACTIVE ---

window.handleMapClick = async (e) => {
    const map = document.getElementById('tactical-map');
    const rect = map.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const label = prompt("Nom du point (ex: Drogue, Armes, QG) :");
    if(label) {
        await addDoc(collection(db, "markers"), { x, y, label, auteur: currentUser.nom });
    }
};

window.deleteMarker = async (id) => {
    if(confirm("Supprimer ce point ?")) await deleteDoc(doc(db, "markers", id));
};

// --- AUTRES FONCTIONS ---

window.addReport = async () => {
    const t = document.getElementById('rep-titre').value;
    const c = document.getElementById('rep-contenu').value;
    if(t && c) {
        await addDoc(collection(db, "reports"), { titre: t, contenu: c, auteur: currentUser.nom, date: serverTimestamp() });
        document.getElementById('rep-titre').value = ""; document.getElementById('rep-contenu').value = "";
        alert("Rapport envoyé.");
    }
};

window.addBolo = async () => {
    const s = document.getElementById('bolo-sujet').value;
    const r = document.getElementById('bolo-raison').value;
    if(s && r) await addDoc(collection(db, "bolo"), { sujet: s, raison: r, auteur: currentUser.nom, date: serverTimestamp() });
    alert("BOLO lancé !");
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
    alert("Civil enregistré.");
};

// --- TEMPS RÉEL ---

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = ""; pZone.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}; font-weight:bold; margin-bottom:10px;">● [${u.matricule}] ${u.grade} ${u.nom}</div>`;
            if(u.panic) pZone.innerHTML += `<div class="panic-banner">🚨 ALERTE PANIQUE : ${u.grade.toUpperCase()} ${u.nom.toUpperCase()} EN DANGER ! 🚨</div>`;
        });
    });

    onSnapshot(collection(db, "markers"), (snap) => {
        const map = document.getElementById('tactical-map');
        map.querySelectorAll('.map-marker').forEach(m => m.remove());
        snap.forEach(d => {
            const m = d.data();
            const marker = document.createElement('div');
            marker.className = 'map-marker';
            marker.style.left = `${m.x}%`; marker.style.top = `${m.y}%`;
            marker.oncontextmenu = (e) => { e.preventDefault(); deleteMarker(d.id); };
            marker.innerHTML = `<div class="marker-label">${m.label.toUpperCase()}</div>`;
            map.appendChild(marker);
        });
    });

    onSnapshot(query(collection(db, "reports"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-reports');
        list.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            list.innerHTML += `<div class="card"><strong>${r.titre}</strong><p>${r.contenu}</p><small>Par: ${r.auteur}</small></div>`;
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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, deleteDoc, orderBy, serverTimestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value;
    const n = document.getElementById('reg-nom').value;
    const m = document.getElementById('reg-mat').value;
    const ps = document.getElementById('reg-pass').value;
    if(!p || !n || !m || !ps) return alert("Champs vides");
    await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, mdp: ps, grade: "Officier I", en_service: false, statut: "en_attente", panic: false });
    alert("Demande envoyée !"); window.toggleRegister(false);
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const u = snap.docs[0].data();
        if (u.statut === "en_attente") return alert("Compte non validé par la direction.");
        currentUser = u; currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${u.prenom} ${u.nom}`;
        document.getElementById('display-rank').innerText = u.grade;
        setupPermissions(u.grade.toLowerCase());
        initRealtime();
    } else alert("Matricule ou mot de passe incorrect.");
};

function setupPermissions(grade) {
    const isAdmin = grade.includes("commander") || grade.includes("lieutenant") || grade.includes("sergent");
    if(isAdmin) {
        document.getElementById('form-annonce').style.display = 'block';
        document.getElementById('form-sasp').style.display = 'block';
    }
}

window.addNewAgent = async () => {
    const p = document.getElementById('new-prenom').value;
    const n = document.getElementById('new-nom').value;
    const m = document.getElementById('new-mat').value;
    const g = document.getElementById('new-grade').value;
    if(p && n && m) {
        await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, grade: g, mdp: "1234", statut: "valide", en_service: false, panic: false });
        alert("Agent ajouté avec succès !");
        document.getElementById('new-prenom').value = ""; document.getElementById('new-nom').value = ""; document.getElementById('new-mat').value = "";
    }
};

window.toggleService = async () => {
    if(!currentUser) return;
    const btn = document.getElementById('service-btn');
    const isNowInService = btn.innerText === "HORS SERVICE";
    btn.innerText = isNowInService ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isNowInService ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNowInService });
};

// ... Les fonctions addCivil, addCasier, addBolo et triggerPanic restent les mêmes que précédemment ...
window.triggerPanic = async () => {
    const isPanic = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: isPanic });
    currentUser.panic = isPanic;
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, tel: document.getElementById('civ-tel').value, naissance: document.getElementById('civ-naiss').value, casier: [] });
    alert("Civil ajouté !");
};

window.addCasier = async (id) => {
    const crime = prompt("Entrez le délit :");
    if(crime) await updateDoc(doc(db, "civils", id), { casier: arrayUnion(`${new Date().toLocaleDateString()} - ${crime}`) });
};

window.addBolo = async () => {
    const s = document.getElementById('bolo-sujet').value;
    const r = document.getElementById('bolo-raison').value;
    if(s) await addDoc(collection(db, "bolo"), { sujet: s, raison: r, auteur: currentUser.nom, date: serverTimestamp() });
};

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const sasp = document.getElementById('list-sasp');
        const panicAlert = document.getElementById('panic-alert');
        units.innerHTML = ""; sasp.innerHTML = ""; panicAlert.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}">● [${u.matricule}] ${u.nom} ${u.panic ? '!!! PANIC !!!' : ''}</div>`;
            if(u.panic) panicAlert.innerHTML += `<div class="panic-active">⚠️ ALERTE PANIC : OFFICIER ${u.nom.toUpperCase()} EN DANGER !</div>`;
            if(u.statut === "valide") sasp.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br>${u.grade}</div>`;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens'); cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            let crimes = c.casier ? c.casier.map(m => `<div>• ${m}</div>`).join('') : "Aucun";
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><div class="casier-list">${crimes}</div><button onclick="window.addCasier('${d.id}')" style="margin-top:10px; font-size:0.7rem;">+ CRIMES</button></div>`;
        });
    });

    onSnapshot(query(collection(db, "bolo"), orderBy("date", "desc")), (snap) => {
        const dash = document.getElementById('dash-bolo'); dash.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            dash.innerHTML += `<div class="card" style="border-left:4px solid gold"><strong>${b.sujet}</strong><br>${b.raison}</div>`;
        });
    });
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

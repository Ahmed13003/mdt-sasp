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
        document.getElementById('display-name').innerText = `OFFICIER : ${currentUser.nom}`;
        if(currentUser.grade.toLowerCase().includes("commander") || currentUser.grade.toLowerCase().includes("sergent")) {
            document.getElementById('form-sasp').style.display = 'block';
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

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
    alert("Civil ajouté !");
};

window.addBolo = async () => {
    const s = document.getElementById('bolo-sujet').value;
    const r = document.getElementById('bolo-raison').value;
    if(s && r) await addDoc(collection(db, "bolo"), { sujet: s, raison: r, auteur: currentUser.nom, date: serverTimestamp() });
    alert("BOLO publié !");
};

window.deleteBolo = async (id) => {
    if(confirm("Supprimer ?")) await deleteDoc(doc(db, "bolo", id));
};

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const sasp = document.getElementById('list-sasp');
        units.innerHTML = ""; sasp.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:#00ff00;">● [${u.matricule}] ${u.nom}</div>`;
            if(u.statut === "valide") sasp.innerHTML += `<div class="card"><strong>${u.prenom} ${u.nom}</strong><br>${u.grade}</div>`;
        });
    });

    onSnapshot(query(collection(db, "bolo"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-bolo');
        const dash = document.getElementById('dash-bolo');
        list.innerHTML = ""; dash.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            const h = `<div class="card" style="border-left:5px solid gold;"><strong>⚠️ ${b.sujet}</strong><p>${b.raison}</p><button onclick="deleteBolo('${d.id}')" style="background:red; color:white; padding:5px; margin-top:10px;">X</button></div>`;
            list.innerHTML += h; dash.innerHTML += h;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens'); cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong></div>`;
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

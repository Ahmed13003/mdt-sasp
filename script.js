import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy, serverTimestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        const userDoc = snap.docs[0];
        currentUser = userDoc.data();
        currentUser.id = userDoc.id;
        if (currentUser.statut === "en_attente") return alert("Compte non validé.");
        
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
        document.getElementById('display-rank').innerText = currentUser.grade;
        
        const g = currentUser.grade.toLowerCase();
        if(g.includes("commander") || g.includes("lieutenant") || g.includes("sergent")) {
            document.getElementById('form-sasp').style.display = 'block';
        }
        initRealtime();
    } else alert("Erreur.");
};

window.toggleService = async () => {
    if(!currentUser) return;
    const btn = document.getElementById('service-btn');
    const isNowInService = btn.innerText === "HORS SERVICE";
    
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNowInService });
    btn.innerText = isNowInService ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isNowInService ? "service-status active" : "service-status";
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
    alert("Ajouté !");
};

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const sasp = document.getElementById('list-sasp');
        units.innerHTML = ""; sasp.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:#00ff00; margin-bottom:10px;">● [${u.matricule}] ${u.nom}</div>`;
            if(u.statut === "valide") sasp.innerHTML += `<div class="card"><strong>${u.prenom} ${u.nom}</strong><br>${u.grade}</div>`;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens'); cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><br>Casier: ${c.casier.length} délits</div>`;
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

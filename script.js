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

// CONNEXION CORRIGÉE
window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    
    try {
        const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const userDoc = snap.docs[0];
            currentUser = userDoc.data();
            currentUser.id = userDoc.id; // On récupère bien l'ID pour le service

            if (currentUser.statut === "en_attente") return alert("Compte en attente.");

            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('mdt-app').style.display = 'flex';
            document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
            document.getElementById('display-rank').innerText = currentUser.grade;
            
            // Permissions
            const g = currentUser.grade.toLowerCase();
            if(g.includes("commander") || g.includes("lieutenant") || g.includes("sergent")) {
                if(document.getElementById('form-sasp')) document.getElementById('form-sasp').style.display = 'block';
                if(document.getElementById('form-annonce')) document.getElementById('form-annonce').style.display = 'block';
            }
            initRealtime();
        } else {
            alert("Matricule ou MDP incorrect.");
        }
    } catch (e) { console.error("Erreur login:", e); }
};

// SERVICE CORRIGÉ
window.toggleService = async () => {
    if (!currentUser || !currentUser.id) return alert("Erreur : Utilisateur non identifié.");
    
    const btn = document.getElementById('service-btn');
    const isNowInService = btn.innerText === "HORS SERVICE";
    
    try {
        const userRef = doc(db, "users", currentUser.id);
        await updateDoc(userRef, { en_service: isNowInService });
        
        btn.innerText = isNowInService ? "EN SERVICE" : "HORS SERVICE";
        btn.className = isNowInService ? "service-status active" : "service-status";
        currentUser.en_service = isNowInService;
    } catch (e) {
        console.error("Erreur service:", e);
        alert("Impossible de changer le service dans la base de données.");
    }
};

// RESTE DU SCRIPT
window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value;
    const n = document.getElementById('reg-nom').value;
    const m = document.getElementById('reg-mat').value;
    const ps = document.getElementById('reg-pass').value;
    await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, mdp: ps, grade: "Officier I", en_service: false, statut: "en_attente", panic: false });
    alert("Demande envoyée !"); window.toggleRegister(false);
};

window.triggerPanic = async () => {
    if (!currentUser.id) return;
    currentUser.panic = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: currentUser.panic });
};

function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const sasp = document.getElementById('list-sasp');
        units.innerHTML = ""; sasp.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}">● [${u.matricule}] ${u.nom}</div>`;
            if(u.statut === "valide") sasp.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br>${u.grade}</div>`;
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

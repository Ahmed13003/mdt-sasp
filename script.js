import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// CONNEXION
window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    try {
        const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
        const snap = await getDocs(q);
        if (!snap.empty) {
            currentUser = snap.docs[0].data();
            currentUser.id = snap.docs[0].id;
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('mdt-app').style.display = 'flex';
            document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
            document.getElementById('display-rank').innerText = currentUser.grade;
            setupPermissions();
            listenUnits();
        } else { alert("Matricule ou MDP incorrect !"); }
    } catch (e) { console.error("Erreur login:", e); }
};

// PERMISSIONS (Affiche les boutons selon le grade)
function setupPermissions() {
    const g = currentUser.grade.toLowerCase();
    // Les gradés voient le formulaire "Most Wanted"
    if (g.includes("sergent") || g.includes("commander") || g.includes("lieutenant")) {
        document.getElementById('form-wanted').style.display = 'block';
    }
    // Seul le Commander peut recruter
    if (g.includes("commander")) {
        document.getElementById('form-sasp').style.display = 'block';
    }
}

// UNITÉS EN DIRECT (DASHBOARD)
function listenUnits() {
    const q = query(collection(db, "users"), where("en_service", "==", true));
    onSnapshot(q, (snap) => {
        const container = document.getElementById('list-units');
        container.innerHTML = "";
        if(snap.empty) container.innerHTML = "<p style='color:gray;'>Aucune unité en service.</p>";
        snap.forEach(d => {
            const u = d.data();
            container.innerHTML += `<div style="padding:10px; border-bottom:1px solid #222; color:#00ff00; font-weight:bold;">● [${u.matricule}] ${u.prenom} ${u.nom}</div>`;
        });
    });
}

// CHANGER D'ETAT DE SERVICE
window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
};

// RECRUTEMENT D'AGENT
window.addNewAgent = async () => {
    const p = document.getElementById('new-prenom').value;
    const n = document.getElementById('new-nom').value;
    const m = document.getElementById('new-mat').value;
    const g = document.getElementById('new-grade').value;
    if(!p || !n || !m) return alert("Veuillez remplir les informations !");
    
    await addDoc(collection(db, "users"), {
        prenom: p, nom: n, matricule: m, grade: g,
        mdp: "1234", statut: "valide", en_service: false
    });
    alert("Agent ajouté avec succès !");
    // Vide les champs
    document.getElementById('new-prenom').value = ""; document.getElementById('new-nom').value = "";
    document.getElementById('new-mat').value = ""; document.getElementById('new-grade').value = "";
};

// NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

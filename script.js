import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// --- NAVIGATION ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

// --- CONNEXION ---
window.checkLogin = async () => {
    const id = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", id), where("mdp", "==", pass));
    const snap = await getDocs(q);

    if (!snap.empty) {
        currentUser = snap.docs[0].data();
        currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
        document.getElementById('display-rank').innerText = currentUser.grade;
        loadAll();
    } else { alert("Identifiants incorrects"); }
};

// --- RAPPORTS ET SAISIES ---
window.addRapport = async () => {
    const rapport = {
        date: document.getElementById('ra-date').value,
        agents: document.getElementById('ra-agents').value,
        incident: document.getElementById('ra-incident').value,
        procedure: document.getElementById('ra-procedure').value,
        saisie: document.getElementById('ra-saisie').value,
        timestamp: new Date()
    };
    await addDoc(collection(db, "rapports"), rapport);
    alert("Rapport archivé !");
    loadRapports();
};

// --- CHARGEMENT DYNAMIQUE ---
async function loadRapports() {
    const snap = await getDocs(query(collection(db, "rapports"), orderBy("timestamp", "desc")));
    const container = document.getElementById('list-rapports');
    container.innerHTML = "";
    snap.forEach(d => {
        const r = d.data();
        container.innerHTML += `
            <div class="card">
                <p><b>DATE :</b> ${r.date}</p>
                <p><b>AGENTS :</b> ${r.agents}</p>
                <p><b>INCIDENT :</b> ${r.incident}</p>
                <hr style="margin:10px 0; border:0.5px solid rgba(255,255,255,0.1)">
                <p style="color:#00d2ff"><b>OBJETS SAISIS :</b> ${r.saisie || 'Aucune saisie'}</p>
            </div>`;
    });
}

// Lancer le chargement
function loadAll() {
    loadRapports();
    // Ajoute ici tes autres fonctions (loadCitoyens, etc.)
}

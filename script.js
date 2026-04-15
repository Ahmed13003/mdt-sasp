document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
            document.getElementById(item.getAttribute('data-page')).style.display = 'block';
        });
    });
});

window.setupPermissions = (user) => {
    const g = user.grade.toLowerCase();
    if (g.includes("sergent") || g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
        document.getElementById('nav-wanted').style.display = 'flex';
    }
    if (g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
        document.getElementById('nav-admin').style.display = 'flex';
    }
};

window.loadData = async () => {
    const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    // Charger Citoyens
    const citSnap = await getDocs(collection(window.db, "citoyens"));
    const citDiv = document.getElementById('list-citoyens');
    citDiv.innerHTML = "<h3>Liste des Citoyens</h3>";
    citSnap.forEach(d => {
        const data = d.data();
        citDiv.innerHTML += `<div class="data-item">${data.nom} - Tel: ${data.tel} <button class="btn-delete" onclick="deleteEntry('citoyens', '${d.id}')">X</button></div>`;
    });

    // Charger Véhicules
    const vehSnap = await getDocs(collection(window.db, "vehicules"));
    const vehDiv = document.getElementById('list-vehicules');
    vehDiv.innerHTML = "<h3>Liste des Véhicules</h3>";
    vehSnap.forEach(d => {
        const data = d.data();
        vehDiv.innerHTML += `<div class="data-item">Plaque: ${data.plaque} - Modèle: ${data.modele} <button class="btn-delete" onclick="deleteEntry('vehicules', '${d.id}')">X</button></div>`;
    });
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// --- CONNEXION ---
window.checkLogin = async () => {
    const id = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", id), where("mdp", "==", pass));
    const snap = await getDocs(q);

    if (!snap.empty) {
        currentUser = snap.docs[0].data();
        currentUser.id = snap.docs[0].id;
        if (currentUser.statut === "valide") {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('mdt-app').style.display = 'flex';
            document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
            document.getElementById('display-rank').innerText = currentUser.grade;
            
            // Perm Sergent+
            const g = currentUser.grade.toLowerCase();
            if(g.includes("sergent") || g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
                document.getElementById('wanted-form').style.display = 'block';
            }
            loadAll();
        }
    }
};

// --- PRISE DE SERVICE ---
window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
    loadOnDuty();
};

// --- CHARGEMENT DES DONNÉES ---
async function loadAll() {
    loadWanted();
    loadOnDuty();
    loadSASP();
    loadCitoyens();
}

window.addCitoyen = async () => {
    await addDoc(collection(db, "citoyens"), {
        nom: document.getElementById('cit-nom').value,
        photo: document.getElementById('cit-photo').value || "https://i.imgur.com/8K9pX6F.png",
        adresse: document.getElementById('cit-adresse').value,
        job: document.getElementById('cit-job').value,
        groupe: document.getElementById('cit-groupe').value
    });
    loadCitoyens();
};

async function loadSASP() {
    const snap = await getDocs(collection(db, "users"));
    const container = document.getElementById('list-sasp');
    container.innerHTML = "";
    snap.forEach(d => {
        const u = d.data();
        container.innerHTML += `
            <div class="identity-card">
                <img src="${u.photo || 'https://i.imgur.com/8K9pX6F.png'}">
                <p><b>${u.prenom} ${u.nom}</b></p>
                <p class="rank">${u.grade} - #${u.matricule}</p>
                <p>Tel: ${u.tel || 'N/A'}</p>
            </div>`;
    });
}

// (Les autres fonctions comme addWanted, addRapport suivent la même logique Firebase)

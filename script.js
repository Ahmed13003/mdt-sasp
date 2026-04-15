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

// NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

// CONNEXION
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
            document.getElementById('display-name').innerText = currentUser.prenom + " " + currentUser.nom;
            document.getElementById('display-rank').innerText = currentUser.grade;
            setupPermissions();
            loadAnnonces();
        } else { alert("Accès non validé."); }
    } else { alert("Matricule ou MDP incorrect."); }
};

// SERVICE
window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
};

// ANNONCES
window.addAnnonce = async () => {
    const data = {
        titre: document.getElementById('ann-titre').value,
        message: document.getElementById('ann-texte').value,
        auteur: currentUser.prenom + " " + currentUser.nom,
        timestamp: new Date()
    };
    await addDoc(collection(db, "annonces"), data);
    document.getElementById('ann-titre').value = "";
    document.getElementById('ann-texte').value = "";
    loadAnnonces();
};

window.loadAnnonces = async () => {
    const q = query(collection(db, "annonces"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const container = document.getElementById('list-annonces');
    container.innerHTML = "";
    snap.forEach(d => {
        const a = d.data();
        container.innerHTML += `<div class="card" style="border-left:4px solid var(--accent)">
            <h3 style="color:var(--accent)">${a.titre}</h3>
            <p>${a.message}</p>
            <small>Par ${a.auteur}</small>
        </div>`;
    });
};

function setupPermissions() {
    const g = currentUser.grade.toLowerCase();
    if (g.includes("sergent") || g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
        document.getElementById('form-annonce').style.display = 'block';
    }
}

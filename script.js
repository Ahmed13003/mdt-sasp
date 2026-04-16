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

// SYSTÈME DE CONNEXION
window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const u = snap.docs[0].data();
        if (u.statut === "en_attente") return alert("Accès refusé : Votre compte est en attente de validation.");
        
        currentUser = u;
        currentUser.id = snap.docs[0].id;
        
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${u.prenom} ${u.nom}`;
        document.getElementById('display-rank').innerText = u.grade;
        
        // Droits d'administration pour Effectif et Annonces
        const rank = u.grade.toLowerCase();
        if(rank.includes("commander") || rank.includes("lieutenant") || rank.includes("sergent")) {
            document.getElementById('form-sasp').style.display = 'block';
            document.getElementById('form-annonce').style.display = 'block';
        }
        
        initRealtime();
    } else {
        alert("Identifiants incorrects.");
    }
};

// GESTION DU SERVICE (FIXÉ)
window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isNowInService = btn.innerText === "HORS SERVICE";
    
    btn.innerText = isNowInService ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isNowInService ? "service-status active" : "service-status";
    
    await updateDoc(doc(db, "users", currentUser.id), { 
        en_service: isNowInService,
        last_update: serverTimestamp() 
    });
};

// AJOUTER UN AGENT (EFFECTIF)
window.addNewAgent = async () => {
    const p = document.getElementById('new-prenom').value;
    const n = document.getElementById('new-nom').value;
    const m = document.getElementById('new-mat').value;
    const g = document.getElementById('new-grade').value;
    
    if(p && n && m) {
        await addDoc(collection(db, "users"), {
            prenom: p, nom: n, matricule: m, grade: g,
            mdp: "1234", statut: "valide", en_service: false, panic: false
        });
        alert("Agent ajouté au système.");
        document.getElementById('new-prenom').value = ""; 
        document.getElementById('new-nom').value = "";
    }
};

// ... (Garder les fonctions addCivil, addCasier, addBolo du message précédent) ...

function initRealtime() {
    // Liste des agents et Panique
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const sasp = document.getElementById('list-sasp');
        units.innerHTML = ""; sasp.innerHTML = "";
        
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) {
                units.innerHTML += `<div style="color:${u.panic ? 'red' : '#00ff00'}">● [${u.matricule}] ${u.nom}</div>`;
            }
            if(u.statut === "valide") {
                sasp.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br>${u.grade}</div>`;
            }
        });
    });

    // Civils et Casier
    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens'); cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            const listCrimes = c.casier ? c.casier.map(m => `<div>• ${m}</div>`).join('') : "Vierge";
            cont.innerHTML += `<div class="card">
                <strong>${c.prenom} ${c.nom}</strong>
                <div class="casier-list">${listCrimes}</div>
                <button onclick="window.addCasier('${d.id}')" style="margin-top:10px; font-size:0.7rem;">+ CRIMES</button>
            </div>`;
        });
    });
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

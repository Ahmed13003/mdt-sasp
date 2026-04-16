import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    
    try {
        const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const userDoc = snap.docs[0];
            currentUser = userDoc.data();
            currentUser.id = userDoc.id;
            
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('mdt-app').style.display = 'flex';
            document.getElementById('display-name').innerText = `${currentUser.prenom} ${currentUser.nom}`;
            document.getElementById('display-rank').innerText = currentUser.grade;
            
            setupPermissions();
            startMDT();
        } else {
            alert("Accès refusé : Matricule ou MDP erroné.");
        }
    } catch (e) {
        console.error(e);
        alert("Erreur de liaison avec la base de données.");
    }
};

function setupPermissions() {
    const g = currentUser.grade.toLowerCase();
    // Sergent et + peuvent faire des annonces
    if (g.includes("sergent") || g.includes("commander") || g.includes("lieutenant")) {
        document.getElementById('form-annonce').style.display = 'block';
    }
    // Seul le Commander peut recruter
    if (g.includes("commander")) {
        document.getElementById('form-sasp').style.display = 'block';
    }
}

function startMDT() {
    // Unités en direct
    onSnapshot(query(collection(db, "users"), where("en_service", "==", true)), (snap) => {
        const cont = document.getElementById('list-units');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div style="color:#00ff00; padding:8px; border-bottom:1px solid #111;">● [${u.matricule}] ${u.prenom} ${u.nom}</div>`;
        });
    });

    // Annonces en direct
    onSnapshot(query(collection(db, "annonces"), orderBy("date", "desc")), (snap) => {
        const cont = document.getElementById('list-annonces');
        cont.innerHTML = "";
        snap.forEach(d => {
            const a = d.data();
            const g = currentUser.grade.toLowerCase();
            const canDel = g.includes("sergent") || g.includes("commander") || g.includes("lieutenant");
            cont.innerHTML += `
                <div class="card" style="border-left:4px solid var(--accent)">
                    <h4>${a.titre}</h4><p>${a.texte}</p><small>Par ${a.auteur}</small><br>
                    ${canDel ? `<button class="btn-delete" onclick="window.delDoc('annonces','${d.id}')">SUPPRIMER</button>` : ''}
                </div>`;
        });
    });

    // Civils en direct
    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens');
        cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><br>Tel: ${c.tel}<br>Né le: ${c.naissance}</div>`;
        });
    });

    // Effectif en direct
    onSnapshot(collection(db, "users"), (snap) => {
        const cont = document.getElementById('list-sasp');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br><span style="color:var(--accent)">${u.grade}</span></div>`;
        });
    });
}

// FONCTIONS D'ACTION
window.addAnnonce = async () => {
    const t = document.getElementById('ann-titre').value;
    const m = document.getElementById('ann-texte').value;
    if(t && m) await addDoc(collection(db, "annonces"), { titre: t, texte: m, auteur: currentUser.prenom, date: new Date() });
    document.getElementById('ann-titre').value = ""; document.getElementById('ann-texte').value = "";
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    const t = document.getElementById('civ-tel').value;
    const na = document.getElementById('civ-naiss').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, tel: t, naissance: na });
    alert("Civil enregistré avec succès !");
    document.getElementById('civ-prenom').value = ""; document.getElementById('civ-nom').value = "";
};

window.addNewAgent = async () => {
    const p = document.getElementById('new-prenom').value;
    const n = document.getElementById('new-nom').value;
    const m = document.getElementById('new-mat').value;
    const g = document.getElementById('new-grade').value;
    await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, grade: g, mdp: "1234", statut: "valide", en_service: false });
    alert("Agent intégré à la base !");
};

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
};

window.delDoc = async (coll, id) => {
    if(confirm("Confirmer la suppression ?")) await deleteDoc(doc(db, coll, id));
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

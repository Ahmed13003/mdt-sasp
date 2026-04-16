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

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
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
            initRealtime();
        } else { alert("Matricule ou MDP incorrect."); }
    } catch (e) { console.error(e); }
};

function setupPermissions() {
    const g = currentUser.grade.toLowerCase();
    if (g.includes("sergent") || g.includes("commander") || g.includes("lieutenant")) {
        document.getElementById('form-annonce').style.display = 'block';
    }
    if (g.includes("commander")) {
        document.getElementById('form-sasp').style.display = 'block';
    }
}

function initRealtime() {
    onSnapshot(query(collection(db, "users"), where("en_service", "==", true)), (snap) => {
        const cont = document.getElementById('list-units');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div style="color:#00ff00; padding:5px;">● [${u.matricule}] ${u.prenom} ${u.nom}</div>`;
        });
    });

    onSnapshot(query(collection(db, "annonces"), orderBy("date", "desc")), (snap) => {
        const cont = document.getElementById('list-annonces');
        cont.innerHTML = "";
        snap.forEach(d => {
            const a = d.data();
            const g = currentUser.grade.toLowerCase();
            const canDel = g.includes("sergent") || g.includes("commander") || g.includes("lieutenant");
            cont.innerHTML += `<div class="card" style="border-left:4px solid var(--accent)">
                <h4>${a.titre}</h4><p>${a.texte}</p><small>Par ${a.auteur}</small><br>
                ${canDel ? `<button class="btn-del" onclick="window.delDoc('annonces','${d.id}')">SUPPRIMER</button>` : ''}
            </div>`;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens');
        cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><br>Tel: ${c.tel} | Né: ${c.naissance}</div>`;
        });
    });

    onSnapshot(collection(db, "users"), (snap) => {
        const cont = document.getElementById('list-sasp');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br><span style="color:var(--accent)">${u.grade}</span></div>`;
        });
    });
}

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
    const d = document.getElementById('civ-naiss').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, tel: t, naissance: d });
    alert("Civil enregistré !");
};

window.addNewAgent = async () => {
    const p = document.getElementById('new-prenom').value;
    const n = document.getElementById('new-nom').value;
    const m = document.getElementById('new-mat').value;
    const g = document.getElementById('new-grade').value;
    await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, grade: g, mdp: "1234", statut: "valide", en_service: false });
    alert("Agent ajouté !");
};

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
};

window.delDoc = async (coll, id) => {
    if(confirm("Supprimer ?")) await deleteDoc(doc(db, coll, id));
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});
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

// GESTION DE L'AFFICHAGE INSCRIPTION
window.toggleRegister = (show) => {
    document.getElementById('auth-fields').style.display = show ? 'none' : 'block';
    document.getElementById('register-fields').style.display = show ? 'block' : 'none';
};

// CRÉATION DE COMPTE (AUTO-INSCRIPTION)
window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value.trim();
    const n = document.getElementById('reg-nom').value.trim();
    const m = document.getElementById('reg-mat').value.trim();
    const ps = document.getElementById('reg-pass').value.trim();

    if(!p || !n || !m || !ps) return alert("Remplis tous les champs !");

    try {
        await addDoc(collection(db, "users"), {
            prenom: p, nom: n, matricule: m, mdp: ps,
            grade: "Officier I", en_service: false, statut: "valide"
        });
        alert("Compte créé ! Tu peux maintenant te connecter.");
        window.toggleRegister(false);
    } catch (e) { alert("Erreur lors de la création."); }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
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
            initRealtime();
        } else { alert("Matricule ou MDP incorrect."); }
    } catch (e) { console.error(e); }
};

function setupPermissions() {
    const g = currentUser.grade.toLowerCase();
    if (g.includes("sergent") || g.includes("commander") || g.includes("lieutenant")) {
        document.getElementById('form-annonce').style.display = 'block';
    }
}

function initRealtime() {
    onSnapshot(query(collection(db, "users"), where("en_service", "==", true)), (snap) => {
        const cont = document.getElementById('list-units');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div style="color:#00ff00; padding:5px;">● [${u.matricule}] ${u.prenom} ${u.nom}</div>`;
        });
    });

    onSnapshot(query(collection(db, "annonces"), orderBy("date", "desc")), (snap) => {
        const cont = document.getElementById('list-annonces');
        cont.innerHTML = "";
        snap.forEach(d => {
            const a = d.data();
            const g = currentUser.grade.toLowerCase();
            const canDel = g.includes("sergent") || g.includes("commander") || g.includes("lieutenant");
            cont.innerHTML += `<div class="card" style="border-left:4px solid var(--accent)">
                <h4>${a.titre}</h4><p>${a.texte}</p><small>Par ${a.auteur}</small><br>
                ${canDel ? `<button class="btn-del" onclick="window.delDoc('annonces','${d.id}')">SUPPRIMER</button>` : ''}
            </div>`;
        });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const cont = document.getElementById('list-citoyens');
        cont.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            cont.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><br>Tel: ${c.tel} | Né: ${c.naissance}</div>`;
        });
    });

    onSnapshot(collection(db, "users"), (snap) => {
        const cont = document.getElementById('list-sasp');
        cont.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            cont.innerHTML += `<div class="card"><strong>[${u.matricule}] ${u.prenom} ${u.nom}</strong><br><span style="color:var(--accent)">${u.grade}</span></div>`;
        });
    });
}

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
    const d = document.getElementById('civ-naiss').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, tel: t, naissance: d });
    alert("Civil enregistré !");
};

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isOff = btn.innerText === "HORS SERVICE";
    btn.innerText = isOff ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isOff ? "service-status active" : "service-status";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isOff });
};

window.delDoc = async (coll, id) => {
    if(confirm("Supprimer ?")) await deleteDoc(doc(db, coll, id));
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

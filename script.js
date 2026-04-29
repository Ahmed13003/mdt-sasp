import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvBTVTYSuFjHjMiZYGiFFN4yviglcXDB4",
    authDomain: "mdt-onlinerp.firebaseapp.com",
    projectId: "mdt-onlinerp",
    storageBucket: "mdt-onlinerp.firebasestorage.app",
    appId: "1:102349354657:web:7085e7db36adec678d22e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = null;

// --- AUTH ---
window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const data = {
        prenom: document.getElementById('reg-prenom').value,
        nom: document.getElementById('reg-nom').value,
        grade: document.getElementById('reg-grad').value,
        tel: document.getElementById('reg-tel').value,
        matricule: document.getElementById('reg-mat').value,
        mdp: document.getElementById('reg-pass').value,
        en_service: false, panic: false, patrouille: ""
    };
    if(data.nom && data.matricule && data.mdp) {
        await addDoc(collection(db, "users"), data);
        alert("Agent enregistré !"); toggleRegister(false);
    }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const ps = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", ps));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data(); currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = currentUser.nom;
        document.getElementById('display-grade').innerText = currentUser.grade;
        initRealtime();
    } else alert("Erreur d'identification.");
};

// --- ÉTATS ---
window.toggleService = async () => {
    const isS = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isS });
    document.getElementById('service-btn').innerText = isS ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isS ? "status-btn on" : "status-btn off";
};

window.triggerPanic = async () => {
    const p = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: p });
    currentUser.panic = p;
};

window.updatePatrouille = async (id, val) => {
    await updateDoc(doc(db, "users", id), { patrouille: val });
};

// --- AJOUTS ---
window.addBolo = async () => {
    const s = document.getElementById('bolo-sujet').value;
    const r = document.getElementById('bolo-raison').value;
    if(s && r) await addDoc(collection(db, "bolos"), { sujet: s, raison: r, auteur: currentUser.nom });
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
};

window.addCrime = async (id) => {
    const crime = prompt("Infraction à ajouter :");
    if(crime) {
        const snap = await getDocs(query(collection(db, "civils"), where("__name__", "==", id)));
        let list = snap.docs[0].data().casier || [];
        list.push(crime);
        await updateDoc(doc(db, "civils", id), { casier: list });
    }
};

// --- REALTIME ---
function initRealtime() {
    onSnapshot(collection(db, "users"), (snap) => {
        const dL = document.getElementById('list-units');
        const eL = document.getElementById('list-effectifs');
        const pZ = document.getElementById('panic-zone');
        dL.innerHTML = ""; eL.innerHTML = ""; pZ.innerHTML = "";
        
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) {
                dL.innerHTML += `<div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>[${u.matricule}] ${u.grade} ${u.nom}</span>
                    <input type="text" value="${u.patrouille || ''}" placeholder="Patrouille" onchange="updatePatrouille('${d.id}', this.value)" style="width:100px; margin:0; font-size:12px;">
                </div>`;
            }
            eL.innerHTML += `<div class="card"><b>${u.grade} ${u.nom}</b><br><small>Mat: ${u.matricule} | Tel: ${u.tel || 'N/A'}</small></div>`;
            if(u.panic) pZ.innerHTML += `<div style="background:red; color:white; padding:15px; text-align:center; font-weight:bold; border:2px solid white; margin-bottom:20px;">🚨 PANIC: [${u.matricule}] ${u.nom} 🚨</div>`;
        });
    });

    onSnapshot(collection(db, "bolos"), (snap) => {
        const list = document.getElementById('list-bolo'); list.innerHTML = "";
        snap.forEach(d => { list.innerHTML += `<div class="card" style="border-left:5px solid red;"><b>${d.data().sujet}</b><br>${d.data().raison}</div>`; });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens'); list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            let crimes = (c.casier || []).map(t => `<span style="background:red; padding:2px 5px; font-size:10px; margin:2px; border-radius:3px;">${t}</span>`).join(' ');
            list.innerHTML += `<div class="card"><b>${c.prenom} ${c.nom}</b><br><div style="margin:10px 0;">${crimes || 'Casier Vierge'}</div><button onclick="addCrime('${d.id}')" style="font-size:10px; padding:4px;">+ CRIME</button></div>`;
        });
    });
}

// NAV
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

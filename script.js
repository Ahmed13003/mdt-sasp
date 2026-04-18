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

// --- AUTHENTIFICATION ---
window.toggleRegister = (show) => {
    document.getElementById('auth-fields').style.display = show ? 'none' : 'block';
    document.getElementById('register-fields').style.display = show ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value;
    const n = document.getElementById('reg-nom').value;
    const g = document.getElementById('reg-grad').value;
    const t = document.getElementById('reg-tel').value;
    const m = document.getElementById('reg-mat').value;
    const ps = document.getElementById('reg-pass').value;

    if(p && n && g && m && ps) {
        await addDoc(collection(db, "users"), { 
            prenom: p, nom: n, grade: g, tel: t, matricule: m, mdp: ps, 
            en_service: false, panic: false, patrouille: "" 
        });
        alert("Enregistré !"); toggleRegister(false);
    }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data(); currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = currentUser.nom;
        document.getElementById('display-grade').innerText = currentUser.grade;
        initRealtime();
    } else { alert("Identifiants incorrects."); }
};

// --- ACTIONS DISPATCH ---
window.toggleService = async () => {
    const isNow = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    document.getElementById('service-btn').innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isNow ? "status-btn on" : "status-btn off";
};

window.triggerPanic = async () => {
    await updateDoc(doc(db, "users", currentUser.id), { panic: !currentUser.panic });
};

window.updatePatrouille = async (id, val) => {
    await updateDoc(doc(db, "users", id), { patrouille: val });
};

// --- AJOUTS (BOLO / CIVIL) ---
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
    const crime = prompt("Infraction :");
    if(crime) {
        const snap = await getDocs(query(collection(db, "civils"), where("__name__", "==", id)));
        let list = snap.docs[0].data().casier || [];
        list.push(crime);
        await updateDoc(doc(db, "civils", id), { casier: list });
    }
};

// --- TEMPS RÉEL ---
function initRealtime() {
    // Agents (Dispatch + Panic + Effectifs)
    onSnapshot(collection(db, "users"), (snap) => {
        const listUnits = document.getElementById('list-units');
        const listEffectifs = document.getElementById('list-effectifs');
        const panicZone = document.getElementById('panic-zone');
        listUnits.innerHTML = ""; listEffectifs.innerHTML = ""; panicZone.innerHTML = "";
        
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) {
                listUnits.innerHTML += `<div class="card">
                    <b>[${u.matricule}] ${u.grade} ${u.nom}</b>
                    <input type="text" value="${u.patrouille || ''}" placeholder="Patrouille" onchange="updatePatrouille('${d.id}', this.value)">
                </div>`;
            }
            listEffectifs.innerHTML += `<div class="card">${u.grade} ${u.nom} (${u.matricule})</div>`;
            if(u.panic) panicZone.innerHTML += `<div class="card" style="border:2px solid red; color:red;">🚨 PANIC: ${u.nom}</div>`;
        });
    });

    // BOLO & Civils
    onSnapshot(collection(db, "bolos"), (snap) => {
        const list = document.getElementById('list-bolo'); list.innerHTML = "";
        snap.forEach(d => { list.innerHTML += `<div class="card">${d.data().sujet} : ${d.data().raison}</div>`; });
    });

    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens'); list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            list.innerHTML += `<div class="card">${c.prenom} ${c.nom} <button onclick="addCrime('${d.id}')">+ Crime</button></div>`;
        });
    });
}

// NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

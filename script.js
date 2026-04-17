import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.toggleRegister = (show) => {
    document.getElementById('auth-fields').style.display = show ? 'none' : 'block';
    document.getElementById('register-fields').style.display = show ? 'block' : 'none';
};

window.handleRegister = async () => {
    const fields = ['reg-prenom', 'reg-nom', 'reg-grad', 'reg-tel', 'reg-mat', 'reg-pass'];
    const data = {};
    fields.forEach(f => data[f.split('-')[1]] = document.getElementById(f).value);
    
    if(Object.values(data).every(v => v !== "")) {
        await addDoc(collection(db, "users"), { ...data, en_service: false, panic: false });
        alert("Compte créé et ajouté aux effectifs !");
        toggleRegister(false);
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
        document.getElementById('display-name').innerHTML = `<small>${currentUser.grade}</small><br>${currentUser.nom}`;
        initRealtime();
    }
};

window.toggleService = async () => {
    const isNow = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    document.getElementById('service-btn').innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isNow ? "status-btn on" : "status-btn off";
};

window.triggerPanic = async () => {
    await updateDoc(doc(db, "users", currentUser.id), { panic: !currentUser.panic });
};

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
    const crime = prompt("Crime / Infraction :");
    if(crime) {
        const docRef = doc(db, "civils", id);
        const snap = await getDocs(query(collection(db, "civils"), where("__name__", "==", id)));
        let list = snap.docs[0].data().casier || [];
        list.push(crime);
        await updateDoc(docRef, { casier: list });
    }
};

function initRealtime() {
    // Dispatch & Panic
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const effectifs = document.getElementById('list-effectifs');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = ""; effectifs.innerHTML = ""; pZone.innerHTML = "";
        
        snap.forEach(d => {
            const u = d.data();
            // Annuaire Effectifs
            effectifs.innerHTML += `<div class="card"><b>${u.grade} ${u.prenom} ${u.nom}</b><br><small>Matricule: ${u.matricule}</small><br><small>Tel: ${u.tel || 'N/A'}</small></div>`;
            
            // Dispatch
            if(u.en_service) {
                units.innerHTML += `<div class="unit-row"><span>[${u.matricule}] ${u.grade} ${u.nom}</span><span style="color:#2ecc71">ACTIF</span></div>`;
            }
            // Panic
            if(u.panic) {
                pZone.innerHTML += `<div style="background:red; padding:20px; text-align:center; font-weight:bold; border:3px solid white; margin-bottom:20px;">🚨 URGENCE ABSOLUE : ${u.grade} ${u.nom} EN DANGER 🚨</div>`;
            }
        });
    });

    // BOLO
    onSnapshot(collection(db, "bolos"), (snap) => {
        const list = document.getElementById('list-bolo'); list.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            list.innerHTML += `<div class="card" style="border-left:5px solid red;"><h3>${b.sujet}</h3><p>${b.raison}</p><small>Lancé par: ${b.auteur}</small></div>`;
        });
    });

    // Civils & Casier
    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens'); list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            let tags = (c.casier || []).map(t => `<span class="badge">${t}</span>`).join('');
            list.innerHTML += `<div class="card">
                <strong>${c.prenom} ${c.nom}</strong>
                <div class="casier-box"><b>CASIER JUDICIAIRE :</b><br>${tags || 'Vierge'}</div>
                <button onclick="addCrime('${d.id}')" style="margin-top:10px; font-size:0.7rem; padding:5px;">+ AJOUTER CRIME</button>
            </div>`;
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

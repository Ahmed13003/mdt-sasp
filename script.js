import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, deleteDoc, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const crimeData = [
    { n: "Outrage à agent", a: 750, j: 5 },
    { n: "Entrave à la justice", a: 2500, j: 10 },
    { n: "Menace sur agent", a: 1500, j: 10 },
    { n: "Corruption", a: 5000, j: 20 },
    { n: "Faux témoignage", a: 1000, j: 5 },
    { n: "Évasion de prison", a: 5000, j: 25 },
    { n: "Délit de fuite", a: 2500, j: 15 },
    { n: "Refus d'obtempérer", a: 3500, j: 15 },
    { n: "Vol de véhicule", a: 1500, j: 10 },
    { n: "Tentative de vol", a: 750, j: 5 },
    { n: "Braquage Supérette", a: 5000, j: 20 },
    { n: "Braquage Banque", a: 15000, j: 45 },
    { n: "Vente de stupéfiants", a: 5000, j: 30 },
    { n: "Possession illégale d'arme", a: 3000, j: 20 },
    { n: "Homicide involontaire", a: 7500, j: 40 },
    { n: "Homicide volontaire", a: 15000, j: 60 },
    { n: "Tentative d'homicide agent", a: 25000, j: 90 }
];
let selectedCrimes = [];

window.toggleRegister = (s) => {
    document.getElementById('auth-fields').style.display = s ? 'none' : 'block';
    document.getElementById('register-fields').style.display = s ? 'block' : 'none';
};

window.handleRegister = async () => {
    const p = document.getElementById('reg-prenom').value.trim();
    const n = document.getElementById('reg-nom').value.trim();
    const m = document.getElementById('reg-mat').value.trim();
    const ps = document.getElementById('reg-pass').value.trim();
    if(p && n && m && ps) {
        await addDoc(collection(db, "users"), { prenom: p, nom: n, matricule: m, mdp: ps, grade: "Officier I", en_service: false, statut: "en_attente", panic: false, radio: "10-8" });
        alert("Envoyé !"); window.toggleRegister(false);
    }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value.trim();
    const pass = document.getElementById('access-code').value.trim();
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data(); currentUser.id = snap.docs[0].id;
        if (currentUser.statut === "en_attente") return alert("Compte non validé.");
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';
        document.getElementById('display-name').innerText = `${currentUser.grade.toUpperCase()} : ${currentUser.nom.toUpperCase()}`;
        initRealtime();
    } else alert("Erreur.");
};

window.setRadio = async (code) => {
    document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`code-${code}`).classList.add('active');
    await updateDoc(doc(db, "users", currentUser.id), { radio: code });
};

window.toggleService = async () => {
    const isNow = document.getElementById('service-btn').innerText === "HORS SERVICE";
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNow });
    document.getElementById('service-btn').innerText = isNow ? "EN SERVICE" : "HORS SERVICE";
    document.getElementById('service-btn').className = isNow ? "service-status active" : "service-status";
};

window.triggerPanic = async () => {
    await updateDoc(doc(db, "users", currentUser.id), { panic: !currentUser.panic });
    currentUser.panic = !currentUser.panic;
};

function initCalc() {
    const menu = document.getElementById('crime-menu'); menu.innerHTML = "";
    crimeData.forEach((c, i) => { menu.innerHTML += `<div class="crime-item" id="crime-${i}" onclick="toggleCrime(${i})">${c.n}</div>`; });
}

window.toggleCrime = (i) => {
    const el = document.getElementById(`crime-${i}`);
    if(selectedCrimes.includes(i)) { selectedCrimes = selectedCrimes.filter(x => x !== i); el.classList.remove('selected'); }
    else { selectedCrimes.push(i); el.classList.add('selected'); }
    let f = 0, j = 0;
    selectedCrimes.forEach(idx => { f += crimeData[idx].a; j += crimeData[idx].j; });
    document.getElementById('fine-total').innerText = `AMENDE : ${f}$`;
    document.getElementById('jail-total').innerText = `CELLULE : ${j} MIN`;
};

window.resetCalc = () => {
    selectedCrimes = []; document.querySelectorAll('.crime-item').forEach(el => el.classList.remove('selected'));
    document.getElementById('fine-total').innerText = "AMENDE : 0$"; document.getElementById('jail-total').innerText = "CELLULE : 0 MIN";
};

window.addVehicule = async () => {
    const p = document.getElementById('veh-plaque').value.trim().toUpperCase();
    const m = document.getElementById('veh-modele').value.trim();
    const o = document.getElementById('veh-proprio').value.trim();
    if(p) await addDoc(collection(db, "vehicules"), { plaque: p, modele: m, proprio: o });
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value.trim();
    const n = document.getElementById('civ-nom').value.trim();
    if(p && n) await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
};

window.addCrimeToCivil = async (id) => {
    const crime = prompt("Crime à ajouter :");
    if(crime) {
        const snap = await getDocs(query(collection(db, "civils"), where("__name__", "==", id)));
        let list = snap.docs[0].data().casier || []; list.push(crime);
        await updateDoc(doc(db, "civils", id), { casier: list });
    }
};

window.handleMapClick = async (e) => {
    if(e.target.classList.contains('map-marker')) return;
    const rect = document.getElementById('tactical-map').getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const label = prompt("NOM DU POINT :");
    if(label) await addDoc(collection(db, "markers"), { x, y, label, auteur: currentUser.nom });
};

window.addReport = async () => {
    const t = document.getElementById('rep-titre').value;
    const c = document.getElementById('rep-contenu').value;
    if(t && c) await addDoc(collection(db, "reports"), { titre: t, contenu: c, auteur: currentUser.nom, date: serverTimestamp() });
};

function initRealtime() {
    initCalc();
    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = "<h3>UNITÉS EN SERVICE</h3>"; pZone.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<p style="color:${u.panic?'red':'#00ff00'}; font-weight:bold;">● [${u.matricule}] ${u.grade} ${u.nom} - <span style="color:gold">${u.radio||'10-8'}</span></p>`;
            if(u.panic) pZone.innerHTML += `<div class="panic-banner">🚨 ${u.grade.toUpperCase()} ${u.nom.toUpperCase()} EN DANGER ! 🚨</div>`;
        });
    });
    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens'); list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data(); let tags = (c.casier || []).map(t => `<span class="crime-tag">${t}</span>`).join('');
            list.innerHTML += `<div class="card"><strong>${c.prenom} ${c.nom}</strong><div style="margin:10px 0;">${tags||'Vierge'}</div><button onclick="addCrimeToCivil('${d.id}')">+ INFRACTION</button></div>`;
        });
    });
    onSnapshot(collection(db, "vehicules"), (snap) => {
        const list = document.getElementById('list-vehicules'); list.innerHTML = "";
        snap.forEach(d => { const v = d.data(); list.innerHTML += `<div class="card"><strong>${v.plaque}</strong><br><small>${v.modele} (${v.proprio})</small></div>`; });
    });
    onSnapshot(collection(db, "markers"), (snap) => {
        const map = document.getElementById('tactical-map'); map.querySelectorAll('.map-marker').forEach(m => m.remove());
        snap.forEach(d => {
            const m = d.data(); const el = document.createElement('div'); el.className = 'map-marker';
            el.style.left = m.x + '%'; el.style.top = m.y + '%';
            el.oncontextmenu = (e) => { e.preventDefault(); deleteDoc(doc(db, "markers", d.id)); };
            el.innerHTML = `<div class="marker-label">${m.label.toUpperCase()}</div>`; map.appendChild(el);
        });
    });
    onSnapshot(query(collection(db, "reports"), orderBy("date", "desc")), (snap) => {
        const list = document.getElementById('list-reports'); list.innerHTML = "";
        snap.forEach(d => { const r = d.data(); list.innerHTML += `<div class="card" style="margin-top:10px;"><strong>${r.titre}</strong><p>${r.contenu}</p><small>Par: ${r.auteur}</small></div>`; });
    });
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

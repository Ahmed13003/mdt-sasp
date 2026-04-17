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

const crimeData = [
    { n: "Outrage", a: 750, j: 5 },
    { n: "Délit de fuite", a: 2500, j: 15 },
    { n: "Refus d'obtempérer", a: 3500, j: 15 },
    { n: "Braquage Supérette", a: 5000, j: 20 },
    { n: "Braquage Banque", a: 15000, j: 45 },
    { n: "Meurtre", a: 15000, j: 60 },
    { n: "Homicide sur agent", a: 25000, j: 90 }
];

let selectedCrimes = [];

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    if (!snap.empty) {
        currentUser = snap.docs[0].data(); currentUser.id = snap.docs[0].id;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'block';
        document.getElementById('display-name').innerText = currentUser.nom;
        initRealtime();
    }
};

window.triggerPanic = async () => {
    await updateDoc(doc(db, "users", currentUser.id), { panic: !currentUser.panic });
    currentUser.panic = !currentUser.panic;
};

function initRealtime() {
    const menu = document.getElementById('crime-menu');
    menu.innerHTML = "";
    crimeData.forEach((c, i) => {
        menu.innerHTML += `<div class="crime-item" id="crime-${i}" onclick="toggleCrime(${i})">${c.n}</div>`;
    });

    onSnapshot(collection(db, "users"), (snap) => {
        const units = document.getElementById('list-units');
        const pZone = document.getElementById('panic-zone');
        units.innerHTML = ""; pZone.innerHTML = "";
        snap.forEach(d => {
            const u = d.data();
            if(u.en_service) units.innerHTML += `<p>● [${u.matricule}] ${u.nom}</p>`;
            if(u.panic) pZone.innerHTML += `<div style="background:red; color:white; padding:20px; font-weight:bold; margin-bottom:20px; text-align:center; border:2px solid white;">🚨 APPEL D'URGENCE : ${u.nom} 🚨</div>`;
        });
    });
}

window.toggleCrime = (i) => {
    const el = document.getElementById(`crime-${i}`);
    if(selectedCrimes.includes(i)) {
        selectedCrimes = selectedCrimes.filter(x => x !== i);
        el.classList.remove('selected');
    } else {
        selectedCrimes.push(i);
        el.classList.add('selected');
    }
    let f = 0, j = 0;
    selectedCrimes.forEach(idx => { f += crimeData[idx].a; j += crimeData[idx].j; });
    document.getElementById('fine-total').innerText = `AMENDE : ${f}$`;
    document.getElementById('jail-total').innerText = `CELLULE : ${j} MIN`;
};

window.resetCalc = () => {
    selectedCrimes = [];
    document.querySelectorAll('.crime-item').forEach(el => el.classList.remove('selected'));
    document.getElementById('fine-total').innerText = "AMENDE : 0$";
    document.getElementById('jail-total').innerText = "CELLULE : 0 MIN";
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

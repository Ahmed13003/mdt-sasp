import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// CONFIGURATION FIREBASE
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

// --- GESTION CONNEXION / INSCRIPTION ---

window.toggleRegister = (show) => {
    document.getElementById('auth-fields').style.display = show ? 'none' : 'block';
    document.getElementById('register-fields').style.display = show ? 'block' : 'none';
};

window.handleRegister = async () => {
    const prenom = document.getElementById('reg-prenom').value;
    const nom = document.getElementById('reg-nom').value;
    const grade = document.getElementById('reg-grad').value;
    const tel = document.getElementById('reg-tel').value;
    const mat = document.getElementById('reg-mat').value;
    const pass = document.getElementById('reg-pass').value;

    if(prenom && nom && grade && mat && pass) {
        await addDoc(collection(db, "users"), {
            prenom: prenom,
            nom: nom,
            grade: grade,
            tel: tel,
            matricule: mat,
            mdp: pass,
            en_service: false,
            panic: false
        });
        alert("Compte créé avec succès ! Connectez-vous.");
        toggleRegister(false);
    } else {
        alert("Veuillez remplir tous les champs obligatoires.");
    }
};

window.checkLogin = async () => {
    const mat = document.getElementById('officer-id').value;
    const pass = document.getElementById('access-code').value;
    const q = query(collection(db, "users"), where("matricule", "==", mat), where("mdp", "==", pass));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const userDoc = snap.docs[0];
        currentUser = userDoc.data();
        currentUser.id = userDoc.id;

        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('mdt-app').style.display = 'flex';

        // Mise à jour du Badge Officier (Nom & Grade)
        document.getElementById('display-name').innerText = currentUser.nom;
        document.getElementById('display-grade').innerText = currentUser.grade;

        initRealtime();
    } else {
        alert("Matricule ou mot de passe incorrect.");
    }
};

// --- ÉTATS (SERVICE / PANIC) ---

window.toggleService = async () => {
    const btn = document.getElementById('service-btn');
    const isNowInService = btn.innerText === "HORS SERVICE";
    
    await updateDoc(doc(db, "users", currentUser.id), { en_service: isNowInService });
    
    btn.innerText = isNowInService ? "EN SERVICE" : "HORS SERVICE";
    btn.className = isNowInService ? "status-btn on" : "status-btn off";
};

window.triggerPanic = async () => {
    const newState = !currentUser.panic;
    await updateDoc(doc(db, "users", currentUser.id), { panic: newState });
    currentUser.panic = newState;
};

// --- FONCTIONS D'AJOUT ---

window.addBolo = async () => {
    const sujet = document.getElementById('bolo-sujet').value;
    const raison = document.getElementById('bolo-raison').value;
    if(sujet && raison) {
        await addDoc(collection(db, "bolos"), {
            sujet: sujet,
            raison: raison,
            auteur: currentUser.nom,
            date: new Date().toLocaleString()
        });
        document.getElementById('bolo-sujet').value = "";
        document.getElementById('bolo-raison').value = "";
    }
};

window.addCivil = async () => {
    const p = document.getElementById('civ-prenom').value;
    const n = document.getElementById('civ-nom').value;
    if(p && n) {
        await addDoc(collection(db, "civils"), { prenom: p, nom: n, casier: [] });
        document.getElementById('civ-prenom').value = "";
        document.getElementById('civ-nom').value = "";
    }
};

window.addCrime = async (id) => {
    const crime = prompt("Entrez l'infraction à ajouter au casier :");
    if(crime) {
        const docRef = doc(db, "civils", id);
        const snap = await getDocs(query(collection(db, "civils"), where("__name__", "==", id)));
        let currentCasier = snap.docs[0].data().casier || [];
        currentCasier.push(crime);
        await updateDoc(docRef, { casier: currentCasier });
    }
};

// --- SYNCHRONISATION TEMPS RÉEL ---

function initRealtime() {
    // 1. Dispatch & Effectifs & Panic
    onSnapshot(collection(db, "users"), (snap) => {
        const listUnits = document.getElementById('list-units');
        const listEffectifs = document.getElementById('list-effectifs');
        const panicZone = document.getElementById('panic-zone');
        
        listUnits.innerHTML = "";
        listEffectifs.innerHTML = "";
        panicZone.innerHTML = "";

        snap.forEach(d => {
            const u = d.data();
            
            // Dispatch (seulement si en service)
            if(u.en_service) {
                listUnits.innerHTML += `
                    <div class="card" style="border-left: 5px solid #2ecc71; margin-bottom:10px; padding:10px;">
                        <b>[${u.matricule}] ${u.grade} ${u.nom}</b> - <span style="color:#2ecc71">ACTIF</span>
                    </div>`;
            }

            // Annuaire Effectifs (tout le monde)
            listEffectifs.innerHTML += `
                <div class="card">
                    <b style="color:var(--accent)">${u.grade}</b><br>
                    <span style="font-size:1.1rem;">${u.prenom} ${u.nom}</span><br>
                    <small>Matricule: ${u.matricule}</small><br>
                    <small>📞 ${u.tel || 'Non renseigné'}</small>
                </div>`;

            // Alerte Panic
            if(u.panic) {
                panicZone.innerHTML += `
                    <div style="background:red; color:white; padding:20px; text-align:center; font-weight:bold; border:4px solid white; margin-bottom:20px; animation: flash 0.5s infinite;">
                        🚨 ALERTE PANIC : ${u.grade} ${u.nom} EST EN DANGER (MATRICULE ${u.matricule}) 🚨
                    </div>`;
            }
        });
    });

    // 2. BOLO
    onSnapshot(collection(db, "bolos"), (snap) => {
        const list = document.getElementById('list-bolo');
        list.innerHTML = "";
        snap.forEach(d => {
            const b = d.data();
            list.innerHTML += `
                <div class="card" style="border-left: 5px solid red;">
                    <h3 style="color:red;">AVIS DE RECHERCHE</h3>
                    <p><b>CIBLE :</b> ${b.sujet}</p>
                    <p><b>RAISON :</b> ${b.raison}</p>
                    <small>Lancé par: ${b.auteur} (${b.date})</small>
                </div>`;
        });
    });

    // 3. Fichier Civil
    onSnapshot(collection(db, "civils"), (snap) => {
        const list = document.getElementById('list-citoyens');
        list.innerHTML = "";
        snap.forEach(d => {
            const c = d.data();
            let crimesHTML = (c.casier || []).map(crime => `<span style="background:rgba(255,0,0,0.2); padding:2px 6px; border-radius:3px; margin:2px; display:inline-block; font-size:0.8rem; border:1px solid red;">${crime}</span>`).join('');
            
            list.innerHTML += `
                <div class="card">
                    <b style="font-size:1.2rem;">${c.prenom} ${c.nom}</b>
                    <div style="margin-top:10px; padding-top:10px; border-top:1px solid #333;">
                        <small style="color:var(--accent)">CASIER JUDICIAIRE :</small><br>
                        <div style="margin-top:5px;">${crimesHTML || 'Vierge'}</div>
                    </div>
                    <button onclick="addCrime('${d.id}')" style="margin-top:15px; background:#444; color:white; font-size:0.7rem; padding:5px 10px; border:none; cursor:pointer; border-radius:3px;">+ AJOUTER INFRACTION</button>
                </div>`;
        });
    });
}

// --- NAVIGATION ---

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
        document.getElementById(item.getAttribute('data-page')).style.display = 'block';
    });
});

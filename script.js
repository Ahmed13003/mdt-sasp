document.addEventListener('DOMContentLoaded', () => {
    // On récupère tous les boutons de la barre latérale
    const navItems = document.querySelectorAll('.nav-item');
    // On récupère toutes les pages
    const pages = document.querySelectorAll('.mdt-page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Enlever la classe 'active' de tous les boutons
            navItems.forEach(nav => nav.classList.remove('active'));
            // 2. Ajouter 'active' au bouton cliqué
            item.classList.add('active');

            // 3. Cacher toutes les pages
            pages.forEach(page => page.style.display = 'none');

            // 4. Afficher la bonne page selon le texte du bouton
            const target = item.innerText.trim().toLowerCase();
            
            if (target.includes("dashboard")) {
                document.getElementById('page-dashboard').style.display = 'block';
            } else if (target.includes("citoyens")) {
                document.getElementById('page-citoyens').style.display = 'block';
            } else if (target.includes("véhicules")) {
                document.getElementById('page-vehicules').style.display = 'block';
            }
        });
    });
});
// On simule une base de données locale pour l'exemple
let pendingRequests = [];
let approvedUsers = [
    { matricule: "01", mdp: "admin", nom: "EM", grade: "Etat-Major" } // Compte de base
];

function sendRequest() {
    const newRequest = {
        nom: document.getElementById('reg-nom').value,
        prenom: document.getElementById('reg-prenom').value,
        matricule: document.getElementById('reg-matricule').value,
        tel: document.getElementById('reg-tel').value,
        mdp: document.getElementById('reg-password').value
    };

    pendingRequests.push(newRequest);
    document.getElementById('reg-success').style.display = 'block';
    updateAdminList();
}

function updateAdminList() {
    const listDiv = document.getElementById('pending-requests-list');
    listDiv.innerHTML = "";

    pendingRequests.forEach((req, index) => {
        listDiv.innerHTML += `
            <div class="card" style="margin-bottom:10px; border-left: 4px solid #c5a059;">
                <p><strong>${req.prenom} ${req.nom}</strong> (${req.matricule})</p>
                <p>Tel: ${req.tel}</p>
                <button onclick="approveUser(${index})">Accepter</button>
                <button onclick="rejectUser(${index})" style="background:red;">Refuser</button>
            </div>
        `;
    });
}

function approveUser(index) {
    const user = pendingRequests[index];
    approvedUsers.push({
        matricule: user.matricule,
        mdp: user.mdp,
        nom: user.nom,
        grade: "Officier"
    });
    pendingRequests.splice(index, 1);
    updateAdminList();
    alert("Agent validé ! Il peut maintenant se connecter.");
}

function toggleRegister() {
    const login = document.getElementById('login-box'); // Ajoute cet ID à ta div login actuelle
    const register = document.getElementById('register-box');
    
    if(register.style.display === "none") {
        register.style.display = "block";
        document.querySelector('.login-box:not(#register-box)').style.display = "none";
    } else {
        register.style.display = "none";
        document.querySelector('.login-box:not(#register-box)').style.display = "block";
    }
}

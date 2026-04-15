document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.mdt-page').forEach(p => p.style.display = 'none');
            document.getElementById(item.getAttribute('data-page')).style.display = 'block';
        });
    });
});

window.setupPermissions = (user) => {
    const g = user.grade.toLowerCase();
    if (g.includes("sergent") || g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
        document.getElementById('nav-wanted').style.display = 'flex';
    }
    if (g.includes("lieutenant") || g.includes("capitaine") || g.includes("commander")) {
        document.getElementById('nav-admin').style.display = 'flex';
    }
};

window.loadData = async () => {
    const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    // Charger Citoyens
    const citSnap = await getDocs(collection(window.db, "citoyens"));
    const citDiv = document.getElementById('list-citoyens');
    citDiv.innerHTML = "<h3>Liste des Citoyens</h3>";
    citSnap.forEach(d => {
        const data = d.data();
        citDiv.innerHTML += `<div class="data-item">${data.nom} - Tel: ${data.tel} <button class="btn-delete" onclick="deleteEntry('citoyens', '${d.id}')">X</button></div>`;
    });

    // Charger Véhicules
    const vehSnap = await getDocs(collection(window.db, "vehicules"));
    const vehDiv = document.getElementById('list-vehicules');
    vehDiv.innerHTML = "<h3>Liste des Véhicules</h3>";
    vehSnap.forEach(d => {
        const data = d.data();
        vehDiv.innerHTML += `<div class="data-item">Plaque: ${data.plaque} - Modèle: ${data.modele} <button class="btn-delete" onclick="deleteEntry('vehicules', '${d.id}')">X</button></div>`;
    });
};

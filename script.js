document.addEventListener('DOMContentLoaded', () => {
    // 1. GESTION DE LA NAVIGATION (ONGLETS)
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.mdt-page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-page');
            
            // On change l'item actif dans la sidebar
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // On affiche la bonne page
            pages.forEach(p => p.style.display = 'none');
            const targetPage = document.getElementById(target);
            if (targetPage) targetPage.style.display = 'block';
        });
    });
});

/**
 * FONCTION DE GESTION DES PERMISSIONS PAR GRADE
 * Cette fonction est appelée dans l'index.html après une connexion réussie
 */
window.setupPermissions = function(user) {
    const grade = user.grade.toLowerCase();
    
    // On cache tout par défaut au cas où
    document.getElementById('nav-wanted').style.display = 'none';
    document.getElementById('nav-slo').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'none';

    // --- ACCÈS PAR NIVEAU ---

    // 1. SLO et + (Gestion des Officiers)
    if (grade.includes("slo") || grade.includes("sergent") || grade.includes("lieutenant") || grade.includes("capitaine") || grade.includes("commander")) {
        document.getElementById('nav-slo').style.display = 'flex';
    }

    // 2. Sergents et + (Most Wanted / Effectifs)
    if (grade.includes("sergent") || grade.includes("lieutenant") || grade.includes("capitaine") || grade.includes("commander")) {
        document.getElementById('nav-wanted').style.display = 'flex';
    }

    // 3. Lieutenant et + (Administration / Validation des comptes)
    if (grade.includes("lieutenant") || grade.includes("capitaine") || grade.includes("commander")) {
        document.getElementById('nav-admin').style.display = 'flex';
    }
};

/**
 * SECURITÉ : Empêcher un Lieutenant de supprimer un Commander
 * @param {string} myGrade - Grade de celui qui agit
 * @param {string} targetGrade - Grade de celui qui subit l'action
 */
window.canModify = function(myGrade, targetGrade) {
    const me = myGrade.toLowerCase();
    const target = targetGrade.toLowerCase();

    if (me.includes("lieutenant")) {
        if (target.includes("commander") || target.includes("capitaine")) {
            return false; // Action interdite
        }
    }
    return true; // Action autorisée
};

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

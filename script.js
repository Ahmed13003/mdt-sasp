// Ton système de permissions
const PERMISSIONS = {
    'Cadet': { canDelete: false, canManageUsers: false },
    'Officier': { canDelete: false, canManageUsers: false },
    'Sergent': { canDelete: true, canManageUsers: false },
    'Commandant': { canDelete: true, canManageUsers: true }
};

// Simulation de l'utilisateur connecté (A changer plus tard avec une DB)
const currentUser = {
    name: "Jean Patin",
    rank: "Cadet" 
};

function applyPermissions() {
    const userPerms = PERMISSIONS[currentUser.rank];

    if (!userPerms.canDelete) {
        document.querySelectorAll('.btn-delete').forEach(el => el.style.removeProperty('display')); // Au cas où
        document.querySelectorAll('.btn-delete').forEach(el => el.style.display = 'none');
    }

    if (!userPerms.canManageUsers) {
        const adminNav = document.getElementById('nav-admin');
        if(adminNav) adminNav.style.display = 'none';
    }
}

// S'assure que le code se lance une fois la page chargée
document.addEventListener('DOMContentLoaded', applyPermissions);
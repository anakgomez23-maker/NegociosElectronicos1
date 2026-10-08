if (!sessionStorage.getItem('adminActivo')) {
    window.location.replace('admin-login.html');
}

document.addEventListener('DOMContentLoaded', function () {
    const adminSaludo = document.getElementById('adminSaludo');
    const adminCerrar = document.getElementById('adminCerrar');

    if (adminSaludo) {
        adminSaludo.textContent = 'Panel de administrador · Hola, ' + sessionStorage.getItem('adminActivo');
    }

    if (adminCerrar) {
        adminCerrar.addEventListener('click', function (evento) {
            evento.preventDefault();
            sessionStorage.removeItem('adminActivo');
            window.location.href = 'admin-login.html';
        });
    }
});

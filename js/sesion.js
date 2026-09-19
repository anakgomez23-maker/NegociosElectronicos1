(() => {
    const menuLogin = document.getElementById('menuLogin');

    if (!menuLogin) {
        return;
    }

    const enlaceSesion = menuLogin.querySelector('a');
    const textoInicioSesion = 'Iniciar sesión';

    const mostrarSesion = () => {
        const usuarioActivo = sessionStorage.getItem('usuarioActivo');

        if (!usuarioActivo) {
            enlaceSesion.textContent = textoInicioSesion;
            enlaceSesion.href = 'login.html';
            enlaceSesion.classList.remove('sesion-activa');
            enlaceSesion.onclick = null;
            return;
        }

        enlaceSesion.textContent = `Hola, ${usuarioActivo}`;
        enlaceSesion.href = 'perfil.html';
        enlaceSesion.classList.add('sesion-activa');
    };

    mostrarSesion();
})();

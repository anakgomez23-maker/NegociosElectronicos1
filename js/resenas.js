(function () {
    const clave = 'misResenas';

    function limitarEstrellas(valor) {
        const estrellas = Number(valor);
        return Number.isInteger(estrellas) && estrellas >= 1 && estrellas <= 5 ? estrellas : 5;
    }

    function leer() {
        try {
            const guardadas = sessionStorage.getItem(clave);
            if (!guardadas) {
                return [];
            }

            const datos = JSON.parse(guardadas);
            if (!Array.isArray(datos)) {
                console.error('Las reseñas guardadas no tienen el formato esperado.');
                return [];
            }

            return datos.filter((resena) => resena && typeof resena === 'object').map((resena, indice) => ({
                id: resena.id || Date.now() + indice,
                estrellas: limitarEstrellas(resena.estrellas),
                texto: typeof resena.texto === 'string' ? resena.texto : 'Reseña de ejemplo',
                fecha: typeof resena.fecha === 'string' && resena.fecha ? resena.fecha : new Date().toISOString(),
                autor: typeof resena.autor === 'string' && resena.autor ? resena.autor : 'Visitante'
            }));
        } catch (error) {
            console.error('No se pudieron cargar las reseñas de esta sesión.', error);
            return [];
        }
    }

    function guardar(resenas) {
        try {
            sessionStorage.setItem(clave, JSON.stringify(resenas));
            return true;
        } catch (error) {
            console.error('No se pudieron guardar las reseñas de esta sesión.', error);
            return false;
        }
    }

    function leerAutor() {
        try {
            return sessionStorage.getItem('usuarioActivo') || 'Visitante';
        } catch (error) {
            console.error('No se pudo leer el usuario activo de esta sesión.', error);
            return 'Visitante';
        }
    }

    function crearEstrella(activa) {
        const estrella = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        estrella.setAttribute('viewBox', '0 0 24 24');
        estrella.setAttribute('aria-hidden', 'true');
        estrella.classList.add(activa ? 'campana-estrella-activa' : 'campana-estrella-inactiva');

        const forma = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        forma.setAttribute('points', '12 2 15.1 8.3 22 9.3 17 14.2 18.2 21.1 12 17.8 5.8 21.1 7 14.2 2 9.3 8.9 8.3');
        estrella.appendChild(forma);
        return estrella;
    }

    function crearEstrellas(valor, clase) {
        const estrellas = document.createElement('div');
        estrellas.className = clase || 'campana-estrellas';
        estrellas.setAttribute('role', 'img');
        estrellas.setAttribute('aria-label', limitarEstrellas(valor) + ' de 5 estrellas');

        for (let indice = 1; indice <= 5; indice += 1) {
            estrellas.appendChild(crearEstrella(indice <= limitarEstrellas(valor)));
        }
        return estrellas;
    }

    function crearSelector(contenedor, nombre, valor) {
        contenedor.replaceChildren();
        contenedor.className = 'resenas-selector';

        for (let indice = 5; indice >= 1; indice -= 1) {
            const entrada = document.createElement('input');
            entrada.type = 'radio';
            entrada.name = nombre;
            entrada.value = String(indice);
            entrada.id = nombre + '-' + indice;
            entrada.className = 'resenas-radio';
            entrada.checked = indice === limitarEstrellas(valor);
            entrada.setAttribute('aria-label', indice + ' estrellas');

            const etiqueta = document.createElement('label');
            etiqueta.htmlFor = entrada.id;
            etiqueta.setAttribute('aria-hidden', 'true');
            etiqueta.appendChild(crearEstrella(false));

            contenedor.append(entrada, etiqueta);
        }
    }

    window.resenasStorage = {
        leer: leer,
        guardar: guardar,
        leerAutor: leerAutor,
        limitarEstrellas: limitarEstrellas
    };
    window.resenasUI = {
        crearEstrellas: crearEstrellas,
        crearSelector: crearSelector
    };
})();

(function () {
    const clave = 'misComentarios';

    function ordenar(comentarios) {
        return comentarios.sort(function (primero, segundo) {
            return Date.parse(segundo.fecha) - Date.parse(primero.fecha);
        });
    }

    function leer() {
        try {
            const guardados = sessionStorage.getItem(clave);
            const comentarios = guardados ? JSON.parse(guardados) : [];

            if (!Array.isArray(comentarios)) {
                return [];
            }

            return ordenar(comentarios.filter(function (comentario) {
                return comentario
                    && (typeof comentario.id === 'number' || typeof comentario.id === 'string')
                    && typeof comentario.texto === 'string'
                    && typeof comentario.fecha === 'string'
                    && !Number.isNaN(Date.parse(comentario.fecha))
                    && typeof comentario.autor === 'string';
            }).map(function (comentario) {
                return {
                    id: comentario.id,
                    texto: comentario.texto,
                    fecha: comentario.fecha,
                    autor: comentario.autor
                };
            }));
        } catch (error) {
            console.warn('No se pudieron leer los comentarios guardados.', error);
            return [];
        }
    }

    function guardar(comentario) {
        const comentarios = ordenar(leer().concat(comentario));

        try {
            sessionStorage.setItem(clave, JSON.stringify(comentarios));
        } catch (error) {
            console.warn('No se pudieron guardar los comentarios.', error);
        }

        return comentarios;
    }

    window.misComentariosStorage = Object.freeze({
        leer: leer,
        guardar: guardar
    });
})();

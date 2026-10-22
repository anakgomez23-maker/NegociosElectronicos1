window.leerFotoReducida = function (archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();

        lector.onerror = () => reject(new Error('No se pudo leer la foto seleccionada.'));
        lector.onload = () => {
            const imagen = new Image();
            imagen.onerror = () => reject(new Error('No se pudo procesar la foto seleccionada.'));
            imagen.onload = () => {
                try {
                    if (!imagen.naturalWidth || !imagen.naturalHeight) {
                        throw new Error('La foto seleccionada no tiene dimensiones válidas.');
                    }

                    const escala = Math.min(1, 400 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
                    const ancho = Math.round(imagen.naturalWidth * escala);
                    const alto = Math.round(imagen.naturalHeight * escala);
                    const lienzo = document.createElement('canvas');
                    lienzo.width = ancho;
                    lienzo.height = alto;

                    const contexto = lienzo.getContext('2d');
                    if (!contexto) {
                        throw new Error('No se pudo preparar la foto seleccionada.');
                    }

                    contexto.drawImage(imagen, 0, 0, ancho, alto);
                    resolve(lienzo.toDataURL('image/jpeg', 0.7));
                } catch (error) {
                    reject(error);
                }
            };
            imagen.src = lector.result;
        };

        lector.readAsDataURL(archivo);
    });
};

const articulosEjemplo = [
    {
        nombre: 'Cuaderno bordado a mano',
        precio: '$120 MXN',
        descripcion: 'Cuaderno artesanal con portada bordada a mano.',
        fecha: '2026-11-02T12:00:00-06:00',
        vendedor: 'Sofía M.'
    },
    {
        nombre: 'Aretes de chaquira',
        precio: '$90 MXN',
        descripcion: 'Aretes coloridos tejidos con chaquira.',
        fecha: '2026-11-01T12:00:00-06:00',
        vendedor: 'Andrés P.'
    },
    {
        nombre: 'Maceta de barro pintada',
        precio: '$150 MXN',
        descripcion: 'Maceta de barro decorada con pintura artesanal.',
        fecha: '2026-10-31T12:00:00-06:00',
        vendedor: 'Valeria R.'
    },
    {
        nombre: 'Bolsa tejida de ixtle',
        precio: '$220 MXN',
        descripcion: 'Bolsa resistente tejida con fibras de ixtle.',
        fecha: '2026-10-30T12:00:00-06:00',
        vendedor: 'Camila N.'
    }
];

const gridMarketplace = document.getElementById('gridMarketplace');

function leerPublicacionesUsuario() {
    try {
        const guardadas = sessionStorage.getItem('misPublicaciones');
        if (!guardadas) {
            return [];
        }

        const publicaciones = JSON.parse(guardadas);
        if (!Array.isArray(publicaciones)) {
            return [];
        }

        return publicaciones
            .filter((publicacion) => publicacion && typeof publicacion === 'object')
            .sort((primera, segunda) => {
                const fechaPrimera = Date.parse(primera.fecha) || Number(primera.id) || 0;
                const fechaSegunda = Date.parse(segunda.fecha) || Number(segunda.id) || 0;
                return fechaSegunda - fechaPrimera;
            });
    } catch (error) {
        console.error('No se pudieron leer las publicaciones para el marketplace.', error);
        return [];
    }
}

function agregarTexto(elemento, contenido) {
    elemento.textContent = contenido == null ? '' : String(contenido);
    return elemento;
}

function crearTarjetaMarketplace(articulo, esPublicacionUsuario) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'producto-card marketplace-card';

    const contenedorImagen = document.createElement('div');
    contenedorImagen.className = 'producto-imagen';

    if (esPublicacionUsuario && typeof articulo.foto === 'string' && articulo.foto.startsWith('data:image/')) {
        const imagen = document.createElement('img');
        imagen.src = articulo.foto;
        imagen.alt = 'Foto de ' + (articulo.nombre || 'producto publicado');
        contenedorImagen.appendChild(imagen);
    } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'c2c-placeholder-text';
        placeholder.textContent = 'Sin foto';
        contenedorImagen.appendChild(placeholder);
    }

    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta etiqueta-nuevo';
    etiqueta.textContent = esPublicacionUsuario ? 'Tu publicación' : 'Comunidad';
    contenedorImagen.appendChild(etiqueta);
    tarjeta.appendChild(contenedorImagen);

    const nombre = document.createElement('h3');
    agregarTexto(nombre, articulo.nombre || 'Producto sin nombre');
    tarjeta.appendChild(nombre);

    const precio = document.createElement('p');
    precio.className = 'producto-precio';
    agregarTexto(precio, articulo.precio || '$0 MXN');
    tarjeta.appendChild(precio);

    const descripcion = document.createElement('p');
    descripcion.className = 'marketplace-descripcion';
    agregarTexto(descripcion, articulo.descripcion || 'Sin descripción');
    tarjeta.appendChild(descripcion);

    const publicadoPor = document.createElement('p');
    publicadoPor.className = 'marketplace-publicado-por';
    const vendedor = document.createElement('span');
    agregarTexto(vendedor, articulo.vendedor || 'Visitante');
    const fecha = document.createElement('span');
    const fechaPublicacion = new Date(articulo.fecha);
    agregarTexto(fecha, Number.isNaN(fechaPublicacion.getTime())
        ? 'Fecha no disponible'
        : fechaPublicacion.toLocaleDateString('es-MX'));
    publicadoPor.append('Publicado por ', vendedor, ' · ', fecha);
    tarjeta.appendChild(publicadoPor);

    return tarjeta;
}

function pintarMarketplace() {
    const publicacionesUsuario = leerPublicacionesUsuario();
    gridMarketplace.replaceChildren();

    publicacionesUsuario.forEach((publicacion) => {
        gridMarketplace.appendChild(crearTarjetaMarketplace(publicacion, true));
    });

    articulosEjemplo.forEach((articulo) => {
        gridMarketplace.appendChild(crearTarjetaMarketplace(articulo, false));
    });
}

pintarMarketplace();

(() => {
    const obtenerCarrito = () => {
        try {
            const carrito = JSON.parse(sessionStorage.getItem('carrito') || '[]');
            return Array.isArray(carrito) ? carrito : [];
        } catch {
            return [];
        }
    };

    const actualizarContadorCarrito = () => {
        const cantidadTotal = obtenerCarrito().reduce((total, producto) => {
            return total + Math.max(0, Number(producto.cantidad) || 0);
        }, 0);

        document.querySelectorAll('.carrito-contador').forEach((contador) => {
            contador.textContent = String(cantidadTotal);
        });
    };

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 2
    });

    const pintarCarrito = () => {
        const lista = document.getElementById('listaCarrito');
        if (!lista) {
            return;
        }

        const carrito = obtenerCarrito();
        const estadoVacio = document.getElementById('carritoVacio');
        const resumen = document.getElementById('carritoResumen');
        const totalElemento = document.getElementById('totalCarrito');
        let totalGeneral = 0;

        lista.replaceChildren();
        estadoVacio.hidden = carrito.length > 0;
        resumen.hidden = carrito.length === 0;

        carrito.forEach((producto) => {
            const cantidad = Math.max(0, Number(producto.cantidad) || 0);
            const precio = Math.max(0, Number(producto.precio) || 0);
            const subtotal = precio * cantidad;
            totalGeneral += subtotal;

            const articulo = document.createElement('article');
            articulo.className = 'carrito-producto';

            const contenedorImagen = document.createElement('div');
            contenedorImagen.className = 'carrito-producto-imagen producto-imagen';
            if (producto.imagen) {
                const imagen = document.createElement('img');
                imagen.src = producto.imagen;
                imagen.alt = producto.nombre;
                contenedorImagen.appendChild(imagen);
            } else {
                contenedorImagen.textContent = 'Sin imagen';
            }

            const informacion = document.createElement('div');
            informacion.className = 'carrito-producto-info';

            const nombre = document.createElement('h2');
            nombre.textContent = producto.nombre;

            const precioUnitario = document.createElement('p');
            precioUnitario.className = 'carrito-dato';
            precioUnitario.append('Precio unitario: ');
            const precioTexto = document.createElement('strong');
            precioTexto.textContent = formatoPrecio.format(precio);
            precioUnitario.appendChild(precioTexto);

            const cantidadTexto = document.createElement('p');
            cantidadTexto.className = 'carrito-dato';
            cantidadTexto.append('Cantidad: ');
            const cantidadValor = document.createElement('strong');
            cantidadValor.textContent = String(cantidad);
            cantidadTexto.appendChild(cantidadValor);

            informacion.append(nombre, precioUnitario, cantidadTexto);

            const subtotalContenedor = document.createElement('div');
            subtotalContenedor.className = 'carrito-producto-subtotal';
            const subtotalEtiqueta = document.createElement('span');
            subtotalEtiqueta.textContent = 'Subtotal';
            const subtotalTexto = document.createElement('strong');
            subtotalTexto.textContent = formatoPrecio.format(subtotal);

            const botonEliminar = document.createElement('button');
            botonEliminar.type = 'button';
            botonEliminar.className = 'boton-eliminar-carrito';
            botonEliminar.dataset.productoId = producto.id;
            botonEliminar.textContent = 'Eliminar';
            botonEliminar.setAttribute('aria-label', 'Eliminar ' + producto.nombre);

            subtotalContenedor.append(subtotalEtiqueta, subtotalTexto, botonEliminar);
            articulo.append(contenedorImagen, informacion, subtotalContenedor);
            lista.appendChild(articulo);
        });

        totalElemento.textContent = formatoPrecio.format(totalGeneral);
    };

    const guardarCarrito = (carrito) => {
        sessionStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        pintarCarrito();
    };

    const lista = document.getElementById('listaCarrito');
    if (lista) {
        lista.addEventListener('click', (evento) => {
            const boton = evento.target.closest('[data-producto-id]');
            if (!boton) {
                return;
            }

            const idProducto = boton.dataset.productoId;
            guardarCarrito(obtenerCarrito().filter((producto) => {
                return String(producto.id) !== idProducto;
            }));
        });
    }

    window.obtenerCarrito = obtenerCarrito;
    window.guardarCarrito = guardarCarrito;
    window.actualizarContadorCarrito = actualizarContadorCarrito;
    actualizarContadorCarrito();
    pintarCarrito();
})();
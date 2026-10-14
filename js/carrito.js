(() => {
    const normalizarCantidad = (cantidad) => {
        return Math.min(10, Math.max(1, Math.trunc(Number(cantidad) || 1)));
    };

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
            return total + normalizarCantidad(producto.cantidad);
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

    const obtenerDescuentoActivo = () => {
        const descuentoGuardado = sessionStorage.getItem('descuentoActivo');
        if (!descuentoGuardado) {
            return null;
        }

        try {
            const descuento = JSON.parse(descuentoGuardado);
            if (!descuento || typeof descuento.codigo !== 'string' || typeof descuento.tipo !== 'string') {
                return null;
            }
            return descuento;
        } catch {
            return null;
        }
    };

    const pintarCarrito = () => {
        const lista = document.getElementById('listaCarrito');
        if (!lista) {
            return;
        }

        const carrito = obtenerCarrito();
        const estadoVacio = document.getElementById('carritoVacio');
        const resumen = document.getElementById('carritoResumen');
        const totalElemento = document.getElementById('totalCarrito');
        const descuentosElemento = document.getElementById('descuentosCarrito');
        let totalGeneral = 0;

        lista.replaceChildren();
        estadoVacio.hidden = carrito.length > 0;
        resumen.hidden = carrito.length === 0;

        carrito.forEach((producto) => {
            const cantidad = normalizarCantidad(producto.cantidad);
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

            const cantidadSelector = document.createElement('div');
            cantidadSelector.className = 'selector-cantidad carrito-selector-cantidad';
            const cantidadEtiqueta = document.createElement('span');
            cantidadEtiqueta.className = 'carrito-cantidad-etiqueta';
            cantidadEtiqueta.textContent = 'Cantidad:';

            const controlesCantidad = document.createElement('div');
            controlesCantidad.className = 'carrito-control-cantidad';

            const botonDisminuir = document.createElement('button');
            botonDisminuir.type = 'button';
            botonDisminuir.dataset.productoId = producto.id;
            botonDisminuir.dataset.accionCantidad = 'disminuir';
            botonDisminuir.setAttribute('aria-label', 'Disminuir cantidad de ' + producto.nombre);
            botonDisminuir.textContent = '−';
            botonDisminuir.disabled = cantidad <= 1;

            const cantidadValor = document.createElement('strong');
            cantidadValor.textContent = String(cantidad);
            cantidadValor.className = 'carrito-cantidad-valor';

            const botonAumentar = document.createElement('button');
            botonAumentar.type = 'button';
            botonAumentar.dataset.productoId = producto.id;
            botonAumentar.dataset.accionCantidad = 'aumentar';
            botonAumentar.setAttribute('aria-label', 'Aumentar cantidad de ' + producto.nombre);
            botonAumentar.textContent = '+';
            botonAumentar.disabled = cantidad >= 10;

            controlesCantidad.append(botonDisminuir, cantidadValor, botonAumentar);
            cantidadSelector.append(cantidadEtiqueta, controlesCantidad);
            informacion.append(nombre, precioUnitario, cantidadSelector);

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

        const descuentoActivo = obtenerDescuentoActivo();
        const codigoDescuento = descuentoActivo ? descuentoActivo.codigo.toUpperCase() : '';
        const porcentajesDescuento = {
            PULSERA2X1: 50,
            LLAVERO10: 10
        };

        if (descuentosElemento) {
            descuentosElemento.replaceChildren();
        }

        let totalConDescuento = totalGeneral;
        if (descuentoActivo && codigoDescuento === 'ENVIOGRATIS'
            && descuentoActivo.tipo === 'envio-gratis') {
            const lineaEnvio = document.createElement('p');
            lineaEnvio.className = 'carrito-descuento-linea';
            lineaEnvio.textContent = 'Envío gratis';
            descuentosElemento?.appendChild(lineaEnvio);
        } else if (descuentoActivo && descuentoActivo.tipo === 'porcentaje'
            && Object.hasOwn(porcentajesDescuento, codigoDescuento)) {
            const porcentaje = porcentajesDescuento[codigoDescuento];
            const montoDescuento = Math.min(totalGeneral, totalGeneral * porcentaje / 100);
            totalConDescuento = Math.max(0, totalGeneral - montoDescuento);

            const lineaDescuento = document.createElement('p');
            lineaDescuento.className = 'carrito-descuento-linea';
            lineaDescuento.textContent = 'Descuento (' + codigoDescuento + '): −' + formatoPrecio.format(montoDescuento);
            descuentosElemento?.appendChild(lineaDescuento);
        }

        totalElemento.textContent = formatoPrecio.format(totalConDescuento);
    };

    const guardarCarrito = (carrito) => {
        sessionStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        pintarCarrito();
    };

    const lista = document.getElementById('listaCarrito');
    const modalConfirmarEliminacion = document.getElementById('modalConfirmarEliminacionCarrito');
    const botonCancelarEliminacion = document.getElementById('cancelarEliminacionCarrito');
    const botonConfirmarEliminacion = document.getElementById('confirmarEliminacionCarrito');
    const mensajeCarrito = document.getElementById('mensajeCarrito');
    let idProductoPendienteEliminar = null;
    let temporizadorMensaje = null;

    const cerrarModalConfirmacion = () => {
        idProductoPendienteEliminar = null;
        modalConfirmarEliminacion.close();
    };

    const mostrarMensajeEliminacion = () => {
        mensajeCarrito.textContent = 'Producto eliminado del carrito (simulado)';
        mensajeCarrito.classList.add('visible');
        window.clearTimeout(temporizadorMensaje);
        temporizadorMensaje = window.setTimeout(() => {
            mensajeCarrito.classList.remove('visible');
        }, 3000);
    };

    if (lista && modalConfirmarEliminacion && botonCancelarEliminacion
        && botonConfirmarEliminacion && mensajeCarrito) {
        lista.addEventListener('click', (evento) => {
            const boton = evento.target.closest('[data-producto-id]');
            if (!boton) {
                return;
            }

            if (boton.dataset.accionCantidad) {
                const carrito = obtenerCarrito();
                const producto = carrito.find((elemento) => {
                    return String(elemento.id) === boton.dataset.productoId;
                });
                if (!producto) {
                    return;
                }

                const cambio = boton.dataset.accionCantidad === 'aumentar' ? 1 : -1;
                producto.cantidad = normalizarCantidad(normalizarCantidad(producto.cantidad) + cambio);
                guardarCarrito(carrito);
                return;
            }

            if (!boton.classList.contains('boton-eliminar-carrito')) {
                return;
            }

            idProductoPendienteEliminar = boton.dataset.productoId;
            modalConfirmarEliminacion.showModal();
            botonConfirmarEliminacion.focus();
        });

        botonCancelarEliminacion.addEventListener('click', cerrarModalConfirmacion);

        modalConfirmarEliminacion.addEventListener('click', (evento) => {
            if (evento.target === modalConfirmarEliminacion) {
                cerrarModalConfirmacion();
            }
        });

        modalConfirmarEliminacion.addEventListener('cancel', () => {
            idProductoPendienteEliminar = null;
        });

        botonConfirmarEliminacion.addEventListener('click', () => {
            if (idProductoPendienteEliminar === null) {
                return;
            }

            const idProducto = idProductoPendienteEliminar;
            guardarCarrito(obtenerCarrito().filter((producto) => {
                return String(producto.id) !== idProducto;
            }));
            cerrarModalConfirmacion();
            mostrarMensajeEliminacion();
        });
    }

    window.obtenerCarrito = obtenerCarrito;
    window.guardarCarrito = guardarCarrito;
    window.actualizarContadorCarrito = actualizarContadorCarrito;
    actualizarContadorCarrito();
    pintarCarrito();
})();
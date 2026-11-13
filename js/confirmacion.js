(() => {
    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 2
    });
    const formatoFecha = new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    const formatoHora = new Intl.DateTimeFormat('es-MX', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const camposDireccion = [
        ['nombre', 'Nombre completo'],
        ['telefono', 'Teléfono'],
        ['calle', 'Calle y número'],
        ['colonia', 'Colonia'],
        ['ciudad', 'Ciudad'],
        ['estado', 'Estado'],
        ['codigoPostal', 'Código postal'],
        ['referencias', 'Referencias']
    ];
    const metodosPago = [
        'Tarjeta de crédito o débito',
        'Transferencia bancaria',
        'Monedero electrónico'
    ];

    const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
    const esMontoValido = (valor) => typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
    const formatoMonto = (monto) => formatoPrecio.format(monto) + ' MXN';
    const leerPedido = () => {
        try {
            const guardado = sessionStorage.getItem('ultimoPedido');
            return guardado ? JSON.parse(guardado) : null;
        } catch {
            return null;
        }
    };

    const validarPedido = (pedido) => {
        if (!esObjeto(pedido)
            || typeof pedido.numeroPedido !== 'string'
            || !/^AK-\d{6}$/.test(pedido.numeroPedido)
            || typeof pedido.fecha !== 'string'
            || !Number.isFinite(new Date(pedido.fecha).getTime())
            || !esObjeto(pedido.direccion)
            || !metodosPago.includes(pedido.metodoPago)
            || !esObjeto(pedido.detallePago)
            || !Array.isArray(pedido.productos)
            || pedido.productos.length === 0
            || !pedido.productos.every((producto) => esObjeto(producto)
                && esMontoValido(Number(producto.precio))
                && (producto.cantidad === undefined
                    || (Number.isFinite(Number(producto.cantidad)) && Number(producto.cantidad) > 0)))
            || !esMontoValido(pedido.subtotal)
            || !esMontoValido(pedido.total)) {
            return false;
        }

        const estadoEsperado = pedido.metodoPago === 'Transferencia bancaria'
            ? 'Pendiente de confirmación'
            : 'Pagado';
        if (pedido.estadoPago !== estadoEsperado) {
            return false;
        }

        if (pedido.metodoPago === 'Tarjeta de crédito o débito') {
            return typeof pedido.detallePago.ultimos4 === 'string'
                && /^\d{4}$/.test(pedido.detallePago.ultimos4);
        }
        if (pedido.metodoPago === 'Transferencia bancaria') {
            return typeof pedido.detallePago.referencia === 'string'
                && /^AK-\d{6}$/.test(pedido.detallePago.referencia);
        }
        if (!esMontoValido(pedido.detallePago.saldoDespues)) {
            return false;
        }

        if (pedido.descuento === null) {
            return true;
        }
        if (!esObjeto(pedido.descuento) || typeof pedido.descuento.codigo !== 'string') {
            return false;
        }
        return pedido.descuento.tipo === 'envio-gratis'
            ? pedido.descuento.codigo.toUpperCase() === 'ENVIOGRATIS'
                && pedido.descuento.monto === null
            : pedido.descuento.tipo === 'porcentaje'
                && esMontoValido(pedido.descuento.monto);
    };

    const crearTexto = (etiqueta, valor, clase = '') => {
        const elemento = document.createElement(etiqueta);
        if (clase) {
            elemento.className = clase;
        }
        elemento.textContent = valor;
        return elemento;
    };

    const opcionesPersonalizacion = (producto) => {
        const opciones = producto.opcionesPersonalizacion || producto.personalizacion;
        if (Array.isArray(opciones)) {
            return opciones.map((opcion) => {
                if (typeof opcion === 'string' || typeof opcion === 'number') {
                    return String(opcion);
                }
                if (esObjeto(opcion)) {
                    const valor = opcion.valor ?? opcion.value;
                    if ((typeof valor === 'string' || typeof valor === 'number') && String(valor).trim()) {
                        const etiqueta = typeof opcion.label === 'string' && opcion.label.trim()
                            ? opcion.label + ': '
                            : '';
                        return etiqueta + String(valor);
                    }
                }
                return '';
            }).filter(Boolean);
        }
        if (esObjeto(opciones)) {
            return Object.entries(opciones).map(([etiqueta, valor]) => {
                return (typeof valor === 'string' || typeof valor === 'number') && String(valor).trim()
                    ? etiqueta + ': ' + String(valor)
                    : '';
            }).filter(Boolean);
        }
        return [];
    };

    const crearLineaProducto = (producto) => {
        const linea = document.createElement('li');
        const nombre = typeof producto.nombre === 'string' && producto.nombre.trim()
            ? producto.nombre
            : 'Producto';
        const cantidadNumero = Number(producto.cantidad);
        const cantidad = Math.min(10, Math.max(1, Math.trunc(cantidadNumero || 1)));
        const precio = Number(producto.precio);
        const contenido = document.createElement('div');
        contenido.className = 'confirmacion-producto-info';
        contenido.appendChild(crearTexto('strong', nombre));

        const personalizacion = opcionesPersonalizacion(producto);
        if (personalizacion.length) {
            contenido.appendChild(crearTexto('small', personalizacion.join(' · ')));
        }

        const detalle = document.createElement('div');
        detalle.className = 'confirmacion-producto-detalle';
        detalle.append(
            crearTexto('span', 'Cantidad: ' + cantidad),
            crearTexto('span', 'Precio unitario: ' + formatoPrecio.format(precio)),
            crearTexto('strong', 'Subtotal: ' + formatoPrecio.format(precio * cantidad))
        );
        linea.append(contenido, detalle);
        return linea;
    };

    const pintarProductos = (pedido) => {
        const lista = document.getElementById('confirmacionProductos');
        pedido.productos.forEach((producto) => lista.appendChild(crearLineaProducto(producto)));
    };

    const pintarDescuento = (descuento) => {
        if (!descuento) {
            return;
        }
        const linea = document.createElement('p');
        if (descuento.tipo === 'envio-gratis') {
            linea.textContent = 'Envío gratis';
        } else {
            linea.append(
                crearTexto('span', 'Descuento (' + descuento.codigo + ')'),
                crearTexto('strong', '−' + formatoPrecio.format(descuento.monto))
            );
        }
        document.getElementById('confirmacionDescuento').appendChild(linea);
    };

    const textoMetodoPago = (pedido) => {
        if (pedido.metodoPago === 'Tarjeta de crédito o débito') {
            return 'Tarjeta terminación ' + pedido.detallePago.ultimos4;
        }
        if (pedido.metodoPago === 'Transferencia bancaria') {
            return 'Transferencia bancaria · Referencia ' + pedido.detallePago.referencia;
        }
        return 'Monedero electrónico · saldo restante ' + formatoMonto(pedido.detallePago.saldoDespues);
    };

    const pintarDireccion = (direccion) => {
        const lista = document.getElementById('confirmacionDireccion');
        camposDireccion.forEach(([campo, etiqueta]) => {
            const fila = document.createElement('div');
            fila.append(
                crearTexto('dt', etiqueta),
                crearTexto('dd', typeof direccion[campo] === 'string' && direccion[campo].trim()
                    ? direccion[campo]
                    : '—')
            );
            lista.appendChild(fila);
        });
    };

    const mostrarPedido = (pedido) => {
        const transferenciaPendiente = pedido.estadoPago === 'Pendiente de confirmación';
        document.getElementById('confirmacionTitulo').textContent =
            transferenciaPendiente ? 'Pedido registrado' : 'Pago aprobado';
        document.getElementById('confirmacionSubtitulo').textContent = transferenciaPendiente
            ? 'Tu pago está pendiente de confirmación (simulado)'
            : 'Gracias por tu compra';
        document.getElementById('confirmacionNumero').textContent = pedido.numeroPedido;

        const fecha = new Date(pedido.fecha);
        const hora = formatoHora.format(fecha).replace(/\b([ap])\.?\s?m\.?/i, (periodo) => {
            return periodo.toLowerCase().startsWith('p') ? 'p. m.' : 'a. m.';
        });
        document.getElementById('confirmacionFecha').textContent =
            formatoFecha.format(fecha) + ', ' + hora;

        pintarProductos(pedido);
        document.getElementById('confirmacionSubtotal').textContent = formatoPrecio.format(pedido.subtotal);
        pintarDescuento(pedido.descuento);
        document.getElementById('confirmacionTotal').textContent = formatoPrecio.format(pedido.total);
        document.getElementById('confirmacionMetodo').textContent = textoMetodoPago(pedido);

        const etiquetaEstado = document.getElementById('confirmacionEstadoPago');
        etiquetaEstado.textContent = pedido.estadoPago;
        etiquetaEstado.classList.add(transferenciaPendiente
            ? 'confirmacion-etiqueta-pendiente'
            : 'confirmacion-etiqueta-pagado');
        pintarDireccion(pedido.direccion);

        document.getElementById('confirmacionVacia').hidden = true;
        document.getElementById('confirmacionPasos').hidden = false;
        document.getElementById('confirmacionContenido').hidden = false;
    };

    const pedido = leerPedido();
    if (validarPedido(pedido)) {
        mostrarPedido(pedido);
    } else {
        document.getElementById('confirmacionVacia').hidden = false;
    }

    const botonCopiar = document.getElementById('copiarNumeroPedido');
    botonCopiar.addEventListener('click', async () => {
        const estadoCopiado = document.getElementById('estadoCopiado');
        try {
            await navigator.clipboard.writeText(document.getElementById('confirmacionNumero').textContent);
            botonCopiar.textContent = 'Copiado';
            estadoCopiado.textContent = 'Copiado';
        } catch {
            estadoCopiado.textContent = 'No se pudo copiar el número';
        }
    });
})();

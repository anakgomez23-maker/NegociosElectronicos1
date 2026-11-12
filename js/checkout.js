(() => {
    const numeroPedido = 'AK-' + String(Math.floor(100000 + Math.random() * 900000));
    const saldoDisponibleMonedero = 3000;
    const checkoutEstado = document.getElementById('checkoutEstado');
    const checkoutEstadoTexto = document.getElementById('checkoutEstadoTexto');
    const checkoutEstadoEnlace = document.getElementById('checkoutEstadoEnlace');
    const checkoutPasos = document.getElementById('checkoutPasos');
    const checkoutLayout = document.getElementById('checkoutLayout');
    const checkoutExito = document.getElementById('checkoutExito');
    const checkoutAnuncio = document.getElementById('checkoutAnuncio');
    const checkoutErrorConfirmacion = document.getElementById('checkoutErrorConfirmacion');
    const checkoutProcesando = document.getElementById('checkoutProcesando');
    const formDireccion = document.getElementById('formDireccion');
    const formPago = document.getElementById('formPago');
    const campoNumeroTarjeta = document.getElementById('numeroTarjeta');
    const campoVencimientoTarjeta = document.getElementById('vencimientoTarjeta');
    const campoCvvTarjeta = document.getElementById('cvvTarjeta');
    const botonConfirmarPedido = document.getElementById('confirmarPedido');
    const radiosMetodoPago = Array.from(formPago.querySelectorAll('input[name="metodoPago"]'));
    const camposDireccion = Array.from(formDireccion.elements).filter((campo) => campo.name);
    const pasos = [
        {
            panel: document.getElementById('checkoutPasoDireccion'),
            titulo: document.getElementById('tituloPasoDireccion'),
            anuncio: 'Paso 1: Dirección'
        },
        {
            panel: document.getElementById('checkoutPasoPago'),
            titulo: document.getElementById('tituloPasoPago'),
            anuncio: 'Paso 2: Método de pago'
        },
        {
            panel: document.getElementById('checkoutPasoConfirmacion'),
            titulo: document.getElementById('tituloPasoConfirmacion'),
            anuncio: 'Paso 3: Confirmación'
        }
    ];

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 2
    });
    const formatoMonto = (monto) => formatoPrecio.format(monto) + ' MXN';
    const porcentajesDescuento = {
        PULSERA2X1: 50,
        LLAVERO10: 10
    };
    const camposDireccionEtiquetas = [
        ['nombre', 'Nombre completo'],
        ['telefono', 'Teléfono'],
        ['calle', 'Calle y número'],
        ['colonia', 'Colonia'],
        ['ciudad', 'Ciudad'],
        ['estado', 'Estado'],
        ['codigoPostal', 'Código postal'],
        ['referencias', 'Referencias']
    ];

    let carritoActual = [];
    let descuentoActual = null;
    let pasoActual = 1;
    let direccion = {};
    let metodoPago = 'Tarjeta de crédito o débito';
    let numeroTarjeta = '';
    let pagoEnProceso = false;

    const leerSesion = (clave) => {
        try {
            return { correcto: true, valor: sessionStorage.getItem(clave) };
        } catch {
            return { correcto: false, valor: null };
        }
    };

    const leerCarrito = () => {
        const resultado = leerSesion('carrito');
        if (!resultado.correcto) {
            return { correcto: false, productos: [] };
        }

        try {
            const productos = JSON.parse(resultado.valor || '[]');
            return {
                correcto: true,
                productos: Array.isArray(productos)
                    ? productos.filter((producto) => producto && typeof producto === 'object' && !Array.isArray(producto))
                    : []
            };
        } catch {
            return { correcto: true, productos: [] };
        }
    };

    const leerDescuento = () => {
        const resultado = leerSesion('descuentoActivo');
        if (!resultado.correcto) {
            return { correcto: false, descuento: null };
        }
        if (!resultado.valor) {
            return { correcto: true, descuento: null };
        }

        try {
            const descuento = JSON.parse(resultado.valor);
            if (!descuento || typeof descuento.codigo !== 'string' || typeof descuento.tipo !== 'string') {
                return { correcto: true, descuento: null };
            }
            return { correcto: true, descuento };
        } catch {
            return { correcto: true, descuento: null };
        }
    };

    const normalizarCantidad = (cantidad) => {
        const valor = typeof cantidad === 'number' || typeof cantidad === 'string'
            ? Number(cantidad)
            : 1;
        return Math.min(10, Math.max(1, Math.trunc(valor || 1)));
    };

    const normalizarPrecio = (precio) => {
        const valor = typeof precio === 'number' || typeof precio === 'string'
            ? Number(precio)
            : 0;
        return Math.max(0, valor || 0);
    };

    const calcularPedido = (productos, descuento) => {
        const subtotal = productos.reduce((total, producto) => {
            return total + normalizarPrecio(producto.precio) * normalizarCantidad(producto.cantidad);
        }, 0);
        const codigo = descuento ? descuento.codigo.toUpperCase() : '';

        if (descuento && codigo === 'ENVIOGRATIS' && descuento.tipo === 'envio-gratis') {
            return {
                subtotal,
                total: subtotal,
                descuentoAplicado: { codigo, tipo: 'envio-gratis', monto: null }
            };
        }

        if (descuento && descuento.tipo === 'porcentaje'
            && Object.hasOwn(porcentajesDescuento, codigo)) {
            const monto = Math.min(subtotal, subtotal * porcentajesDescuento[codigo] / 100);
            return {
                subtotal,
                total: Math.max(0, subtotal - monto),
                descuentoAplicado: { codigo, tipo: 'porcentaje', monto }
            };
        }

        return { subtotal, total: subtotal, descuentoAplicado: null };
    };

    const mostrarEstado = (mensaje, textoEnlace, destino) => {
        checkoutEstadoTexto.textContent = mensaje;
        checkoutEstadoEnlace.hidden = !textoEnlace;
        if (textoEnlace) {
            checkoutEstadoEnlace.textContent = textoEnlace;
            checkoutEstadoEnlace.href = destino;
        }
        checkoutEstado.hidden = false;
        checkoutPasos.hidden = true;
        checkoutLayout.hidden = true;
        checkoutExito.hidden = true;
    };

    const actualizarContador = (productos) => {
        const cantidad = productos.reduce((total, producto) => {
            return total + normalizarCantidad(producto.cantidad);
        }, 0);
        document.querySelectorAll('.carrito-contador').forEach((contador) => {
            contador.textContent = String(cantidad);
        });
    };

    const mostrarSesionEnNavbar = (usuario) => {
        const enlace = document.querySelector('#menuLogin a');
        if (enlace && usuario) {
            enlace.textContent = 'Hola, ' + usuario;
            enlace.href = 'perfil.html';
            enlace.classList.add('sesion-activa');
        }
    };

    const opcionesPersonalizacion = (producto) => {
        const opciones = producto.opcionesPersonalizacion || producto.personalizacion;
        if (Array.isArray(opciones)) {
            return opciones.map((opcion) => {
                if (typeof opcion === 'string' || typeof opcion === 'number') {
                    return String(opcion);
                }
                if (opcion && typeof opcion === 'object') {
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
        if (opciones && typeof opciones === 'object') {
            return Object.entries(opciones).map(([etiqueta, valor]) => {
                return typeof valor !== 'string' && typeof valor !== 'number' || !String(valor).trim()
                    ? ''
                    : etiqueta + ': ' + String(valor);
            }).filter(Boolean);
        }
        return [];
    };

    const crearLineaProducto = (producto) => {
        const linea = document.createElement('li');
        const contenido = document.createElement('div');
        const nombre = document.createElement('strong');
        nombre.textContent = typeof producto.nombre === 'string' && producto.nombre.trim()
            ? producto.nombre
            : 'Producto';
        const detalle = document.createElement('span');
        detalle.textContent = 'Cantidad: ' + normalizarCantidad(producto.cantidad);
        contenido.append(nombre, detalle);

        const personalizacion = opcionesPersonalizacion(producto);
        if (personalizacion.length) {
            const opciones = document.createElement('small');
            opciones.textContent = personalizacion.join(' · ');
            contenido.appendChild(opciones);
        }

        const subtotal = document.createElement('strong');
        subtotal.textContent = formatoPrecio.format(
            normalizarPrecio(producto.precio) * normalizarCantidad(producto.cantidad)
        );
        linea.append(contenido, subtotal);
        return linea;
    };

    const pintarResumen = (productos, descuento) => {
        const calculo = calcularPedido(productos, descuento);
        const listaProductos = document.getElementById('checkoutProductos');
        listaProductos.replaceChildren();
        productos.forEach((producto) => listaProductos.appendChild(crearLineaProducto(producto)));

        document.getElementById('checkoutSubtotal').textContent = formatoPrecio.format(calculo.subtotal);
        document.getElementById('checkoutTotal').textContent = formatoPrecio.format(calculo.total);
        const lineaDescuento = document.getElementById('checkoutDescuento');
        lineaDescuento.replaceChildren();
        if (calculo.descuentoAplicado) {
            const linea = document.createElement('p');
            linea.textContent = calculo.descuentoAplicado.tipo === 'envio-gratis'
                ? 'Envío gratis'
                : 'Descuento (' + calculo.descuentoAplicado.codigo + '): −'
                    + formatoPrecio.format(calculo.descuentoAplicado.monto);
            lineaDescuento.appendChild(linea);
        }
        return calculo;
    };

    const actualizarIndicador = () => {
        const pedidoConfirmado = !checkoutExito.hidden;
        document.querySelectorAll('.checkout-paso').forEach((elemento) => {
            const numeroPaso = Number(elemento.dataset.step);
            const completado = pedidoConfirmado || numeroPaso < pasoActual;
            elemento.classList.toggle('completado', completado);
            elemento.classList.toggle('actual', !pedidoConfirmado && numeroPaso === pasoActual);
            elemento.removeAttribute('aria-current');
            if (!pedidoConfirmado && numeroPaso === pasoActual) {
                elemento.setAttribute('aria-current', 'step');
            }
        });
    };

    const cambiarPaso = (numeroPaso, anunciar = true) => {
        pasoActual = numeroPaso;
        pasos.forEach((paso, indice) => {
            paso.panel.hidden = indice + 1 !== pasoActual;
        });
        actualizarIndicador();
        if (anunciar) {
            const paso = pasos[pasoActual - 1];
            checkoutAnuncio.textContent = paso.anuncio;
            paso.titulo.focus();
        }
    };

    const guardarDireccionDesdeFormulario = () => {
        camposDireccion.forEach((campo) => {
            direccion[campo.name] = campo.value.trim();
        });
    };

    const pintarRevisionDireccion = () => {
        const lista = document.getElementById('checkoutRevisionDireccion');
        lista.replaceChildren();
        camposDireccionEtiquetas.forEach(([campo, etiqueta]) => {
            const contenedor = document.createElement('div');
            const termino = document.createElement('dt');
            termino.textContent = etiqueta;
            const valor = document.createElement('dd');
            valor.textContent = direccion[campo] || '—';
            contenedor.append(termino, valor);
            lista.appendChild(contenedor);
        });
    };

    const pintarRevision = () => {
        pintarRevisionDireccion();
        const lista = document.getElementById('checkoutRevisionProductos');
        lista.replaceChildren();
        carritoActual.forEach((producto) => lista.appendChild(crearLineaProducto(producto)));
        const calculo = pintarResumen(carritoActual, descuentoActual);
        const detalleMetodo = metodoPago === 'Tarjeta de crédito o débito'
            ? (numeroTarjeta ? 'Tarjeta terminación ' + numeroTarjeta.slice(-4) : 'Tarjeta')
            : metodoPago === 'Transferencia bancaria'
                ? 'Transferencia bancaria · Referencia ' + numeroPedido
                : 'Monedero electrónico · saldo restante '
                    + formatoMonto(Math.max(0, saldoDisponibleMonedero - calculo.total));
        document.getElementById('checkoutRevisionMetodo').textContent = detalleMetodo;
        document.getElementById('checkoutRevisionTotal').textContent = formatoPrecio.format(calculo.total);
        botonConfirmarPedido.textContent = 'Pagar ' + formatoMonto(calculo.total);
        botonConfirmarPedido.disabled = metodoPago === 'Monedero electrónico'
            && calculo.total > saldoDisponibleMonedero;
    };

    const pintarDatosPago = () => {
        const calculo = calcularPedido(carritoActual, descuentoActual);
        const datosTransferencia = {
            transferenciaBanco: 'Banco Ejemplo',
            transferenciaBeneficiario: 'Ana Kaidien - Creaciones Artesanales',
            transferenciaClabe: '000000000000000000',
            transferenciaReferencia: numeroPedido,
            transferenciaConcepto: 'Pedido ' + numeroPedido,
            transferenciaMonto: formatoMonto(calculo.total)
        };
        Object.entries(datosTransferencia).forEach(([id, valor]) => {
            document.getElementById(id).textContent = valor;
        });

        document.getElementById('monederoSaldoDisponible').textContent =
            formatoMonto(saldoDisponibleMonedero);
        document.getElementById('monederoTotal').textContent = formatoMonto(calculo.total);
        document.getElementById('monederoSaldoRestante').textContent =
            formatoMonto(Math.max(0, saldoDisponibleMonedero - calculo.total));
        const mensajeMonedero = document.getElementById('monederoMensaje');
        const saldoInsuficiente = calculo.total > saldoDisponibleMonedero;
        mensajeMonedero.textContent = saldoInsuficiente ? 'Saldo insuficiente (simulado)' : '';
        mensajeMonedero.hidden = !saldoInsuficiente;
    };

    const actualizarMetodoPago = () => {
        const metodoSeleccionado = radiosMetodoPago.find((radio) => radio.checked);
        if (!metodoSeleccionado) {
            return;
        }
        metodoPago = metodoSeleccionado.value;
        radiosMetodoPago.forEach((radio) => {
            radio.setAttribute('aria-expanded', String(radio.checked));
            document.getElementById(radio.getAttribute('aria-controls')).hidden = !radio.checked;
        });
        pintarDatosPago();
    };

    const mostrarCheckout = (productos, descuento, usuario) => {
        carritoActual = productos;
        descuentoActual = descuento;
        actualizarContador(productos);
        checkoutEstado.hidden = true;
        checkoutPasos.hidden = false;
        checkoutLayout.hidden = false;
        checkoutExito.hidden = true;
        mostrarSesionEnNavbar(usuario);
        pintarResumen(productos, descuento);
        cambiarPaso(1, false);
    };

    const mostrarCarritoVacio = () => {
        mostrarEstado('Tu carrito está vacío', 'Ir al catálogo', 'catalogo.html');
        actualizarContador([]);
    };

    const limpiarDatosTarjeta = () => {
        document.getElementById('nombreTarjeta').value = '';
        campoNumeroTarjeta.value = '';
        campoVencimientoTarjeta.value = '';
        campoCvvTarjeta.value = '';
        numeroTarjeta = '';
    };

    const completarPedido = (productos, descuento) => {
        const calculo = calcularPedido(productos, descuento);
        if (metodoPago === 'Monedero electrónico' && calculo.total > saldoDisponibleMonedero) {
            checkoutErrorConfirmacion.textContent = 'Saldo insuficiente (simulado). Elige otro método de pago.';
            checkoutProcesando.hidden = true;
            botonConfirmarPedido.disabled = false;
            document.getElementById('regresarPago').disabled = false;
            radiosMetodoPago.forEach((radio) => {
                radio.disabled = false;
            });
            pagoEnProceso = false;
            return;
        }

        const detallePago = metodoPago === 'Tarjeta de crédito o débito'
            ? { ultimos4: numeroTarjeta.slice(-4) }
            : metodoPago === 'Transferencia bancaria'
                ? { referencia: numeroPedido }
                : {
                    saldoAntes: saldoDisponibleMonedero,
                    saldoDespues: saldoDisponibleMonedero - calculo.total
                };
        checkoutErrorConfirmacion.textContent = '';
        const pedido = {
            numeroPedido,
            fecha: new Date().toISOString(),
            direccion: { ...direccion },
            metodoPago,
            estadoPago: metodoPago === 'Transferencia bancaria'
                ? 'Pendiente de confirmación'
                : 'Pagado',
            detallePago,
            productos,
            descuento: calculo.descuentoAplicado,
            subtotal: calculo.subtotal,
            total: calculo.total
        };

        try {
            sessionStorage.setItem('ultimoPedido', JSON.stringify(pedido));
            sessionStorage.setItem('carrito', '[]');
            sessionStorage.removeItem('descuentoActivo');
        } catch {
            checkoutErrorConfirmacion.textContent = 'No se pudo guardar el pedido en esta sesión. Inténtalo de nuevo.';
            checkoutProcesando.hidden = true;
            botonConfirmarPedido.disabled = false;
            document.getElementById('regresarPago').disabled = false;
            radiosMetodoPago.forEach((radio) => {
                radio.disabled = false;
            });
            pagoEnProceso = false;
            return;
        }

        limpiarDatosTarjeta();
        checkoutProcesando.hidden = true;
        actualizarContador([]);
        checkoutEstado.hidden = true;
        checkoutLayout.hidden = true;
        checkoutPasos.hidden = false;
        checkoutExito.hidden = false;
        checkoutExito.querySelector('#checkoutNumeroPedido').textContent = numeroPedido;
        const mensajeExito = metodoPago === 'Transferencia bancaria'
            ? 'Pedido registrado: pago pendiente de confirmación (simulado)'
            : '¡Pago realizado! Pedido confirmado (simulado)';
        document.getElementById('checkoutTituloExito').textContent = mensajeExito;
        checkoutAnuncio.textContent = mensajeExito + '. Número de pedido: ' + numeroPedido;
        actualizarIndicador();
        document.getElementById('checkoutTituloExito').focus();
    };

    const confirmar = () => {
        if (pagoEnProceso) {
            return;
        }
        checkoutErrorConfirmacion.textContent = '';
        const carritoLeido = leerCarrito();
        if (!carritoLeido.correcto) {
            checkoutErrorConfirmacion.textContent = 'No fue posible leer el carrito. Inténtalo de nuevo.';
            return;
        }
        if (!carritoLeido.productos.length) {
            mostrarCarritoVacio();
            return;
        }

        const descuentoLeido = leerDescuento();
        if (!descuentoLeido.correcto) {
            checkoutErrorConfirmacion.textContent = 'No fue posible leer el descuento. Inténtalo de nuevo.';
            return;
        }

        const calculo = calcularPedido(carritoLeido.productos, descuentoLeido.descuento);
        if (metodoPago === 'Monedero electrónico' && calculo.total > saldoDisponibleMonedero) {
            checkoutErrorConfirmacion.textContent = 'Saldo insuficiente (simulado). Elige otro método de pago.';
            return;
        }

        pagoEnProceso = true;
        botonConfirmarPedido.disabled = true;
        document.getElementById('regresarPago').disabled = true;
        radiosMetodoPago.forEach((radio) => {
            radio.disabled = true;
        });
        checkoutProcesando.hidden = false;
        window.setTimeout(() => {
            completarPedido(carritoLeido.productos, descuentoLeido.descuento);
        }, 1500);
    };

    const usuarioLeido = leerSesion('usuarioActivo');
    if (!usuarioLeido.correcto) {
        mostrarEstado('No fue posible acceder al almacenamiento de esta sesión. Habilítalo e inténtalo de nuevo.');
        return;
    }
    if (!usuarioLeido.valor) {
        mostrarEstado('Inicia sesión para continuar con tu compra', 'Ir a iniciar sesión', 'login.html');
        window.setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const carritoLeido = leerCarrito();
    if (!carritoLeido.correcto) {
        mostrarEstado('No fue posible acceder al carrito de esta sesión. Habilita el almacenamiento e inténtalo de nuevo.');
        return;
    }
    if (!carritoLeido.productos.length) {
        mostrarCarritoVacio();
        return;
    }

    const descuentoLeido = leerDescuento();
    if (!descuentoLeido.correcto) {
        mostrarEstado('No fue posible acceder al descuento de esta sesión. Habilita el almacenamiento e inténtalo de nuevo.');
        return;
    }
    mostrarCheckout(carritoLeido.productos, descuentoLeido.descuento, usuarioLeido.valor);

    formDireccion.addEventListener('submit', (evento) => {
        evento.preventDefault();
        guardarDireccionDesdeFormulario();
        cambiarPaso(2);
    });

    formPago.addEventListener('change', (evento) => {
        if (evento.target.matches('input[name="metodoPago"]')) {
            actualizarMetodoPago();
        }
    });

    formPago.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const metodoSeleccionado = formPago.querySelector('input[name="metodoPago"]:checked');
        if (metodoSeleccionado) {
            metodoPago = metodoSeleccionado.value;
        }
        const calculo = calcularPedido(carritoActual, descuentoActual);
        if (metodoPago === 'Monedero electrónico' && calculo.total > saldoDisponibleMonedero) {
            document.getElementById('monederoMensaje').textContent = 'Saldo insuficiente (simulado)';
            document.getElementById('monederoMensaje').hidden = false;
            return;
        }
        pintarRevision();
        cambiarPaso(3);
    });

    const formatearSoloDigitos = (campo, maximo, separador = '') => {
        const digitos = campo.value.replace(/\D/g, '').slice(0, maximo);
        if (separador === ' ') {
            campo.value = digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (separador === '/') {
            campo.value = digitos.length > 2
                ? digitos.slice(0, 2) + '/' + digitos.slice(2)
                : digitos;
        } else {
            campo.value = digitos;
        }
        return digitos;
    };

    campoNumeroTarjeta.addEventListener('input', () => {
        numeroTarjeta = formatearSoloDigitos(campoNumeroTarjeta, 16, ' ');
    });
    campoVencimientoTarjeta.addEventListener('input', () => {
        formatearSoloDigitos(campoVencimientoTarjeta, 4, '/');
    });
    campoCvvTarjeta.addEventListener('input', () => {
        formatearSoloDigitos(campoCvvTarjeta, 4);
    });

    formPago.addEventListener('click', async (evento) => {
        const botonCopiar = evento.target.closest('[data-copiar]');
        if (!botonCopiar) {
            return;
        }
        const elemento = document.getElementById(botonCopiar.dataset.copiar);
        if (!elemento) {
            return;
        }
        try {
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
                return;
            }
            await navigator.clipboard.writeText(elemento.textContent);
            botonCopiar.textContent = 'Copiado';
            window.setTimeout(() => {
                botonCopiar.textContent = 'Copiar';
            }, 1800);
        } catch {
            return;
        }
    });

    document.getElementById('regresarDireccion').addEventListener('click', () => cambiarPaso(1));
    document.getElementById('regresarPago').addEventListener('click', () => cambiarPaso(2));
    botonConfirmarPedido.addEventListener('click', confirmar);
})();

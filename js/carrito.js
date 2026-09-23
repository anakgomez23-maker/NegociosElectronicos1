(() => {
    const actualizarContadorCarrito = () => {
        const contador = document.querySelector('.carrito-contador');

        if (!contador) {
            return;
        }

        let carrito = [];

        try {
            carrito = JSON.parse(sessionStorage.getItem('carrito') || '[]');
        } catch (error) {
            sessionStorage.removeItem('carrito');
        }

        const totalProductos = carrito.reduce((total, producto) => {
            return total + (Number(producto.cantidad) || 0);
        }, 0);

        contador.textContent = totalProductos;
    };

    window.actualizarContadorCarrito = actualizarContadorCarrito;
    actualizarContadorCarrito();
})();
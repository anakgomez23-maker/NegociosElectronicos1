(() => {
    const actualizarContadorCarrito = () => {
        const contador = document.querySelector('.carrito-contador');

        if (!contador) {
            return;
        }

        const totalProductos = Math.max(0, Number(sessionStorage.getItem('carritoContador')) || 0);

        contador.textContent = totalProductos;
    };

    window.actualizarContadorCarrito = actualizarContadorCarrito;
    actualizarContadorCarrito();
})();
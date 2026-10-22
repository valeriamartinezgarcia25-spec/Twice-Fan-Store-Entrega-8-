class Producto {
    constructor(id, nombre, precio, stock) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
    }

    vender(cantidad) {
        if (cantidad > 0 && cantidad <= this.stock) {
            this.stock = this.stock - cantidad;
            return true;
        } else {
            return false;
        }
    }

    devolver(cantidad) {
        this.stock = this.stock + cantidad;
    }

    aplicarDescuento(porcentaje) {
        if (porcentaje > 0 && porcentaje <= 90) {
            this.precio = Math.round(this.precio - (this.precio * porcentaje / 100));
            return true;
        } else {
            return false;
        }
    }
}

// ------------------- VARIABLES -------------------

const COSTO_ENVIO = 12000;
const DESCUENTO = 0.1;
const MINIMO_DESCUENTO = 150000;
const DESCUENTO_PRODUCTO = 10;
const ID_INICIAL = 6;

// Claves del localStorage
const CLAVE_CATALOGO = "catalogoMerch";
const CLAVE_CARRITO = "carritoMerch";
const CLAVE_ID = "siguienteId";
const CLAVE_CLIENTE = "nombreCliente";

// Elementos del DOM
const cajaMensaje = document.getElementById("mensaje");
const seccionEstadisticas = document.getElementById("estadisticas");
const botonRestablecer = document.getElementById("boton-restablecer");
const inputNombre = document.getElementById("input-nombre");
const inputPrecio = document.getElementById("input-precio");
const inputStock = document.getElementById("input-stock");
const botonAgregar = document.getElementById("boton-agregar");
const inputBuscador = document.getElementById("input-buscador");
const contenedorItems = document.getElementById("contenedor-items");
const inputCliente = document.getElementById("input-cliente");
const contenedorCarrito = document.getElementById("contenedor-carrito");
const contenedorTotales = document.getElementById("totales");
const botonPagar = document.getElementById("boton-pagar");
const botonVaciar = document.getElementById("boton-vaciar");
const resumenPago = document.querySelector("#resumen-pago");

// Variables que cambian (se llenan al iniciar leyendo el storage)
let catalogoMerch = [];
let carrito = [];
let siguienteId = ID_INICIAL;
let idResaltado = null;
let temporizador = null;

// ------------------- FUNCIONES -------------------

const calcularSubtotal = (cantidad, precio) => cantidad * precio;

const formatearPrecio = (valor) => "$" + valor.toLocaleString("es-CO");

const limpiarTexto = (texto) => texto.replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ternario en vez de if/else
const calcularDescuento = function (subtotalCompra) {
    return subtotalCompra >= MINIMO_DESCUENTO ? subtotalCompra * DESCUENTO : 0;
};

// ----- STORAGE -----

function guardarEnStorage(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

function leerDeStorage(clave) {
    const texto = localStorage.getItem(clave);

    return texto ? JSON.parse(texto) : null;
}

function guardarCatalogo() {
    guardarEnStorage(CLAVE_CATALOGO, catalogoMerch);
    guardarEnStorage(CLAVE_ID, siguienteId);
}

function guardarCarrito() {
    guardarEnStorage(CLAVE_CARRITO, carrito);
}

function crearCatalogoInicial() {
    return [
        new Producto(1, "Álbum", 65000, 10),
        new Producto(2, "Pack de photocards", 15000, 20),
        new Producto(3, "Poster", 25000, 8),
        new Producto(4, "Hoodie", 120000, 5),
        new Producto(5, "Llavero", 12000, 15)
    ];
}

// Si no hay nada guardado (??) usa el catálogo inicial
// Los objetos del storage no tienen métodos, así que se vuelven a crear con new
function cargarCatalogo() {
    const datos = leerDeStorage(CLAVE_CATALOGO) ?? crearCatalogoInicial();

    return datos.map(({ id, nombre, precio, stock }) => new Producto(id, nombre, precio, stock));
}

function cargarCarrito() {
    return leerDeStorage(CLAVE_CARRITO) ?? [];
}

// ----- TIENDA -----

function calcularTotalCarrito(lista) {
    return lista.reduce((acumulado, item) => acumulado + calcularSubtotal(item.cantidad, item.precio), 0);
}

// Feedback visual: tipo puede ser "exito", "error" o "info"
function mostrarMensaje(texto, tipo) {
    cajaMensaje.textContent = texto;
    cajaMensaje.className = "mensaje " + tipo;

    clearTimeout(temporizador);

    temporizador = setTimeout(function () {
        cajaMensaje.className = "mensaje oculto";
    }, 3000);
}

function filtrarCatalogo(lista, textoBuscado) {
    const texto = textoBuscado.toLowerCase().trim();

    return lista.filter(producto => producto.nombre.toLowerCase().includes(texto));
}

function mostrarEstadisticas() {
    const disponibles = catalogoMerch.filter(producto => producto.stock > 0).length;
    const hayAgotados = catalogoMerch.some(producto => producto.stock === 0);
    const valorInventario = catalogoMerch.reduce((acumulado, producto) => acumulado + producto.precio * producto.stock, 0);

    seccionEstadisticas.innerHTML = `
        <div class="estadistica"><span>${catalogoMerch.length}</span>Productos</div>
        <div class="estadistica"><span>${disponibles}</span>Disponibles</div>
        <div class="estadistica"><span>${hayAgotados ? "Sí" : "No"}</span>Hay agotados</div>
        <div class="estadistica"><span>${formatearPrecio(valorInventario)}</span>Valor del inventario</div>
    `;
}

// ----- RENDERIZADO -----

function renderizarCatalogo(lista) {
    if (lista.length === 0) {
        contenedorItems.innerHTML = `<p class="vacio">No hay productos para mostrar</p>`;
        return;
    }

    let html = "";

    for (const producto of lista) {
        // Destructuring
        const { id, nombre, precio, stock } = producto;

        const claseAgotado = stock === 0 ? "agotado" : "";
        const claseResaltado = id === idResaltado ? "resaltado" : "";
        const textoStock = stock === 0 ? "Agotado" : "Stock: " + stock;
        const desactivado = stock === 0 ? "disabled" : "";

        html += `
            <article class="tarjeta ${claseAgotado} ${claseResaltado}">
                <h3>${nombre}</h3>
                <p class="precio">${formatearPrecio(precio)}</p>
                <p>${textoStock}</p>
                <div class="botones">
                    <button class="btn-agregar" data-id="${id}" ${desactivado}>🛒 Agregar</button>
                    <button class="btn-descuento secundario" data-id="${id}">-${DESCUENTO_PRODUCTO}%</button>
                    <button class="btn-eliminar" data-id="${id}">Eliminar</button>
                </div>
            </article>
        `;
    }

    contenedorItems.innerHTML = html;

    // Eventos de los botones recién creados
    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    for (const boton of botonesAgregar) {
        boton.addEventListener("click", function () {
            agregarAlCarrito(parseInt(boton.dataset.id));
        });
    }

    const botonesDescuento = document.querySelectorAll(".btn-descuento");
    for (const boton of botonesDescuento) {
        boton.addEventListener("click", function () {
            descontarProducto(parseInt(boton.dataset.id));
        });
    }

    const botonesEliminar = document.querySelectorAll(".btn-eliminar");
    for (const boton of botonesEliminar) {
        boton.addEventListener("click", function () {
            eliminarProducto(parseInt(boton.dataset.id));
        });
    }

    idResaltado = null;
}

function renderizarCarrito() {
    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = `<p class="vacio">Tu carrito está vacío</p>`;
        contenedorTotales.innerHTML = "";
        return;
    }

    let html = "";

    for (const item of carrito) {
        const { id, nombre, precio, cantidad } = item;

        html += `
            <div class="item-carrito">
                <span>${nombre} x${cantidad}</span>
                <span>${formatearPrecio(calcularSubtotal(cantidad, precio))}</span>
                <button class="btn-quitar" data-id="${id}">−</button>
            </div>
        `;
    }

    contenedorCarrito.innerHTML = html;

    const subtotal = calcularTotalCarrito(carrito);
    const descuento = calcularDescuento(subtotal);
    const total = subtotal - descuento + COSTO_ENVIO;

    contenedorTotales.innerHTML = `
        <p><span>Subtotal</span><span>${formatearPrecio(subtotal)}</span></p>
        <p><span>Descuento fan</span><span>-${formatearPrecio(descuento)}</span></p>
        <p><span>Envío</span><span>${formatearPrecio(COSTO_ENVIO)}</span></p>
        <p class="total"><span>TOTAL</span><span>${formatearPrecio(total)}</span></p>
    `;

    const botonesQuitar = document.querySelectorAll(".btn-quitar");
    for (const boton of botonesQuitar) {
        boton.addEventListener("click", function () {
            quitarDelCarrito(parseInt(boton.dataset.id));
        });
    }
}

// Cada vez que algo cambia, se vuelve a dibujar todo
function actualizarVista() {
    const listaFiltrada = filtrarCatalogo(catalogoMerch, inputBuscador.value);

    renderizarCatalogo(listaFiltrada);
    renderizarCarrito();
    mostrarEstadisticas();
}

// ----- ACCIONES (array -> storage -> render) -----

function agregarProductoNuevo() {
    const nombreNuevo = limpiarTexto(inputNombre.value.trim());
    const precioNuevo = parseInt(inputPrecio.value);
    const stockNuevo = parseInt(inputStock.value);

    if (nombreNuevo === "") {
        mostrarMensaje("Escribe el nombre del producto", "error");
    } else if (isNaN(precioNuevo) || precioNuevo <= 0) {
        mostrarMensaje("El precio debe ser un número mayor a 0", "error");
    } else if (isNaN(stockNuevo) || stockNuevo < 0) {
        mostrarMensaje("El stock debe ser un número (0 o más)", "error");
    } else if (catalogoMerch.some(producto => producto.nombre.toLowerCase() === nombreNuevo.toLowerCase())) {
        mostrarMensaje("Ya existe un producto llamado " + nombreNuevo, "error");
    } else {
        const productoNuevo = new Producto(siguienteId, nombreNuevo, precioNuevo, stockNuevo);
        siguienteId++;

        catalogoMerch.push(productoNuevo);
        idResaltado = productoNuevo.id;
        guardarCatalogo();

        inputNombre.value = "";
        inputPrecio.value = "";
        inputStock.value = "";
        inputBuscador.value = "";
        inputNombre.focus();

        mostrarMensaje("✅ Se agregó " + nombreNuevo + " al catálogo", "exito");
        actualizarVista();
    }
}

function eliminarProducto(id) {
    const posicion = catalogoMerch.findIndex(producto => producto.id === id);

    if (posicion !== -1) {
        const { nombre } = catalogoMerch.splice(posicion, 1)[0];

        const posicionCarrito = carrito.findIndex(item => item.id === id);
        if (posicionCarrito !== -1) {
            carrito.splice(posicionCarrito, 1);
        }

        guardarCatalogo();
        guardarCarrito();

        mostrarMensaje("🗑️ Se eliminó " + nombre + " del catálogo", "info");
        actualizarVista();
    }
}

function descontarProducto(id) {
    const producto = catalogoMerch.find(p => p.id === id);

    // ?. evita el error si producto es undefined
    if (producto?.aplicarDescuento(DESCUENTO_PRODUCTO)) {
        const { nombre, precio } = producto;

        idResaltado = producto.id;
        guardarCatalogo();

        mostrarMensaje("🏷️ " + nombre + " ahora cuesta " + formatearPrecio(precio), "exito");
        actualizarVista();
    }
}

function agregarAlCarrito(id) {
    const producto = catalogoMerch.find(p => p.id === id);

    if (!producto) {
        return;
    }

    const { nombre, precio } = producto;
    const vendido = producto.vender(1);

    if (vendido) {
        const itemExistente = carrito.find(item => item.id === id);

        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            carrito.push({ id: id, nombre: nombre, precio: precio, cantidad: 1 });
        }

        guardarCarrito();
        guardarCatalogo();

        resumenPago.innerHTML = "";
    }

    mostrarMensaje(
        vendido ? "🛒 Agregaste " + nombre + " al carrito" : nombre + " está agotado",
        vendido ? "exito" : "error"
    );
    actualizarVista();
}

function quitarDelCarrito(id) {
    const item = carrito.find(i => i.id === id);
    const producto = catalogoMerch.find(p => p.id === id);

    if (item) {
        producto?.devolver(1);

        item.cantidad--;

        if (item.cantidad === 0) {
            const posicion = carrito.indexOf(item);
            carrito.splice(posicion, 1);
        }

        guardarCarrito();
        guardarCatalogo();

        mostrarMensaje("Quitaste 1 " + item.nombre + " del carrito", "info");
        actualizarVista();
    }
}

function vaciarCarrito() {
    if (carrito.length === 0) {
        mostrarMensaje("Tu carrito ya está vacío", "error");
        return;
    }

    for (const item of carrito) {
        const producto = catalogoMerch.find(p => p.id === item.id);

        producto?.devolver(item.cantidad);
    }

    carrito = [];

    guardarCatalogo();
    localStorage.removeItem(CLAVE_CARRITO);

    mostrarMensaje("Se vació el carrito", "info");
    actualizarVista();
}

function armarCuotas(totalCompra) {
    let html = "<ul>";

    for (let cuotas = 1; cuotas <= 3; cuotas++) {
        const valorCuota = Math.round(totalCompra / cuotas);

        html += cuotas === 1
            ? `<li>De contado: ${formatearPrecio(valorCuota)}</li>`
            : `<li>${cuotas} cuotas de ${formatearPrecio(valorCuota)}</li>`;
    }

    html += "</ul>";

    return html;
}

function pagar() {
    if (carrito.length === 0) {
        mostrarMensaje("Tu carrito está vacío, agrega algo primero", "error");
        return;
    }

    // || usa "Once" si el input está vacío
    const nombreCliente = limpiarTexto(inputCliente.value.trim()) || "Once";

    const subtotal = calcularTotalCarrito(carrito);
    const descuento = calcularDescuento(subtotal);
    const total = subtotal - descuento + COSTO_ENVIO;

    const lineas = carrito.map(({ nombre, cantidad }) => `<li>${nombre} x${cantidad}</li>`).join("");

    resumenPago.innerHTML = `
        <div class="resumen">
            <h3>¡Gracias por tu compra, ${nombreCliente}! 💖</h3>
            <ul>${lineas}</ul>
            <p><strong>Total pagado: ${formatearPrecio(total)}</strong></p>
            <p>Opciones de pago:</p>
            ${armarCuotas(total)}
        </div>
    `;

    carrito = [];
    localStorage.removeItem(CLAVE_CARRITO);

    mostrarMensaje("✅ Compra realizada con éxito", "exito");
    actualizarVista();
}

function restablecerTienda() {
    localStorage.clear();

    catalogoMerch = crearCatalogoInicial();
    carrito = [];
    siguienteId = ID_INICIAL;

    inputCliente.value = "";
    inputBuscador.value = "";
    resumenPago.innerHTML = "";

    mostrarMensaje("↺ La tienda volvió a su estado inicial", "info");
    actualizarVista();
}

// ----- INICIO -----

function iniciarSimulador() {
    catalogoMerch = cargarCatalogo();
    carrito = cargarCarrito();
    siguienteId = leerDeStorage(CLAVE_ID) ?? ID_INICIAL;
    inputCliente.value = leerDeStorage(CLAVE_CLIENTE) ?? "";

    // Eventos de click
    botonAgregar.addEventListener("click", agregarProductoNuevo);
    botonPagar.addEventListener("click", pagar);
    botonVaciar.addEventListener("click", vaciarCarrito);
    botonRestablecer.addEventListener("click", restablecerTienda);

    // Eventos de teclado
    inputBuscador.addEventListener("keyup", actualizarVista);

    inputCliente.addEventListener("keyup", function () {
        guardarEnStorage(CLAVE_CLIENTE, inputCliente.value);
    });

    const inputsFormulario = [inputNombre, inputPrecio, inputStock];
    for (const input of inputsFormulario) {
        input.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") {
                agregarProductoNuevo();
            }
        });
    }

    actualizarVista();
}

// ------------------- INICIO DEL PROGRAMA -------------------
iniciarSimulador();
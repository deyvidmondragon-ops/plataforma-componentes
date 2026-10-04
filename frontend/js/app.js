const API = 'http://localhost:3000/api';
let token = localStorage.getItem('token') || null;
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
let productosCache = [];

actualizarContadorCarrito();

// --- Catálogo ---
async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const categorias = await res.json();
  const select = document.getElementById('filtro-categoria');
  categorias.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nombre;
    select.appendChild(opt);
  });
}

async function cargarProductos() {
  const q = document.getElementById('buscar').value;
  const categoria = document.getElementById('filtro-categoria').value;
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoria) params.set('categoria', categoria);

  const res = await fetch(`${API}/productos?${params}`);
  productosCache = await res.json();
  renderizarCatalogo(productosCache);
  renderizarSelectsCompatibilidad(productosCache);
}

function renderizarCatalogo(productos) {
  const cont = document.getElementById('catalogo');
  cont.innerHTML = '';
  productos.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.nombre}</h3>
      <p>${p.marca || ''}</p>
      <p class="precio">$${Number(p.precio).toLocaleString('es-CO')}</p>
      <p>Stock: ${p.stock}</p>
      <label><input type="checkbox" class="chk-comparar" value="${p.id}" /> Comparar</label>
      <button data-id="${p.id}" class="btn-agregar">Agregar al carrito</button>
    `;
    cont.appendChild(card);
  });

  document.querySelectorAll('.btn-agregar').forEach((btn) => {
    btn.addEventListener('click', () => agregarAlCarrito(Number(btn.dataset.id)));
  });
}

// --- Compatibilidad ---
function renderizarSelectsCompatibilidad(productos) {
  const llenar = (id, filtroFn) => {
    const select = document.getElementById(id);
    select.innerHTML = select.firstElementChild.outerHTML; // conserva la opción vacía
    productos.filter(filtroFn).forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      select.appendChild(opt);
    });
  };
  llenar('sel-cpu', (p) => p.especificaciones?.socket && !p.especificaciones?.tipo_ram);
  llenar('sel-placa', (p) => p.especificaciones?.tipo_ram);
  llenar('sel-ram', (p) => p.especificaciones?.tipo);
}

document.getElementById('btn-verificar').addEventListener('click', async () => {
  const cpu_id = document.getElementById('sel-cpu').value;
  const placa_id = document.getElementById('sel-placa').value;
  const ram_id = document.getElementById('sel-ram').value;
  const resultadoDiv = document.getElementById('resultado-compat');

  if (!cpu_id || !placa_id || !ram_id) {
    resultadoDiv.textContent = 'Selecciona CPU, placa base y RAM.';
    return;
  }

  const res = await fetch(`${API}/compatibilidad/verificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpu_id, placa_id, ram_id }),
  });
  const data = await res.json();

  if (data.compatible) {
    resultadoDiv.className = 'ok';
    resultadoDiv.textContent = '✅ Los componentes son compatibles.';
  } else {
    resultadoDiv.className = 'error';
    resultadoDiv.textContent = '⚠️ ' + (data.problemas || []).join(' ');
  }
});

// --- Carrito ---
function agregarAlCarrito(producto_id) {
  const item = carrito.find((i) => i.producto_id === producto_id);
  if (item) item.cantidad += 1;
  else carrito.push({ producto_id, cantidad: 1 });
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  document.getElementById('cart-count').textContent = total;
}

// --- Comparador ---
document.getElementById('btn-comparar').addEventListener('click', async () => {
  const ids = [...document.querySelectorAll('.chk-comparar:checked')].map((c) => c.value);
  if (ids.length < 2) {
    alert('Selecciona al menos 2 productos para comparar.');
    return;
  }
  const res = await fetch(`${API}/productos/comparar?ids=${ids.join(',')}`);
  const productos = await res.json();
  console.table(productos); // base para una vista de comparación más elaborada
  alert('Comparación en la consola del navegador (próximo paso: tabla visual).');
});

// --- Login ---
const dialogLogin = document.getElementById('dialog-login');
document.getElementById('btn-login').addEventListener('click', () => dialogLogin.showModal());
document.getElementById('btn-close-login').addEventListener('click', () => dialogLogin.close());

document.getElementById('btn-submit-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    alert('Credenciales inválidas');
    return;
  }
  const data = await res.json();
  token = data.token;
  localStorage.setItem('token', token);
  dialogLogin.close();
  alert(`Bienvenido, ${data.usuario.nombre}`);
});

document.getElementById('buscar').addEventListener('input', cargarProductos);
document.getElementById('filtro-categoria').addEventListener('change', cargarProductos);

cargarCategorias().then(cargarProductos);

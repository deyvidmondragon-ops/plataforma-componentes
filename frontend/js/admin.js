const API = 'http://localhost:3000/api';
let token = localStorage.getItem('admin_token') || null;
let categoriasCache = [];

// --- Auth ---
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'No se pudo iniciar sesión';
      return;
    }
    if (data.usuario.rol !== 'admin') {
      errorEl.textContent = 'Este usuario no tiene rol de administrador.';
      return;
    }

    token = data.token;
    localStorage.setItem('admin_token', token);
    document.getElementById('admin-nombre').textContent = `👤 ${data.usuario.nombre}`;
    mostrarPanel();
  } catch (err) {
    errorEl.textContent = 'Error de conexión con el servidor.';
  }
}

function mostrarPanel() {
  document.getElementById('login-section').hidden = true;
  document.getElementById('panel').hidden = false;
  document.getElementById('btn-logout').hidden = false;
  cargarCategorias();
  cargarProductos();
  cargarPedidos();
}

function logout() {
  token = null;
  localStorage.removeItem('admin_token');
  document.getElementById('login-section').hidden = false;
  document.getElementById('panel').hidden = true;
  document.getElementById('btn-logout').hidden = true;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// --- Tabs ---
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((s) => (s.hidden = true));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;
  });
});

// --- Categorías ---
async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  categoriasCache = await res.json();

  const select = document.getElementById('producto-categoria');
  select.innerHTML = categoriasCache.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('');

  const tbody = document.querySelector('#tabla-categorias tbody');
  tbody.innerHTML = categoriasCache
    .map((c) => `<tr><td>${c.nombre}</td><td>${c.descripcion || ''}</td></tr>`)
    .join('');
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('categoria-nombre').value;
  const descripcion = document.getElementById('categoria-descripcion').value;

  const res = await fetch(`${API}/categorias`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ nombre, descripcion }),
  });

  if (res.ok) {
    e.target.reset();
    cargarCategorias();
  } else {
    const data = await res.json();
    alert(data.error || 'Error al crear la categoría');
  }
});

// --- Productos ---
async function cargarProductos() {
  const res = await fetch(`${API}/productos`);
  const productos = await res.json();

  const tbody = document.querySelector('#tabla-productos tbody');
  tbody.innerHTML = productos
    .map((p) => {
      const categoria = categoriasCache.find((c) => c.id === p.categoria_id);
      return `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.marca || ''}</td>
          <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
          <td>${p.stock}</td>
          <td>${categoria ? categoria.nombre : '—'}</td>
          <td>
            <button class="btn-editar" data-id="${p.id}">Editar</button>
            <button class="btn-eliminar" data-id="${p.id}">Eliminar</button>
          </td>
        </tr>`;
    })
    .join('');

  document.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', () => editarProducto(productos.find((p) => p.id == btn.dataset.id)));
  });
  document.querySelectorAll('.btn-eliminar').forEach((btn) => {
    btn.addEventListener('click', () => eliminarProducto(btn.dataset.id));
  });
}

function editarProducto(p) {
  document.getElementById('producto-id').value = p.id;
  document.getElementById('producto-nombre').value = p.nombre;
  document.getElementById('producto-marca').value = p.marca || '';
  document.getElementById('producto-precio').value = p.precio;
  document.getElementById('producto-stock').value = p.stock;
  document.getElementById('producto-categoria').value = p.categoria_id || '';
  document.getElementById('producto-imagen').value = p.imagen_url || '';
  document.getElementById('producto-descripcion').value = p.descripcion || '';
  document.getElementById('producto-specs').value = JSON.stringify(p.especificaciones || {});
  document.getElementById('btn-guardar-producto').textContent = 'Guardar cambios';
  document.getElementById('btn-cancelar-edicion').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limpiarFormularioProducto() {
  document.getElementById('form-producto').reset();
  document.getElementById('producto-id').value = '';
  document.getElementById('btn-guardar-producto').textContent = 'Crear producto';
  document.getElementById('btn-cancelar-edicion').hidden = true;
}

document.getElementById('btn-cancelar-edicion').addEventListener('click', limpiarFormularioProducto);

document.getElementById('form-producto').addEventListener('submit', async (e) => {
  e.preventDefault();

  let especificaciones = {};
  const specsTexto = document.getElementById('producto-specs').value.trim();
  if (specsTexto) {
    try {
      especificaciones = JSON.parse(specsTexto);
    } catch {
      alert('Las especificaciones deben ser JSON válido, ej: {"socket":"AM5"}');
      return;
    }
  }

  const id = document.getElementById('producto-id').value;
  const payload = {
    nombre: document.getElementById('producto-nombre').value,
    marca: document.getElementById('producto-marca').value,
    precio: Number(document.getElementById('producto-precio').value),
    stock: Number(document.getElementById('producto-stock').value),
    categoria_id: Number(document.getElementById('producto-categoria').value) || null,
    imagen_url: document.getElementById('producto-imagen').value,
    descripcion: document.getElementById('producto-descripcion').value,
    especificaciones,
  };

  const url = id ? `${API}/productos/${id}` : `${API}/productos`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });

  if (res.ok) {
    limpiarFormularioProducto();
    cargarProductos();
  } else {
    const data = await res.json();
    alert(data.error || 'Error al guardar el producto');
  }
});

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  const res = await fetch(`${API}/productos/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok || res.status === 204) cargarProductos();
  else alert('Error al eliminar el producto');
}

// --- Pedidos ---
const ESTADOS = ['pendiente', 'procesado', 'enviado', 'entregado'];

async function cargarPedidos() {
  const res = await fetch(`${API}/pedidos`, { headers: authHeaders() });
  if (!res.ok) return;
  const pedidos = await res.json();

  const tbody = document.querySelector('#tabla-pedidos tbody');
  tbody.innerHTML = pedidos
    .map(
      (p) => `
        <tr>
          <td>${p.id}</td>
          <td>${p.usuario_id}</td>
          <td>$${Number(p.total).toLocaleString('es-CO')}</td>
          <td>${p.estado}</td>
          <td>${new Date(p.creado_en).toLocaleString('es-CO')}</td>
          <td>
            <select class="cambiar-estado" data-id="${p.id}">
              ${ESTADOS.map((e) => `<option value="${e}" ${e === p.estado ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
          </td>
        </tr>`
    )
    .join('');

  document.querySelectorAll('.cambiar-estado').forEach((select) => {
    select.addEventListener('change', async () => {
      await fetch(`${API}/pedidos/${select.dataset.id}/estado`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ estado: select.value }),
      });
    });
  });
}

// --- Eventos iniciales ---
document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('btn-logout').addEventListener('click', logout);

if (token) mostrarPanel();

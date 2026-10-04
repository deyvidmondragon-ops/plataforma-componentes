# Plataforma de Componentes Informáticos

Proyecto grupal — Ingeniería Web (CUN). E-commerce de componentes y periféricos
con catálogo, buscador/filtros, comparador y verificador básico de compatibilidad.

## Estructura

```
plataforma-componentes/
├── backend/          # API REST (Node.js + Express + PostgreSQL)
│   ├── db/
│   │   ├── schema.sql     # Esquema de la base de datos + datos de ejemplo
│   │   └── pool.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js         # Registro / login (JWT)
│   │   ├── categorias.js
│   │   ├── productos.js    # Catálogo, búsqueda/filtros, comparador, CRUD admin
│   │   ├── compatibilidad.js
│   │   └── pedidos.js      # Carrito -> pedido, historial, panel admin
│   └── server.js
└── frontend/          # HTML/CSS/JS plano, consume la API
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## 1. Base de datos (PostgreSQL / pgAdmin)

1. Crea una base de datos llamada `plataforma_componentes` desde pgAdmin.
2. Abre el Query Tool sobre esa base y ejecuta el contenido de `backend/db/schema.sql`.
   Esto crea las tablas y deja productos de ejemplo para probar el comparador
   y el verificador de compatibilidad.

## 2. Backend (PowerShell)

```powershell
cd backend
npm install
copy .env.example .env
# Edita .env: pon tu password de PostgreSQL y un JWT_SECRET cualquiera
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`. Puedes probar
`http://localhost:3000/api/salud` en el navegador o con Thunder Client para
confirmar que responde `{ "ok": true }`.

### Endpoints principales (pruébalos con Thunder Client)

- `POST /api/auth/registro` / `POST /api/auth/login`
- `GET /api/categorias`
- `GET /api/productos?q=ryzen&categoria=1&marca=AMD`
- `GET /api/productos/comparar?ids=1,2`
- `POST /api/compatibilidad/verificar` → `{ "cpu_id":1, "placa_id":2, "ram_id":3 }`
- `POST /api/pedidos` (requiere header `Authorization: Bearer <token>`)
- `GET /api/pedidos/mios`

Las rutas de creación/edición/eliminación de productos y categorías, y la
gestión de pedidos (`GET /api/pedidos`, `PUT /api/pedidos/:id/estado`),
requieren un usuario con `rol = 'admin'`. Para crear uno, regístrate normal
y luego en pgAdmin ejecuta:

```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'tu_correo@ejemplo.com';
```

## 3. Frontend

No necesita build: abre `frontend/index.html` directamente en el navegador
(o sírvelo con la extensión "Live Server" de VS Code). Ya consume la API en
`http://localhost:3000`.

## Próximos pasos sugeridos

1. Agregar más campos de especificaciones por categoría (GPU, fuente, etc.)
   y ampliar las reglas de `compatibilidad.js`.
2. Construir la vista visual del comparador (la base ya llega por
   `GET /api/productos/comparar`, hoy solo se imprime en consola).
3. Panel administrativo (otra página HTML o sección protegida) para CRUD
   de productos/categorías e historial/estado de pedidos.
4. Cuando el proyecto esté estable, mover el backend y la base de datos a
   AWS (por ejemplo EC2 o Elastic Beanstalk + RDS para PostgreSQL), como
   contempla el alcance del documento.
5. Validaciones de formulario más robustas y manejo de errores en el frontend.

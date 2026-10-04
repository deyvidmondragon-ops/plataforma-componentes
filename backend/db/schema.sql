-- Plataforma de Componentes Informáticos
-- Esquema de base de datos PostgreSQL

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Productos: las especificaciones técnicas quedan en JSONB para no
-- crear una tabla distinta por cada tipo de componente (CPU, RAM, etc.)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100),
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    descripcion TEXT,
    especificaciones JSONB DEFAULT '{}'::jsonb,
    -- Ej. para CPU: {"socket": "AM5", "tdp": 65}
    -- Ej. para placa base: {"socket": "AM5", "tipo_ram": "DDR5"}
    -- Ej. para RAM: {"tipo": "DDR5", "velocidad": 6000}
    imagen_url VARCHAR(500),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'procesado', 'enviado', 'entregado')),
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL
);

-- Datos de ejemplo para poder probar el catálogo y el verificador de compatibilidad
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Procesadores', 'CPUs de escritorio'),
    ('Placas base', 'Motherboards'),
    ('Memoria RAM', 'Módulos de memoria'),
    ('Periféricos', 'Teclados, mouses, monitores')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO productos (categoria_id, nombre, marca, precio, stock, especificaciones) VALUES
    (1, 'AMD Ryzen 5 7600', 'AMD', 950000, 10, '{"socket": "AM5", "tdp": 65}'),
    (2, 'ASUS TUF Gaming B650', 'ASUS', 780000, 5, '{"socket": "AM5", "tipo_ram": "DDR5"}'),
    (3, 'Kingston Fury 16GB 6000MHz', 'Kingston', 350000, 20, '{"tipo": "DDR5", "velocidad": 6000}')
ON CONFLICT DO NOTHING;

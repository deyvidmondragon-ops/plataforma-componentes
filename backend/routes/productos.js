const express = require('express');
const pool = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/productos?categoria=1&marca=AMD&precio_min=0&precio_max=1000000&q=ryzen
router.get('/', async (req, res) => {
  const { categoria, marca, precio_min, precio_max, q } = req.query;
  const condiciones = [];
  const valores = [];

  if (categoria) {
    valores.push(categoria);
    condiciones.push(`categoria_id = $${valores.length}`);
  }
  if (marca) {
    valores.push(`%${marca}%`);
    condiciones.push(`marca ILIKE $${valores.length}`);
  }
  if (precio_min) {
    valores.push(precio_min);
    condiciones.push(`precio >= $${valores.length}`);
  }
  if (precio_max) {
    valores.push(precio_max);
    condiciones.push(`precio <= $${valores.length}`);
  }
  if (q) {
    valores.push(`%${q}%`);
    condiciones.push(`nombre ILIKE $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const resultado = await pool.query(
    `SELECT * FROM productos ${where} ORDER BY creado_en DESC`,
    valores
  );
  res.json(resultado.rows);
});

// GET /api/productos/comparar?ids=1,2,3
router.get('/comparar', async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length < 2) {
    return res.status(400).json({ error: 'Se requieren al menos 2 ids para comparar' });
  }
  const resultado = await pool.query(
    `SELECT * FROM productos WHERE id = ANY($1::int[])`,
    [ids]
  );
  res.json(resultado.rows);
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  const resultado = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
  if (!resultado.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(resultado.rows[0]);
});

// POST /api/productos (solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { categoria_id, nombre, marca, precio, stock, descripcion, especificaciones, imagen_url } = req.body;
    const resultado = await pool.query(
      `INSERT INTO productos (categoria_id, nombre, marca, precio, stock, descripcion, especificaciones, imagen_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [categoria_id, nombre, marca, precio, stock || 0, descripcion, especificaciones || {}, imagen_url]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id (solo admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, marca, precio, stock, descripcion, especificaciones, imagen_url, categoria_id } = req.body;
    const resultado = await pool.query(
      `UPDATE productos SET nombre=$1, marca=$2, precio=$3, stock=$4, descripcion=$5,
       especificaciones=$6, imagen_url=$7, categoria_id=$8 WHERE id=$9 RETURNING *`,
      [nombre, marca, precio, stock, descripcion, especificaciones, imagen_url, categoria_id, req.params.id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/productos/:id (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;

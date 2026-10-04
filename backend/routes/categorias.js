const express = require('express');
const pool = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categorias
router.get('/', async (req, res) => {
  const resultado = await pool.query('SELECT * FROM categorias ORDER BY nombre');
  res.json(resultado.rows);
});

// POST /api/categorias (solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const resultado = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

module.exports = router;

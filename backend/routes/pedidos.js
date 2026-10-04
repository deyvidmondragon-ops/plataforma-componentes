const express = require('express');
const pool = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/pedidos  — crea un pedido a partir de items del carrito
// Body: { items: [{ producto_id, cantidad }] }
router.post('/', verificarToken, async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    await cliente.query('BEGIN');

    let total = 0;
    const detalles = [];

    for (const item of items) {
      const { rows } = await cliente.query('SELECT * FROM productos WHERE id = $1 FOR UPDATE', [item.producto_id]);
      const producto = rows[0];
      if (!producto) throw new Error(`Producto ${item.producto_id} no existe`);
      if (producto.stock < item.cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}`);

      total += Number(producto.precio) * item.cantidad;
      detalles.push({ producto_id: producto.id, cantidad: item.cantidad, precio_unitario: producto.precio });

      await cliente.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [item.cantidad, producto.id]);
    }

    const pedido = await cliente.query(
      'INSERT INTO pedidos (usuario_id, total) VALUES ($1, $2) RETURNING *',
      [req.usuario.id, total]
    );

    for (const d of detalles) {
      await cliente.query(
        'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES ($1,$2,$3,$4)',
        [pedido.rows[0].id, d.producto_id, d.cantidad, d.precio_unitario]
      );
    }

    await cliente.query('COMMIT');
    res.status(201).json(pedido.rows[0]);
  } catch (err) {
    await cliente.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al crear el pedido' });
  } finally {
    cliente.release();
  }
});

// GET /api/pedidos/mios — historial del cliente autenticado
router.get('/mios', verificarToken, async (req, res) => {
  const resultado = await pool.query(
    'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY creado_en DESC',
    [req.usuario.id]
  );
  res.json(resultado.rows);
});

// GET /api/pedidos — todos los pedidos (solo admin)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const resultado = await pool.query('SELECT * FROM pedidos ORDER BY creado_en DESC');
  res.json(resultado.rows);
});

// PUT /api/pedidos/:id/estado — actualizar estado (solo admin)
router.put('/:id/estado', verificarToken, soloAdmin, async (req, res) => {
  const { estado } = req.body;
  const resultado = await pool.query(
    'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
    [estado, req.params.id]
  );
  if (!resultado.rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(resultado.rows[0]);
});

module.exports = router;

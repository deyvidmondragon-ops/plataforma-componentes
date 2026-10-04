const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/compatibilidad/verificar
// Body: { cpu_id, placa_id, ram_id }
// Reglas básicas: socket del CPU == socket de la placa;
// tipo de RAM soportado por la placa == tipo de la RAM.
router.post('/verificar', async (req, res) => {
  try {
    const { cpu_id, placa_id, ram_id } = req.body;
    if (!cpu_id || !placa_id || !ram_id) {
      return res.status(400).json({ error: 'cpu_id, placa_id y ram_id son obligatorios' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM productos WHERE id = ANY($1::int[])',
      [[cpu_id, placa_id, ram_id]]
    );

    const cpu = rows.find((p) => p.id == cpu_id);
    const placa = rows.find((p) => p.id == placa_id);
    const ram = rows.find((p) => p.id == ram_id);

    if (!cpu || !placa || !ram) {
      return res.status(404).json({ error: 'Alguno de los productos no existe' });
    }

    const problemas = [];

    const socketCpu = cpu.especificaciones?.socket;
    const socketPlaca = placa.especificaciones?.socket;
    if (socketCpu && socketPlaca && socketCpu !== socketPlaca) {
      problemas.push(
        `El socket del procesador (${socketCpu}) no coincide con el de la placa base (${socketPlaca}).`
      );
    }

    const tipoRamPlaca = placa.especificaciones?.tipo_ram;
    const tipoRam = ram.especificaciones?.tipo;
    if (tipoRamPlaca && tipoRam && tipoRamPlaca !== tipoRam) {
      problemas.push(
        `La placa base soporta memoria ${tipoRamPlaca}, pero la RAM seleccionada es ${tipoRam}.`
      );
    }

    res.json({
      compatible: problemas.length === 0,
      problemas,
      componentes: { cpu: cpu.nombre, placa: placa.nombre, ram: ram.nombre },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar compatibilidad' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../db/database');

router.get('/stats', async (req, res) => {
  try {
    const totalPatients = await queryOne('SELECT COUNT(*) as count FROM patients');
    const totalDoctors = await queryOne('SELECT COUNT(*) as count FROM doctors');
    const totalRooms = await queryOne('SELECT COUNT(*) as count FROM rooms');
    const occupiedRooms = await queryOne("SELECT COUNT(*) as count FROM rooms WHERE status = 'Occupied'");
    const todayAppointments = await queryOne("SELECT COUNT(*) as count FROM appointments WHERE appointment_date = DATE('now')");
    const pendingAppointments = await queryOne("SELECT COUNT(*) as count FROM appointments WHERE status = 'Scheduled'");
    
    const financialStats = await queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as collected_revenue,
        COALESCE(SUM(total_amount - paid_amount), 0) as pending_revenue
      FROM bills
    `);

    const doctorWorkload = await queryAll('SELECT * FROM vw_doctor_workload ORDER BY total_appointments DESC LIMIT 5');
    const bedOccupancy = await queryAll('SELECT * FROM vw_bed_occupancy ORDER BY room_number ASC');
    const recentAuditLogs = await queryAll('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 6');

    res.json({
      stats: {
        totalPatients: totalPatients.count,
        totalDoctors: totalDoctors.count,
        totalRooms: totalRooms.count,
        occupiedRooms: occupiedRooms.count,
        availableRooms: totalRooms.count - occupiedRooms.count,
        bedOccupancyRate: totalRooms.count > 0 ? Math.round((occupiedRooms.count / totalRooms.count) * 100) : 0,
        todayAppointments: todayAppointments.count,
        pendingAppointments: pendingAppointments.count,
        totalRevenue: financialStats.total_revenue,
        collectedRevenue: financialStats.collected_revenue,
        pendingRevenue: financialStats.pending_revenue
      },
      doctorWorkload,
      bedOccupancy,
      recentAuditLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

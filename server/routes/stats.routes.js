const express = require('express');
const router = express.Router();
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/overview', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  try {
    const events = db.getCollection('events');
    const registrations = db.getCollection('registrations');
    const users = db.getCollection('users');
    const results = db.getCollection('results');
    const certificates = db.getCollection('certificates');

    const totalStudents = users.filter(u => u.role === 'participant').length;
    const totalRegistrations = registrations.length;
    const attendedCount = registrations.filter(r => r.status === 'Attended').length;
    const teamCount = registrations.filter(r => r.isTeam).length;
    const soloCount = totalRegistrations - teamCount;

    const categoryCounts = {};
    events.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });

    res.json({
      metrics: {
        totalEvents: events.length,
        totalStudents,
        totalRegistrations,
        attendedCount,
        checkinRate: totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0,
        teamRegistrations: teamCount,
        soloRegistrations: soloCount,
        publishedResults: results.filter(r => r.status === 'Published').length,
        certificatesIssued: certificates.length
      },
      categoryCounts,
      recentRegistrations: registrations.slice(-6).reverse()
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error retrieving analytics metrics' });
  }
});

module.exports = router;

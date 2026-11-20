const express = require('express');
const router = express.Router();
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/verify', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  try {
    const { qrToken, eventId } = req.body;
    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required for check-in.' });
    }

    const registrations = db.getCollection('registrations');
    const index = registrations.findIndex(
      r => r.qrToken.trim().toUpperCase() === qrToken.trim().toUpperCase()
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR Ticket! No matching registration found in database.'
      });
    }

    const reg = registrations[index];

    if (eventId && reg.eventId !== eventId) {
      return res.status(400).json({
        success: false,
        message: `This QR ticket is for "${reg.eventTitle}", NOT for the currently selected event!`
      });
    }

    if (reg.status === 'Attended') {
      return res.status(409).json({
        success: false,
        alreadyCheckedIn: true,
        registration: reg,
        message: `Already Checked-In on ${new Date(reg.checkedInAt).toLocaleTimeString()} by ${reg.checkedInBy || 'Organizer'}`
      });
    }

    registrations[index].status = 'Attended';
    registrations[index].checkedInAt = new Date().toISOString();
    registrations[index].checkedInBy = req.user.name;

    db.saveCollection('registrations', registrations);

    const certificates = db.getCollection('certificates');
    const existingCert = certificates.find(c => c.registrationId === reg.id);
    if (!existingCert) {
      const newCert = {
        id: `cert_${Math.random().toString(36).substr(2, 9)}`,
        registrationId: reg.id,
        participantId: reg.participantId,
        participantName: reg.participantName,
        eventId: reg.eventId,
        eventTitle: reg.eventTitle,
        category: 'Fest Participation',
        position: 'Participant',
        issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        verificationCode: `PULSE-2026-${reg.id.slice(-5).toUpperCase()}`,
        signatureAuthority: 'Prof. Ramesh Sharma (Convener)'
      };
      certificates.push(newCert);
      db.saveCollection('certificates', certificates);
    }

    res.json({
      success: true,
      registration: registrations[index],
      message: `Verified! Welcome ${reg.participantName} to ${reg.eventTitle}. Attendance recorded.`
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Internal server error during check-in.' });
  }
});

router.get('/stats', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  try {
    const registrations = db.getCollection('registrations');
    const events = db.getCollection('events');

    const stats = events.map(ev => {
      const eventRegs = registrations.filter(r => r.eventId === ev.id);
      const attended = eventRegs.filter(r => r.status === 'Attended').length;
      return {
        eventId: ev.id,
        eventTitle: ev.title,
        venue: ev.venue,
        totalRegistered: eventRegs.length,
        totalAttended: attended,
        checkinRate: eventRegs.length > 0 ? Math.round((attended / eventRegs.length) * 100) : 0
      };
    });

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve check-in statistics.' });
  }
});

module.exports = router;

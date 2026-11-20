const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { eventId } = req.query;
    let results = db.getCollection('results');

    if (eventId) {
      results = results.filter(r => r.eventId === eventId);
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving results' });
  }
});

router.post('/', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  try {
    const { eventId, winners, status = 'Published' } = req.body;

    if (!eventId || !winners || !winners.length) {
      return res.status(400).json({ message: 'Event ID and at least one winner entry are required.' });
    }

    const events = db.getCollection('events');
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const results = db.getCollection('results');
    const existingIndex = results.findIndex(r => r.eventId === eventId);

    const resultRecord = {
      id: existingIndex !== -1 ? results[existingIndex].id : `res_${uuidv4().slice(0, 8)}`,
      eventId,
      eventTitle: event.title,
      status,
      publishedAt: new Date().toISOString(),
      publishedBy: req.user.name,
      winners: winners.map(w => ({
        position: w.position || 'Winner',
        recipientName: w.recipientName,
        participantId: w.participantId || null,
        college: w.college || 'Host University',
        prize: w.prize || 'Award Trophy & Certificate',
        certificateIssued: true
      }))
    };

    if (existingIndex !== -1) {
      results[existingIndex] = resultRecord;
    } else {
      results.push(resultRecord);
    }
    db.saveCollection('results', results);

    const certificates = db.getCollection('certificates');
    resultRecord.winners.forEach(w => {
      if (w.participantId) {
        const certExists = certificates.find(c => c.participantId === w.participantId && c.eventId === eventId && c.position === w.position);
        if (!certExists) {
          certificates.push({
            id: `cert_merit_${Math.random().toString(36).substr(2, 9)}`,
            registrationId: 'reg_merit',
            participantId: w.participantId,
            participantName: w.recipientName,
            eventId,
            eventTitle: event.title,
            category: event.category,
            position: `${w.position} Winner`,
            issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            verificationCode: `PULSE-2026-WIN-${Math.floor(1000 + Math.random() * 9000)}`,
            signatureAuthority: `${req.user.name} (${req.user.role === 'admin' ? 'Convener' : 'Coordinator'})`
          });
        }
      }
    });
    db.saveCollection('certificates', certificates);

    res.status(201).json({
      result: resultRecord,
      message: `Results published successfully for ${event.title}!`
    });
  } catch (err) {
    console.error('Publish results error:', err);
    res.status(500).json({ message: 'Error publishing event results.' });
  }
});

module.exports = router;

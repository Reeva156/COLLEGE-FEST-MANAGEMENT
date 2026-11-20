const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const contacts = db.getCollection('contacts');
    const newContact = {
      id: `cnt_${uuidv4().slice(0, 8)}`,
      name,
      email,
      subject: subject || 'General Query',
      message,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    contacts.unshift(newContact);
    db.saveCollection('contacts', contacts);

    res.status(201).json({
      message: 'Thank you for reaching out! Our organizing committee desk will review your inquiry shortly.',
      contact: newContact
    });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting contact form.' });
  }
});

router.get('/', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  try {
    const contacts = db.getCollection('contacts');
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contact inquiries.' });
  }
});

module.exports = router;

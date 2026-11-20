const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { category, search, status } = req.query;
    let events = db.getCollection('events');

    if (category && category !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'All') {
      events = events.filter(e => e.registrationStatus.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.tag && e.tag.toLowerCase().includes(q))
      );
    }

    res.json({ events, total: events.length });
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ message: 'Error retrieving events' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const events = db.getCollection('events');
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event details' });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      category,
      tag,
      date,
      time,
      venue,
      capacity,
      isTeamEvent,
      teamSize,
      deadline,
      rules,
      coverImage,
      coordinator,
      prize
    } = req.body;

    if (!title || !category || !date || !venue) {
      return res.status(400).json({ message: 'Title, category, date, and venue are required.' });
    }

    const events = db.getCollection('events');
    const newEvent = {
      id: `ev_${uuidv4().slice(0, 8)}`,
      title,
      subtitle: subtitle || 'Campus Fest Event',
      description: description || 'Exciting college fest event.',
      category: category || 'General',
      tag: tag || '✨ Event',
      date,
      time: time || '10:00 AM',
      venue,
      capacity: Number(capacity) || 50,
      registeredCount: 0,
      isTeamEvent: Boolean(isTeamEvent),
      teamSize: teamSize || (isTeamEvent ? { min: 2, max: 4 } : { min: 1, max: 1 }),
      deadline: deadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      registrationStatus: 'Open',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      aspectRatio: ['tall', 'square', 'wide'][Math.floor(Math.random() * 3)],
      rules: Array.isArray(rules) ? rules : (rules ? rules.split('\n').filter(Boolean) : ['Standard college fest code of conduct applies.']),
      coordinator: coordinator || { name: 'Fest Committee', contact: '+91 99999 88888', email: 'fest@college.edu' },
      prize: prize || 'Certificates & Medals'
    };

    events.unshift(newEvent);
    db.saveCollection('events', events);

    res.status(201).json({ event: newEvent, message: 'Event successfully created!' });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Error creating event' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  try {
    const events = db.getCollection('events');
    const index = events.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    events[index] = {
      ...events[index],
      ...req.body,
      id: events[index].id
    };

    db.saveCollection('events', events);
    res.json({ event: events[index], message: 'Event updated successfully.' });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ message: 'Error updating event' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    let events = db.getCollection('events');
    const initialLen = events.length;
    events = events.filter(e => e.id !== req.params.id);

    if (events.length === initialLen) {
      return res.status(404).json({ message: 'Event not found' });
    }

    db.saveCollection('events', events);
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../storage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

async function generateQR(tokenString) {
  try {
    return await QRCode.toDataURL(tokenString, {
      width: 320,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
}

router.post('/individual', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const events = db.getCollection('events');
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registrationStatus === 'Closed') {
      return res.status(400).json({ message: 'Registration for this event is closed.' });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'Event capacity reached.' });
    }

    const registrations = db.getCollection('registrations');
    const alreadyRegistered = registrations.find(
      r => r.eventId === eventId && r.participantId === userId && r.status !== 'Cancelled'
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this event!' });
    }

    const qrToken = `PULSE-${event.category.toUpperCase().slice(0, 3)}-${req.user.name.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrDataUrl = await generateQR(qrToken);

    const newReg = {
      id: `reg_${uuidv4().slice(0, 8)}`,
      eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      participantId: userId,
      participantName: req.user.name,
      participantEmail: req.user.email,
      isTeam: false,
      teamId: null,
      teamName: null,
      qrToken,
      qrCodeDataUrl: qrDataUrl,
      status: 'Registered',
      registeredAt: new Date().toISOString(),
      checkedInAt: null,
      checkedInBy: null
    };

    registrations.push(newReg);
    db.saveCollection('registrations', registrations);

    event.registeredCount = (event.registeredCount || 0) + 1;
    db.saveCollection('events', events);

    res.status(201).json({
      registration: newReg,
      message: `Successfully registered for ${event.title}! Your QR Pass is ready.`
    });
  } catch (err) {
    console.error('Individual reg error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

router.post('/team', authenticateToken, async (req, res) => {
  try {
    const { eventId, teamName, memberEmails = [] } = req.body;
    const userId = req.user.id;

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ message: 'Please provide a valid team name.' });
    }

    const events = db.getCollection('events');
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({ message: 'This event is for solo individual participants.' });
    }

    const registrations = db.getCollection('registrations');
    const userAlreadyReg = registrations.find(
      r => r.eventId === eventId && r.participantId === userId && r.status !== 'Cancelled'
    );
    if (userAlreadyReg) {
      return res.status(400).json({ message: 'You are already registered for this event in another team or individually.' });
    }

    const teamCode = `${teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const teams = db.getCollection('teams');
    const newTeam = {
      id: `team_${uuidv4().slice(0, 8)}`,
      teamName,
      eventId,
      leaderId: userId,
      leaderName: req.user.name,
      memberIds: [userId],
      invitedEmails: memberEmails,
      teamCode,
      createdAt: new Date().toISOString()
    };
    teams.push(newTeam);
    db.saveCollection('teams', teams);

    const qrToken = `PULSE-TEAM-${teamCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrDataUrl = await generateQR(qrToken);

    const newReg = {
      id: `reg_${uuidv4().slice(0, 8)}`,
      eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      participantId: userId,
      participantName: req.user.name,
      participantEmail: req.user.email,
      isTeam: true,
      teamId: newTeam.id,
      teamName,
      teamCode,
      qrToken,
      qrCodeDataUrl: qrDataUrl,
      status: 'Registered',
      registeredAt: new Date().toISOString(),
      checkedInAt: null,
      checkedInBy: null
    };

    registrations.push(newReg);
    db.saveCollection('registrations', registrations);

    event.registeredCount = (event.registeredCount || 0) + 1;
    db.saveCollection('events', events);

    res.status(201).json({
      registration: newReg,
      team: newTeam,
      message: `Team "${teamName}" created! Team Code: ${teamCode}. Teammates can join with this code.`
    });
  } catch (err) {
    console.error('Team reg error:', err);
    res.status(500).json({ message: 'Team registration failed.' });
  }
});

router.post('/join-team', authenticateToken, async (req, res) => {
  try {
    const { teamCode } = req.body;
    const userId = req.user.id;

    if (!teamCode) {
      return res.status(400).json({ message: 'Please provide a team code.' });
    }

    const teams = db.getCollection('teams');
    const team = teams.find(t => t.teamCode.toUpperCase() === teamCode.trim().toUpperCase());
    if (!team) {
      return res.status(404).json({ message: 'No team found with this team code.' });
    }

    const events = db.getCollection('events');
    const event = events.find(e => e.id === team.eventId);

    if (team.memberIds.includes(userId)) {
      return res.status(400).json({ message: 'You are already a member of this team!' });
    }

    if (event && team.memberIds.length >= (event.teamSize?.max || 4)) {
      return res.status(400).json({ message: `This team is already full (Max ${event.teamSize?.max} members).` });
    }

    const registrations = db.getCollection('registrations');
    const userAlreadyReg = registrations.find(
      r => r.eventId === team.eventId && r.participantId === userId && r.status !== 'Cancelled'
    );
    if (userAlreadyReg) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    team.memberIds.push(userId);
    db.saveCollection('teams', teams);

    const qrToken = `PULSE-TEAM-${team.teamCode}-${req.user.name.replace(/\s+/g, '').toUpperCase().slice(0, 4)}`;
    const qrDataUrl = await generateQR(qrToken);

    const newReg = {
      id: `reg_${uuidv4().slice(0, 8)}`,
      eventId: team.eventId,
      eventTitle: event?.title || 'Team Event',
      eventDate: event?.date,
      eventTime: event?.time,
      eventVenue: event?.venue,
      participantId: userId,
      participantName: req.user.name,
      participantEmail: req.user.email,
      isTeam: true,
      teamId: team.id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      qrToken,
      qrCodeDataUrl: qrDataUrl,
      status: 'Registered',
      registeredAt: new Date().toISOString(),
      checkedInAt: null,
      checkedInBy: null
    };

    registrations.push(newReg);
    db.saveCollection('registrations', registrations);

    res.json({
      registration: newReg,
      team,
      message: `You have successfully joined team "${team.teamName}"!`
    });
  } catch (err) {
    console.error('Join team error:', err);
    res.status(500).json({ message: 'Failed to join team.' });
  }
});

router.get('/my', authenticateToken, (req, res) => {
  try {
    const registrations = db.getCollection('registrations');
    const myRegistrations = registrations.filter(r => r.participantId === req.user.id);
    res.json({ registrations: myRegistrations });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user registrations' });
  }
});

router.get('/', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  try {
    const { eventId, status } = req.query;
    let registrations = db.getCollection('registrations');

    if (eventId && eventId !== 'All') {
      registrations = registrations.filter(r => r.eventId === eventId);
    }
    if (status && status !== 'All') {
      registrations = registrations.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ registrations, total: registrations.length });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving registrations' });
  }
});

module.exports = router;

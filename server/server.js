const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./storage');
const authRoutes = require('./routes/auth.routes');
const eventsRoutes = require('./routes/events.routes');
const registrationsRoutes = require('./routes/registrations.routes');
const checkinRoutes = require('./routes/checkin.routes');
const resultsRoutes = require('./routes/results.routes');
const certificatesRoutes = require('./routes/certificates.routes');
const contactRoutes = require('./routes/contact.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'College Fest Management Platform (PRD v1.0)',
    festName: 'AURA 2026',
    author: 'Reeva Solani (BCA 2nd Year)',
    timestamp: new Date().toISOString()
  });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 College Fest Backend Server running on port ${PORT}`);
  console.log(` 🌐 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(` 📌 Fest Platform API ready for React Frontend!`);
  console.log(`=======================================================`);
});

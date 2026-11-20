const express = require('express');
const router = express.Router();
const db = require('../storage');
const { authenticateToken } = require('../middleware/auth');

router.get('/my', authenticateToken, (req, res) => {
  try {
    const certificates = db.getCollection('certificates');
    const myCerts = certificates.filter(c => c.participantId === req.user.id);
    res.json({ certificates: myCerts });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving certificates.' });
  }
});

router.get('/verify/:code', (req, res) => {
  try {
    const { code } = req.params;
    const certificates = db.getCollection('certificates');
    const cert = certificates.find(c => c.verificationCode.toUpperCase() === code.trim().toUpperCase());

    if (!cert) {
      return res.status(404).json({ valid: false, message: 'Invalid certificate verification code.' });
    }

    res.json({
      valid: true,
      certificate: cert,
      verifiedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying certificate.' });
  }
});

module.exports = router;

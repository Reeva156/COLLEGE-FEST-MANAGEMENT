const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../storage');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

router.get('/setup-status', (req, res) => {
  try {
    const users = db.getCollection('users');
    const adminExists = users.some(u => u.role === 'admin');
    res.json({ hasAdmin: adminExists });
  } catch (err) {
    res.status(500).json({ message: 'Error checking setup status' });
  }
});

router.post('/setup-admin', async (req, res) => {
  try {
    const users = db.getCollection('users');
    const adminExists = users.some(u => u.role === 'admin');
    if (adminExists) {
      return res.status(400).json({ message: 'Admin account is already configured. Please log in.' });
    }

    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required to configure the Admin.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const adminUser = {
      id: `usr_admin_${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      department: department || 'Head Convener / Faculty',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString()
    };

    users.push(adminUser);
    db.saveCollection('users', users);

    const token = jwt.sign(
      { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = adminUser;
    res.status(201).json({
      token,
      user: userSafe,
      message: `Admin account successfully created for ${adminUser.name}!`
    });
  } catch (err) {
    console.error('Setup admin error:', err);
    res.status(500).json({ message: 'Server error during admin setup' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const users = db.getCollection('users');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'participant',
      department: department || 'Student',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    db.saveCollection('users', users);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = newUser;
    res.status(201).json({ token, user: userSafe, message: 'Account registered successfully!' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const users = db.getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    res.json({ token, user: userSafe, message: `Welcome back, ${user.name}!` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const users = db.getCollection('users');
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  const { passwordHash: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, department, avatar, bio, phone } = req.body;
    const users = db.getCollection('users');
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && name.trim()) {
      users[userIndex].name = name.trim();
    }
    if (department !== undefined) {
      users[userIndex].department = department;
    }
    if (avatar) {
      users[userIndex].avatar = avatar;
    }
    if (bio !== undefined) {
      users[userIndex].bio = bio;
    }
    if (phone !== undefined) {
      users[userIndex].phone = phone;
    }

    db.saveCollection('users', users);

    const token = jwt.sign(
      { id: users[userIndex].id, name: users[userIndex].name, email: users[userIndex].email, role: users[userIndex].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = users[userIndex];
    res.json({
      user: userSafe,
      token,
      message: 'Profile updated successfully!'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const users = db.getCollection('users');
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[userIndex].passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    users[userIndex].passwordHash = await bcrypt.hash(newPassword, salt);
    db.saveCollection('users', users);

    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

router.get('/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only.' });
  }
  const users = db.getCollection('users');
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ users: safeUsers });
});

router.post('/create-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only Admins can create user accounts.' });
    }

    const { name, email, password, role = 'participant', department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const users = db.getCollection('users');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const validRole = ['organizer', 'participant', 'admin'].includes(role) ? role : 'participant';

    const newUser = {
      id: `usr_${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: validRole,
      department: department || (validRole === 'organizer' ? 'Teacher / Coordinator' : 'Student'),
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      createdBy: req.user.name
    };

    users.push(newUser);
    db.saveCollection('users', users);

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      user: safeUser,
      message: `Account created successfully for ${name} (${validRole})!`
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

router.delete('/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only.' });
  }
  let users = db.getCollection('users');
  const target = users.find(u => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ message: 'User not found.' });
  }
  if (target.role === 'admin' && target.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own active Admin account.' });
  }

  users = users.filter(u => u.id !== req.params.id);
  db.saveCollection('users', users);
  res.json({ message: `User ${target.name} deleted successfully.` });
});

module.exports = router;

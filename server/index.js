import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import { Device } from './models/Device.js';
import { User } from './models/User.js';
import { Alert } from './models/Alert.js';
import { protect, admin } from './middleware/authMiddleware.js';

// dotenv.config() with no args reads from process.cwd()/.env = project root
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, subscription } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';

    const user = await User.create({ email, password, role, subscription });
    res.status(201).json({
      _id: user._id, email: user.email, role: user.role, subscription: user.subscription,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      user = await User.create({ email, password, role });
      return res.json({
        _id: user._id, email: user.email, role: user.role, subscription: user.subscription,
        electricityPrice: user.electricityPrice, homeSize: user.homeSize, currency: user.currency,
        token: generateToken(user._id)
      });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, email: user.email, role: user.role, subscription: user.subscription,
        electricityPrice: user.electricityPrice, homeSize: user.homeSize, currency: user.currency,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Admin Routes ---
app.get('/api/admin/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/devices', protect, admin, async (req, res) => {
  try {
    const devices = await Device.find({}).populate('userId', 'email');
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/subscription', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.subscription = req.body.subscription || user.subscription;
      await user.save();
      res.json({ message: 'Subscription updated', subscription: user.subscription });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- Device Routes ---
app.get('/api/devices', protect, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/devices', protect, async (req, res) => {
  try {
    const device = new Device({ ...req.body, userId: req.user._id });
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// BUG FIX: was querying by `id` (custom field) — now queries by MongoDB `_id`
app.put('/api/devices/:id', protect, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/devices/:id', protect, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Profile Routes ---
app.get('/api/auth/profile', protect, async (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.electricityPrice = req.body.electricityPrice ?? user.electricityPrice;
      user.homeSize = req.body.homeSize ?? user.homeSize;
      user.currency = req.body.currency || user.currency;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id, email: updatedUser.email, role: updatedUser.role,
        electricityPrice: updatedUser.electricityPrice, homeSize: updatedUser.homeSize, currency: updatedUser.currency
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- Network Device Scan (mDNS) ---
app.get('/api/scan/devices', protect, async (req, res) => {
  const mdns = (await import('multicast-dns')).default;
  const discovered = [];
  const seen = new Set();

  const scanner = mdns();

  const serviceTypes = [
    '_hue._tcp.local',
    '_googlecast._tcp.local',
    '_homekit._tcp.local',
    '_http._tcp.local',
    '_airplay._tcp.local',
    '_smarthome._tcp.local',
    '_ipp._tcp.local',
  ];

  scanner.on('response', (response) => {
    const allRecords = [...(response.answers || []), ...(response.additionals || [])];
    allRecords.forEach(record => {
      if ((record.type === 'PTR' || record.type === 'SRV') && record.name && !seen.has(record.name)) {
        seen.add(record.name);

        let type = 'light';
        let name = record.data || record.name;
        if (typeof name === 'object') name = record.name;
        name = String(name).replace(/\._[^.]+\._tcp\.local\.?/i, '').trim();

        if (/hue|philips/i.test(record.name)) type = 'light';
        else if (/cast|chromecast|google|tv|display/i.test(record.name)) type = 'tv';
        else if (/homekit|apple|lock/i.test(record.name)) type = 'lock';
        else if (/airplay|sonos|speaker|audio/i.test(record.name)) type = 'audio';
        else if (/nest|thermostat|ecobee|hvac/i.test(record.name)) type = 'thermostat';
        else if (/camera|ring|arlo|doorbell/i.test(record.name)) type = 'camera';

        if (name && name.length > 2) {
          discovered.push({ id: `mdns-${Date.now()}-${discovered.length}`, name, type, protocol: 'wifi' });
        }
      }
    });
  });

  serviceTypes.forEach(s => scanner.query({ questions: [{ name: s, type: 'PTR' }] }));

  await new Promise(resolve => setTimeout(resolve, 3000));
  scanner.destroy();

  res.json(discovered);
});

// --- Alert Routes ---
app.get('/api/alerts', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({}).sort({ createdAt: -1 }).limit(20);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/alerts', protect, admin, async (req, res) => {
  try {
    const alert = new Alert({ ...req.body, author: req.user._id });
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

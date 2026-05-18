import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  state: { type: Object, required: true },
  connection: { type: String, required: true },
  geofenceEnabled: { type: Boolean, default: false },
  satelliteSupport: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Device = mongoose.model('Device', deviceSchema);

import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  songTitle: { type: String, required: true },
  accuracy: { type: Number, required: true, min: 0, max: 100 },
  totalNotes: { type: Number, required: true },
  averageVelocity: { type: Number, default: 0 },
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
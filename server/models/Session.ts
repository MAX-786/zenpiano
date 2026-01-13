import mongoose, { Document, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  startTime: number;
  endTime: number;
  songTitle: string;
  accuracy: number;
  totalNotes: number;
  averageVelocity: number;
}

const SessionSchema = new mongoose.Schema<ISession>({
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

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default Session;
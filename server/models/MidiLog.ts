import mongoose, { Document, Model, Types } from 'mongoose';

export interface IMidiLog extends Document {
  sessionId: Types.ObjectId;
  timestamp: Date;
  note: number;
  expectedNote?: number;
  isCorrect: boolean;
  velocity?: number;
  timeGap?: number;
}

const MidiLogSchema = new mongoose.Schema<IMidiLog>({
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true 
  },
  timestamp: { type: Date, required: true },
  note: { type: Number, required: true },
  expectedNote: Number,
  isCorrect: { type: Boolean, required: true },
  velocity: Number,
  timeGap: Number
}, {
  // MongoDB 5.0+ Time Series Optimization
  timeseries: {
    timeField: 'timestamp',
    metaField: 'sessionId',
    granularity: 'seconds'
  }
});

const MidiLog: Model<IMidiLog> = mongoose.models.MidiLog || mongoose.model<IMidiLog>('MidiLog', MidiLogSchema);
export default MidiLog;
import mongoose from 'mongoose';

const MidiLogSchema = new mongoose.Schema({
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

export default mongoose.models.MidiLog || mongoose.model('MidiLog', MidiLogSchema);
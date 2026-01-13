import mongoose, { Document, Model } from 'mongoose';

export interface ITokenUsage extends Document {
  userId: string;
  date: Date; // Store as start of day for aggregation
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  modelVersion: string;
  createdAt: Date;
}

const TokenUsageSchema = new mongoose.Schema<ITokenUsage>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  promptTokens: {
    type: Number,
    default: 0
  },
  candidatesTokens: {
    type: Number,
    default: 0
  },
  totalTokens: {
    type: Number,
    required: true
  },
  modelVersion: {
    type: String,
    default: 'gemini-3-flash-preview'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying
TokenUsageSchema.index({ userId: 1, date: 1 });

const TokenUsage: Model<ITokenUsage> = 
  mongoose.models.TokenUsage || mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);

export default TokenUsage;

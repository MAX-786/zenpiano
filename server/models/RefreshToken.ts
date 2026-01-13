import mongoose, { Document, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  deviceInfo?: string;
}

const RefreshTokenSchema = new mongoose.Schema<IRefreshToken>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    type: String
  }
});

// Auto-delete expired tokens (MongoDB TTL index)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken: Model<IRefreshToken> = 
  mongoose.models.RefreshToken || 
  mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

export default RefreshToken;

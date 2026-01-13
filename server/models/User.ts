import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  username: { 
    type: String, 
    required: [true, 'Please provide a username'], 
    unique: true,
    maxlength: [60, 'Username cannot be more than 60 characters']
  },
  password: { 
    type: String, 
    required: [true, 'Please provide a password'] 
    // In production, this would be a hashed string
  },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
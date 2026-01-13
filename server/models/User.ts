import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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

export default mongoose.models.User || mongoose.model('User', UserSchema);
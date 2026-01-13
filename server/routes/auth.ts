import { Router, Request, Response } from 'express';
import User from '../models/User.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find or create user (simplified auth for demo)
    let user = await User.findOne({ username });
    
    if (!user) {
      // Create new user for demo purposes
      user = await User.create({
        username,
        password: password || 'demo-password',
        skillLevel: 'Beginner'
      });
    }

    // In production, you would verify password and use JWT tokens
    res.json({
      id: user._id.toString(),
      username: user.username,
      skillLevel: user.skillLevel
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  // In production, invalidate JWT token or session
  res.json({ message: 'Logged out successfully' });
});

export default router;

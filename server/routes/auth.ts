import { Router, Request, Response } from 'express';
import User from '../models/User.ts';
import RefreshToken from '../models/RefreshToken.ts';
import { generateTokenPair, getRefreshTokenExpiry, verifyAccessToken } from '../lib/tokenUtils.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    let user = await User.findOne({ username });
    
    if (!user) {
      // Create new user for demo purposes (in production, remove this)
      user = await User.create({
        username,
        password, // Will be hashed by pre-save hook
        skillLevel: 'Beginner'
      });
    } else {
      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate token pair
    const tokenPair = generateTokenPair({
      userId: user._id.toString(),
      username: user.username
    });

    // Store refresh token in database
    await RefreshToken.create({
      userId: user._id,
      token: tokenPair.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      deviceInfo: req.headers['user-agent']
    });

    // Return user and tokens
    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        skillLevel: user.skillLevel
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.accessTokenExpiresIn
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({ 
      token: refreshToken,
      isRevoked: false
    }).populate('userId');

    if (!storedToken) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ 
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new token pair
    const tokenPair = generateTokenPair({
      userId: user._id.toString(),
      username: user.username
    });

    // Delete old refresh token and create new one
    await RefreshToken.deleteOne({ _id: storedToken._id });
    await RefreshToken.create({
      userId: user._id,
      token: tokenPair.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      deviceInfo: req.headers['user-agent']
    });

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.accessTokenExpiresIn
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Revoke refresh token
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      skillLevel: user.skillLevel
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;

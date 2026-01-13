import { Router, Request, Response } from 'express';
import Session from '../models/Session.ts';
import MidiLog from '../models/MidiLog.ts';
import User from '../models/User.ts';
import mongoose from 'mongoose';

const router = Router();

// GET /api/users/:id/stats - Get user statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }
    
    const userId = new mongoose.Types.ObjectId(userIdParam);

    // Get all sessions for the user
    const sessions = await Session.find({ userId }).sort({ startTime: -1 });

    if (sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        totalMinutes: 0,
        avgAccuracy: 0,
        recentSessions: [],
        troubleNotes: {}
      });
    }

    // Calculate stats
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => {
      return acc + Math.round((s.endTime - s.startTime) / 60000);
    }, 0);
    const avgAccuracy = Math.round(
      sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions
    );

    // Get recent sessions (last 5)
    const recentSessions = sessions.slice(0, 5).map(s => ({
      id: s._id.toString(),
      songTitle: s.songTitle,
      accuracy: s.accuracy,
      date: new Date(s.startTime).toISOString()
    }));

    // Calculate trouble notes from all sessions
    const sessionIds = sessions.map(s => s._id);
    const incorrectLogs = await MidiLog.find({
      sessionId: { $in: sessionIds },
      isCorrect: false
    });

    // Count frequency of incorrect notes
    const troubleNotes: Record<number, number> = {};
    incorrectLogs.forEach(log => {
      const note = log.note;
      troubleNotes[note] = (troubleNotes[note] || 0) + 1;
    });

    // Sort by frequency and take top 5
    const sortedTroubleNotes = Object.entries(troubleNotes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .reduce((acc, [note, count]) => {
        acc[parseInt(note)] = count;
        return acc;
      }, {} as Record<number, number>);

    res.json({
      totalSessions,
      totalMinutes,
      avgAccuracy,
      recentSessions,
      troubleNotes: sortedTroubleNotes
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
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
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PATCH /api/users/:id - Update user profile
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { skillLevel } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { skillLevel },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      skillLevel: user.skillLevel
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;

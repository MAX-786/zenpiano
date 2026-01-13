import { Router, Request, Response } from 'express';
import Session from '../models/Session.ts';
import MidiLog from '../models/MidiLog.ts';
import mongoose from 'mongoose';

const router = Router();

// POST /api/sessions - Save a new session with logs
router.post('/', async (req: Request, res: Response) => {
  try {
    const { session, logs } = req.body;

    if (!session || !session.userId) {
      return res.status(400).json({ error: 'Session data with userId is required' });
    }

    // Create the session
    const newSession = await Session.create({
      userId: new mongoose.Types.ObjectId(session.userId),
      startTime: session.startTime,
      endTime: session.endTime,
      songTitle: session.songTitle,
      accuracy: session.accuracy,
      totalNotes: session.totalNotes,
      averageVelocity: session.averageVelocity || 0
    });

    // Save associated MIDI logs if provided
    if (logs && Array.isArray(logs) && logs.length > 0) {
      const logsWithSession = logs.map((log: any) => ({
        sessionId: newSession._id,
        timestamp: new Date(log.timestamp),
        note: log.note,
        expectedNote: log.expectedNote,
        isCorrect: log.isCorrect,
        velocity: log.velocity,
        timeGap: log.timeGap
      }));

      await MidiLog.insertMany(logsWithSession);
    }

    res.status(201).json({ 
      id: newSession._id.toString(),
      message: 'Session saved successfully' 
    });
  } catch (error: any) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions/:id - Get a specific session
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// GET /api/sessions/:id/logs - Get logs for a specific session
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const logs = await MidiLog.find({ 
      sessionId: new mongoose.Types.ObjectId(req.params.id) 
    }).sort({ timestamp: 1 });

    res.json(logs);
  } catch (error: any) {
    console.error('Get session logs error:', error);
    res.status(500).json({ error: 'Failed to get session logs' });
  }
});

export default router;

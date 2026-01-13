import { Router, Request, Response } from 'express';
import MidiLog from '../models/MidiLog.ts';
import mongoose from 'mongoose';

const router = Router();

// POST /api/logs - Sync/append MIDI logs for a session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, logs } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'logs array is required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ 
        error: 'Invalid session ID format',
        code: 'INVALID_SESSION_ID'
      });
    }

    const logsWithSession = logs.map((log: any) => ({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      timestamp: new Date(log.timestamp),
      note: log.note,
      expectedNote: log.expectedNote,
      isCorrect: log.isCorrect,
      velocity: log.velocity,
      timeGap: log.timeGap
    }));

    await MidiLog.insertMany(logsWithSession);

    res.status(201).json({ 
      message: 'Logs synced successfully',
      count: logs.length 
    });
  } catch (error: any) {
    console.error('Sync logs error:', error);
    res.status(500).json({ error: 'Failed to sync logs' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import TokenUsage from '../models/TokenUsage.ts';

const router = Router();

// Log token usage
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, promptTokens, candidatesTokens, totalTokens, modelVersion } = req.body;

    if (!userId || !totalTokens) {
      return res.status(400).json({ error: 'userId and totalTokens are required' });
    }

    // Get start of today for aggregation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's record
    let tokenRecord = await TokenUsage.findOne({ userId, date: today });

    if (tokenRecord) {
      // Update existing record
      tokenRecord.promptTokens += promptTokens || 0;
      tokenRecord.candidatesTokens += candidatesTokens || 0;
      tokenRecord.totalTokens += totalTokens;
      await tokenRecord.save();
    } else {
      // Create new record
      tokenRecord = await TokenUsage.create({
        userId,
        date: today,
        promptTokens: promptTokens || 0,
        candidatesTokens: candidatesTokens || 0,
        totalTokens,
        modelVersion: modelVersion || 'gemini-3-flash-preview'
      });
    }

    res.status(200).json({ success: true, tokenRecord });
  } catch (error) {
    console.error('Error logging token usage:', error);
    res.status(500).json({ error: 'Failed to log token usage' });
  }
});

// Get token usage stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get today's usage
    const todayUsage = await TokenUsage.findOne({ userId, date: today });

    // Get this month's usage
    const monthUsage = await TokenUsage.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          promptTokens: { $sum: '$promptTokens' },
          candidatesTokens: { $sum: '$candidatesTokens' }
        }
      }
    ]);

    // Get last 30 days usage
    const last30DaysUsage = await TokenUsage.aggregate([
      {
        $match: {
          userId,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
          promptTokens: { $sum: '$promptTokens' },
          candidatesTokens: { $sum: '$candidatesTokens' }
        }
      }
    ]);

    // Get daily breakdown for last 30 days (for charting)
    const dailyBreakdown = await TokenUsage.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    })
      .sort({ date: 1 })
      .select('date totalTokens promptTokens candidatesTokens');

    res.status(200).json({
      today: {
        totalTokens: todayUsage?.totalTokens || 0,
        promptTokens: todayUsage?.promptTokens || 0,
        candidatesTokens: todayUsage?.candidatesTokens || 0
      },
      thisMonth: {
        totalTokens: monthUsage[0]?.totalTokens || 0,
        promptTokens: monthUsage[0]?.promptTokens || 0,
        candidatesTokens: monthUsage[0]?.candidatesTokens || 0
      },
      last30Days: {
        totalTokens: last30DaysUsage[0]?.totalTokens || 0,
        promptTokens: last30DaysUsage[0]?.promptTokens || 0,
        candidatesTokens: last30DaysUsage[0]?.candidatesTokens || 0
      },
      dailyBreakdown
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ error: 'Failed to fetch token stats' });
  }
});

export default router;

import { GoogleGenAI, Type } from "@google/genai";
import { CoachInsight, MidiLogEntry, Song, Note } from "../types";
import { apiRequest } from "./apiClient";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper function to log token usage
const logTokenUsage = async (usageMetadata: any) => {
  try {
    // Get userId from persisted auth store
    const authStorage = localStorage.getItem('zenpiano-auth');
    const authData = authStorage ? JSON.parse(authStorage) : null;
    const userId = authData?.state?.user?.id || 'demo-user-id';
    
    await apiRequest('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        promptTokens: usageMetadata.promptTokenCount || 0,
        candidatesTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
        modelVersion: 'gemini-3-flash-preview'
      })
    });
  } catch (error) {
    console.error('Failed to log token usage:', error);
  }
};

export const generatePracticeInsights = async (midiLog: MidiLogEntry[]): Promise<CoachInsight> => {
  if (!midiLog || midiLog.length === 0) {
    throw new Error("No practice data available.");
  }

  const correctNotes = midiLog.filter(e => e.isCorrect).length;
  const totalNotes = midiLog.length;
  const accuracy = Math.round((correctNotes / totalNotes) * 100);
  
  // Velocity Analysis for Empathy
  const velocities = midiLog.filter(e => e.velocity).map(e => e.velocity || 0);
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / (velocities.length || 1);
  
  const prompt = `
    Analyze this piano practice session.
    Accuracy: ${accuracy}%.
    Average Velocity (0-1 scale): ${avgVelocity.toFixed(2)}.
    
    Task 1: Technical Analysis
    Identify strengths and improvements based on accuracy.
    
    Task 2: "Empathy" Analysis (Velocity Dynamics)
    - If velocity < 0.4: "Gentle, soothing, perhaps too timid."
    - If velocity > 0.7: "Strong, confident, perhaps too aggressive."
    - Interpret the mood of the player based on this.

    Provide a JSON response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            practiceRoutine: { type: Type.STRING },
            moodAnalysis: { type: Type.STRING, description: "The empathy analysis based on keystroke dynamics." }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Log token usage
    if (response.usageMetadata) {
      await logTokenUsage(response.usageMetadata);
    }
    
    return JSON.parse(text) as CoachInsight;
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "Keep practicing!",
      strengths: ["dedication"],
      improvements: ["consistency"],
      practiceRoutine: "Scale C Major",
      moodAnalysis: "You seem focused."
    };
  }
};

export const generatePredictiveExercise = async (troubleNotes: number[]): Promise<Song> => {
  const notesList = troubleNotes.slice(0, 5).join(", "); // Top 5 missed notes
  
  const prompt = `
    Create a short 4-measure piano exercise (JSON format) focusing specifically on these MIDI notes: [${notesList}].
    Make it "soothing" and "minimalist".
    The exercise should be simple but target the weak points.
    
    Return ONLY a JSON object matching the Song interface:
    {
      title: "Predictive Practice",
      artist: "AI Coach",
      duration: 10,
      notes: [{midi, time, duration, velocity, id}]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            notes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  midi: { type: Type.NUMBER },
                  time: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER },
                  velocity: { type: Type.NUMBER },
                  id: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No exercise generated");
    
    // Log token usage
    if (response.usageMetadata) {
      await logTokenUsage(response.usageMetadata);
    }
    
    return JSON.parse(text) as Song;
  } catch (e) {
    console.error(e);
    // Fallback simple scale if AI fails
    return {
      title: "C Major Scale (Fallback)",
      artist: "System",
      duration: 5,
      notes: [
        { id: '1', midi: 60, time: 0, duration: 0.5, velocity: 0.6 },
        { id: '2', midi: 62, time: 0.5, duration: 0.5, velocity: 0.6 },
        { id: '3', midi: 64, time: 1.0, duration: 0.5, velocity: 0.6 },
      ]
    };
  }
};
import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const arcaneSage = {
  async summonResponse(prompt, history = []) {
    if (!GEMINI_API_KEY) {
      return "The Arcanum's connection to the elder gods is severed (Missing VITE_GEMINI_API_KEY). I can only offer my wisdom through manual incantations.";
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `You are the Arcane Sage, an AI Dungeon Master for a 3D VTT. You help the players with rules, quest generation, and flavor-text for their actions. Keep your responses immersive, detailed, and slightly mysterious. Context: ${prompt}` }]
            }
          ]
        }
      );

      return response.data.candidates[0]?.content?.parts[0]?.text || "The weave is silent...";
    } catch (error) {
      console.error('Gemini Summons Failure:', error.message);
      return "The elder gods are silent (AI Error). Roleplay as if the weave is flickering...";
    }
  }
};

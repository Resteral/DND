import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const arcaneSage = {
  async summonResponse(prompt, history = [], mode = 'chat') {
    if (!GEMINI_API_KEY) {
      return "The Arcanum's connection to the elder gods is severed (Missing VITE_GEMINI_API_KEY). I can only offer my wisdom through manual incantations.";
    }

    const systemPrompts = {
      chat: "You are the Arcane Sage, an AI Dungeon Master for a 3D VTT. You help with rules, flavor-text, and storytelling. Keep responses immersive, detailed, and slightly mysterious.",
      encounter: "Generate a D&D 5e encounter prompt based on the user's location. Include 3-4 monster suggestions with brief tactical hooks.",
      synthesis: "Convert the user's creature/prop request into a detailed 3D artist prompt suitable for Meshy AI. Focus on visual textures, materials, and fantasy silhouettes.",
      rules: "Act as a Rule Lawyer for D&D 5e. Provide clear, concise rulings with page references (imagined if necessary but accurate to 5e logic)."
    };

    const messages = history.map(h => ({
      role: h.sender === 'User' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    messages.push({
      role: 'user',
      parts: [{ text: `${systemPrompts[mode] || systemPrompts.chat}\n\nUser Question: ${prompt}` }]
    });

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: messages }
      );

      return response.data.candidates[0]?.content?.parts[0]?.text || "The weave is silent...";
    } catch (error) {
      console.error('Gemini Summons Failure:', error.message);
      return "The elder gods are silent (AI Error). Roleplay as if the weave is flickering...";
    }
  }
};

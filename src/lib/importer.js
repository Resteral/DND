import axios from 'axios';

export const characterImporter = {
  async importFromDDB(url) {
    try {
      console.log('Initiating Arcane Summoning:', url);
      
      const match = url.match(/characters\/(\d+)/);
      if (!match) throw new Error('Invalid URL format. Use the full D&D Beyond Character URL.');
      
      const charId = match[1];
      
      // Try primary proxy (corsproxy.io is often faster and cleaner)
      const targetUrl = `https://character-service.dndbeyond.com/character/v2/character/${charId}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

      let response;
      try {
        response = await axios.get(proxyUrl);
      } catch (e) {
        // Fallback to AllOrigins if first proxy fails
        const fallbackProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const fallbackRes = await axios.get(fallbackProxy);
        response = { data: JSON.parse(fallbackRes.data.contents) };
      }

      const data = response.data;

      if (!data.success) {
        if (data.message === 'Character is private') {
          throw new Error('This character is set to PRIVATE. Please set it to PUBLIC in Character Settings on D&D Beyond.');
        }
        throw new Error(`The weave rejects this summon: ${data.message || 'Unknown Arcane Interference'}`);
      }

      const char = data.data;
      const getStat = (id) => {
          const base = char.stats.find(s => s.id === id)?.value || 10;
          const bonus = char.bonusStats.find(s => s.id === id)?.value || 0;
          const override = char.overrideStats.find(s => s.id === id)?.value || 0;
          return override || (base + bonus);
      };
      
      return {
        id: char.id,
        name: char.name,
        class: char.classes[0]?.definition?.name || 'Hero',
        level: char.classes.reduce((sum, c) => sum + c.level, 0),
        hp: `${char.baseHitPoints}/${char.baseHitPoints}`,
        stats: {
          str: getStat(1),
          dex: getStat(2),
          con: getStat(3),
          int: getStat(4),
          wis: getStat(5),
          cha: getStat(6)
        },
        image: char.decorations?.avatarUrl || null,
        modelUrl: null
      };
    } catch (error) {
      console.error('Import Error:', error.message);
      // More helpful error for the user
      if (error.message.includes('403') || error.message.includes('401')) {
         throw new Error('ACCESS DENIED: Ensure your D&D Beyond character is set to PUBLIC.');
      }
      throw error;
    }
  }
};

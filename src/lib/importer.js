import axios from 'axios';

export const characterImporter = {
  async importFromDDB(url) {
    try {
      console.log('Initiating Arcane Import from D&D Beyond:', url);
      
      // Extract Character ID from URL (e.g., https://www.dndbeyond.com/characters/12345678)
      const match = url.match(/characters\/(\d+)/);
      if (!match) throw new Error('Invalid D&D Beyond character URL. Please use the full address (e.g. /characters/12345)');
      
      const charId = match[1];
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://character-service.dndbeyond.com/character/v2/character/${charId}`)}`;

      const response = await axios.get(proxyUrl);
      const data = JSON.parse(response.data.contents);

      if (!data.success) throw new Error('Failed to summon character data from the weave.');

      const char = data.data;
      
      // Map D&D Beyond JSON to Arcane VTT structure
      // Ability score mapping: STR(1), DEX(2), CON(3), INT(4), WIS(5), CHA(6)
      const getStat = (id) => char.stats.find(s => s.id === id)?.value || 10;
      
      return {
        id: char.id,
        name: char.name,
        class: char.classes[0]?.definition?.name || 'Adventurer',
        level: char.classes.reduce((sum, c) => sum + c.level, 0),
        hp: `${char.baseHitPoints}/${char.baseHitPoints}`, // Simplified HP
        stats: {
          str: getStat(1),
          dex: getStat(2),
          con: getStat(3),
          int: getStat(4),
          wis: getStat(5),
          cha: getStat(6)
        },
        image: char.decorations?.avatarUrl || null,
        modelUrl: null // Ready for AI Forge integration
      };
    } catch (error) {
      console.error('Portal Import Error:', error.message);
      throw error;
    }
  }
};

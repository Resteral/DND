import axios from 'axios';

export const characterImporter = {
  async importFromDDB(url) {
    try {
      console.log('Initiating Arcane Summoning (v5 Core):', url);
      const match = url.match(/characters\/(\d+)/);
      if (!match) throw new Error('Invalid URL. Format should be: characters/1234567');
      
      const charId = match[1];
      // Updated to v5 as verified by the Arcanum Seers
      const targetUrl = `https://character-service.dndbeyond.com/character/v5/character/${charId}`;
      
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${targetUrl}`
      ];

      let rawData = null;
      let lastError = null;

      for (const proxy of proxies) {
        try {
          const res = await axios.get(proxy, { timeout: 10000 });
          let contents = res.data;
          
          if (proxy.includes('allorigins')) {
            contents = JSON.parse(res.data.contents);
          }
          
          if (contents && (contents.success !== undefined || contents.data)) {
            rawData = contents;
            break; 
          }
        } catch (e) {
          lastError = e;
        }
      }

      if (!rawData) {
        throw new Error(`The Weave is thinning. Proxies blocked or character ${charId} not found. (${lastError?.message || 'N/A'})`);
      }

      if (rawData.success === false) {
        const msg = rawData.message || 'Unknown Arcane Interference';
        if (msg.toLowerCase().includes('private')) {
           throw new Error('CHARACTER IS PRIVATE. Set to PUBLIC in D&D Beyond Character Settings.');
        }
        throw new Error(`The Weave rejects this summon: ${msg}`);
      }

      const char = rawData.data;
      if (!char) throw new Error('Incomplete data received from the weave.');

      // Robust v5 stat extractor
      const getStat = (id) => {
          const base = char.stats?.find(s => s.id === id)?.value || 10;
          const bonus = char.bonusStats?.find(s => s.id === id)?.value || 0;
          const override = char.overrideStats?.find(s => s.id === id)?.value || 0;
          return override || (base + bonus);
      };
      
      const charClass = char.classes?.[0]?.definition?.name || 'Wizard';
      const level = char.classes?.reduce((sum, c) => sum + (c.level || 0), 0) || 5;

      return {
        id: char.id,
        name: char.name || 'Hero',
        class: charClass,
        level: level,
        hp: `${char.baseHitPoints || 30}/${char.baseHitPoints || 30}`,
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
      console.error('Portal Error:', error.message);
      throw error;
    }
  }
};

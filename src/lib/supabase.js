import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;
if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Supabase Init Error:', e);
  }
} else {
  // Mock client fallback
  supabaseInstance = {
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), send: () => {} }),
    removeChannel: () => {},
    from: () => ({ 
      insert: (d) => ({ select: () => Promise.resolve({ data: d, error: null }) }), 
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), 
      eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) 
    })
  };
}

export const supabase = supabaseInstance;

export const dungeonService = {
  async saveDungeon(name, data) {
    try {
      const { data: result, error } = await supabase.from('dungeons').insert([{ name, config: data }]).select();
      if (error) throw error;
      return result;
    } catch (err) { throw err; }
  },
  async getDungeons() {
    try {
      const { data, error } = await supabase.from('dungeons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) { return []; }
  }
};

export const characterService = {
  async saveCharacter(character) {
    try {
      const { data, error } = await supabase.from('characters').insert([
        { 
          name: character.name, 
          class: character.class, 
          stats: character.stats, 
          color: character.color,
          model_url: character.modelUrl
        }
      ]).select();
      if (error) throw error;
      return data;
    } catch (err) { throw err; }
  },
  async getCharacters() {
    try {
      const { data, error } = await supabase.from('characters').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) { return []; }
  },
  async deleteCharacter(id) {
    try {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    } catch (err) { throw err; }
  }
};

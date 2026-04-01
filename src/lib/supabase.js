import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe initialization to prevent top-level crashes if ENVs are missing on Vercel
let supabaseInstance = null;

if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase Connection Initialized.');
  } catch (e) {
    console.error('Supabase Init Error:', e);
  }
} else {
  console.warn('Supabase Credentials Missing. Persistence features will be disabled.');
  // Mock client to prevent crashes in the UI
  supabaseInstance = {
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), send: () => {} }),
    removeChannel: () => {},
    from: () => ({ insert: () => ({ select: () => ({ error: null }) }), select: () => ({ order: () => ({ error: null, data: [] }) }), eq: () => ({ single: () => ({ error: null, data: null }) }) })
  };
}

export const supabase = supabaseInstance;

export const dungeonService = {
  async saveDungeon(name, data) {
    if (!supabaseUrl) return Promise.reject('Supabase Not Logged In');
    try {
      const { data: result, error } = await supabase
        .from('dungeons')
        .insert([{ name, config: data }])
        .select();
        
      if (error) throw error;
      return result;
    } catch (err) {
      console.error('Supabase Save Error:', err);
      throw err;
    }
  },

  async getDungeons() {
    if (!supabaseUrl) return [];
    try {
      const { data, error } = await supabase
        .from('dungeons')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Supabase Fetch Error:', err);
      return [];
    }
  },

  async loadDungeon(id) {
    if (!supabaseUrl) return null;
    try {
      const { data, error } = await supabase
        .from('dungeons')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase Load Error:', err);
      throw err;
    }
  }
};

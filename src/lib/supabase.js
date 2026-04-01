import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const dungeonService = {
  async saveDungeon(name, data) {
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
    try {
      const { data, error } = await supabase
        .from('dungeons')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase Fetch Error:', err);
      throw err;
    }
  },

  async loadDungeon(id) {
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

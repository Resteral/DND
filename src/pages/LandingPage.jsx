import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, UserPlus, Users, ChevronRight, Wand2, Library, Shield, Sword, Box, Trash2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { characterService, dungeonService } from '../lib/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [savedHeroes, setSavedHeroes] = useState([]);
  const [savedDungeons, setSavedDungeons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(searchParams.get('mode') === 'hero-saved');

  useEffect(() => {
    if (showToast) {
       setTimeout(() => setShowToast(false), 5000);
    }
  }, [showToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroes, dungeons] = await Promise.all([
          characterService.getCharacters(),
          dungeonService.getDungeons()
        ]);
        setSavedHeroes(heroes);
        setSavedDungeons(dungeons);
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const handleDeleteHero = async (id) => {
    if (window.confirm('Exile this hero from the Arcanum?')) {
      await characterService.deleteCharacter(id);
      setSavedHeroes(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleDeleteDungeon = async (id) => {
    if (window.confirm('Collapse this dungeon reality forever?')) {
       await dungeonService.deleteDungeon(id);
       setSavedDungeons(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="landing-container" style={{ 
      width: '100vw', height: '100dvh', background: 'radial-gradient(circle at center, #1a1025 0%, #08050a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'auto', padding: '4rem 1rem'
    }}>
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Sparkles color="var(--accent-gold)" size={48} />
          <h1 style={{ fontSize: '4rem', letterSpacing: '0.5rem', fontWeight: '900', color: 'var(--accent-gold)' }} className="gold-glow">ARCANE VTT</h1>
        </div>
        <p style={{ color: 'var(--text-dim)', letterSpacing: '0.3rem', marginTop: '1rem' }}>THE ULTIMATE D&D 3D MASTER PORTAL</p>
      </motion.div>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            style={{ 
              position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--accent-gold)', color: 'black', padding: '1rem 2rem', borderRadius: '50px', 
              fontWeight: 'bold', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 20px var(--accent-gold)' 
            }}>
             <Sparkles size={20} /> HERO FORGED & VAULTED
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.div whileHover={{ scale: 1.05, y: -10 }} className="panel" style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1.5px solid var(--accent-purple)' }} onClick={() => navigate('/create-character')}>
          <UserPlus size={48} color="var(--accent-purple)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>CREATE HERO</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>In-depth character forging with AI-generated 3D miniatures.</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05, y: -10 }} className="panel" style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1.5px solid var(--accent-gold)' }} onClick={() => navigate('/session?mode=create-dungeon')}>
          <Wand2 size={48} color="var(--accent-gold)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>BUILD REALM</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Synthesize 3D dungeons with AI and save to the Arcanum Archive.</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05, y: -10 }} className="panel" style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1.5px solid #4eb2ff' }} onClick={() => navigate('/session?room=party-lobby')}>
          <Users size={48} color="#4eb2ff" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>GROUP PARTY</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Join a live dungeon session with your group and Realm Chat.</p>
        </motion.div>
      </div>

      {/* Hero Vault Dashboard */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1.5px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
           <Library size={24} color="var(--accent-gold)" />
           <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>THE ARCANUM HERO VAULT</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
           {savedHeroes.map((hero, i) => (
             <motion.div key={hero.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="panel" style={{ padding: '1.5rem', border: `1.5px solid ${hero.color || 'var(--accent-purple)'}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: hero.color }}>{hero.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{hero.class}</p>
                   </div>
                   <button onClick={() => handleDeleteHero(hero.id)} style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', margin: '1.2rem 0' }}>
                   {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => (
                     <div key={s} className="stat-grid-item" style={{ padding: '8px' }}>
                        <div style={{ fontSize: '9px', opacity: 0.5 }}>{s}</div>
                        <div style={{ fontWeight: 'bold' }}>{hero.stats?.[s.toLowerCase()] || 10}</div>
                     </div>
                   ))}
                </div>

                <button className="btn" style={{ width: '100%', padding: '0.75rem', fontSize: '0.8rem' }} onClick={() => navigate(`/session?room=vault-${hero.id}`)}> SUMMON TO REALM </button>
             </motion.div>
           ))}
           {savedHeroes.length === 0 && !isLoading && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--text-dim)' }}>No heroes found in the vault. Forge your first identity above.</p>
             </div>
           )}
        </div>
      </motion.div>

      {/* Saved Realms Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1.5px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
           <Library size={24} color="#4eb2ff" />
           <h2 style={{ fontSize: '1.5rem', color: '#4eb2ff' }}>SAVED ARCHIVE: ACTIVE REALMS</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
           {savedDungeons.map((dungeon, i) => (
             <motion.div key={dungeon.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="panel" style={{ padding: '1.5rem', border: `1.5px solid rgba(78, 178, 255, 0.3)`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: '#4eb2ff' }}>{dungeon.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(dungeon.created_at).toLocaleDateString()}</p>
                   </div>
                   <button onClick={() => handleDeleteDungeon(dungeon.id)} style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                </div>

                <div style={{ margin: '1.2rem 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                   <div>ENVIRONMENT: {dungeon.config?.roomType?.toUpperCase()}</div>
                   <div>PARTY SIZE: {dungeon.config?.characters?.length || 0} HEROES</div>
                </div>

                <button className="btn" style={{ width: '100%', padding: '0.75rem', fontSize: '0.8rem', background: '#2c3e50', border: '1px solid #4eb2ff' }} onClick={() => navigate(`/session?room=dungeon-${dungeon.id}`)}> RESUME REALM </button>
             </motion.div>
           ))}
           {savedDungeons.length === 0 && !isLoading && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--text-dim)' }}>The archive is empty. Begin a new session above.</p>
             </div>
           )}
        </div>
      </motion.div>

      <footer style={{ marginTop: '5rem', marginBottom: '2rem', color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '0.1rem' }}>
         POWERED BY MESHY AI • SUPABASE • VERCEL
      </footer>
    </div>
  );
};

export default LandingPage;

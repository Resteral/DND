import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Sword, 
  MapPin, 
  UserPlus, 
  Users, 
  ChevronRight, 
  Wand2, 
  Library, 
  Shield 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="landing-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'radial-gradient(circle at center, #1a1025 0%, #08050a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Particles (Visual placeholders) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.2, pointerEvents: 'none' }}>
         {[...Array(20)].map((_, i) => (
           <motion.div 
             key={i}
             animate={{ 
               y: [0, -100, 0], 
               opacity: [0.2, 0.5, 0.2],
               scale: [1, 1.2, 1] 
             }}
             transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
             style={{ 
               position: 'absolute', 
               top: `${Math.random() * 100}%`, 
               left: `${Math.random() * 100}%`,
               width: '2px', height: '2px', background: 'var(--accent-gold)', borderRadius: '50%'
             }}
           />
         ))}
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: '4rem', zIndex: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Sparkles color="var(--accent-gold)" size={48} />
          <h1 style={{ fontSize: '4rem', letterSpacing: '0.5rem', fontWeight: '900', color: 'var(--accent-gold)' }} className="gold-glow">ARCANE VTT</h1>
        </div>
        <p style={{ color: 'var(--text-dim)', letterSpacing: '0.3rem', fontSize: '1rem' }}>THE ULTIMATE D&D 3D MASTER PORTAL</p>
      </motion.div>

      <div style={{ display: 'flex', gap: '2rem', zIndex: 10 }}>
        {/* Create Character Card */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          className="panel"
          style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--accent-purple)' }}
          onClick={() => navigate('/session?mode=create-char')}
        >
          <UserPlus size={48} color="var(--accent-purple)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>CREATE HERO</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Forge your character from D&D Beyond stats and AI assets.</p>
        </motion.div>

        {/* Create Dungeon Card */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          className="panel"
          style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--accent-gold)' }}
          onClick={() => navigate('/session?mode=create-dungeon')}
        >
          <Wand2 size={48} color="var(--accent-gold)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>BUILD REALM</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Synthesize 3D dungeons with AI and save to the Archive.</p>
        </motion.div>

        {/* Group Join Card */}
        <motion.div 
          whileHover={{ scale: 1.05, y: -10 }}
          className="panel"
          style={{ width: '300px', padding: '2.5rem', cursor: 'pointer', textAlign: 'center', border: '1px solid #4eb2ff' }}
          onClick={() => navigate('/session?mode=join')}
        >
          <Users size={48} color="#4eb2ff" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>GROUP PARTY</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Join a live dungeon session with your group in real-time.</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ marginTop: '4rem', zIndex: 10 }}
      >
        <button className="btn" style={{ padding: '1rem 3rem', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold' }} onClick={() => navigate('/session')}>
           ENTER THE VOID <ChevronRight size={20} />
        </button>
      </motion.div>

      <footer style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '0.1rem' }}>
         POWERED BY MESHY AI • SUPABASE • VERCEL
      </footer>
    </div>
  );
};

export default LandingPage;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Sword, 
  Wand2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Dice5, 
  Save,
  Palette,
  Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { meshy } from '../lib/meshy';

const CLASSES = [
  { name: 'Barbarian', icon: <Sword />, color: '#ff4b4b', desc: 'Rage-filled warrior for the front lines.' },
  { name: 'Wizard', icon: <Wand2 />, color: '#4eb2ff', desc: 'Master of arcane mysteries and high magic.' },
  { name: 'Paladin', icon: <Shield />, color: '#ffd700', desc: 'Holy knight bound by a sacred oath.' },
  { name: 'Rogue', icon: <User />, color: '#7b4eb2', desc: 'Shadow-stalker specializing in stealth.' }
];

const CharacterCreator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState({
    name: 'New Hero',
    class: 'Barbarian',
    color: '#ff4b4b',
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    prompt: '',
    modelUrl: null
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const rollStats = () => {
    const newStats = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(s => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      newStats[s] = rolls.slice(0, 3).reduce((a, b) => a + b, 0);
    });
    setCharacter({ ...character, stats: newStats });
  };

  const handleGenerateAI = async () => {
    if (!character.prompt) return alert('Describe your character first!');
    setIsGenerating(true);
    try {
      const taskId = await meshy.generateModel(`${character.class} ${character.prompt}`);
      alert(`Synthesis initialized! Task ID: ${taskId}. Your miniature will appear in the VTT shortly.`);
      setStep(4);
    } catch (err) {
      alert('AI Forge failed. Check Meshy API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const finalizeCharacter = () => {
    // In a real app, we'd save to Supabase here
    navigate('/session?mode=new-char');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#08050a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel"
        style={{ width: '800px', padding: '3rem', border: '2px solid var(--accent-gold)', background: 'rgba(15,10,20,0.95)' }}
      >
        {/* Progress Header */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }} className="gold-glow">I. IDENTITY & CALLING</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Who shall guide the party through the shadows?</p>
              
              <input 
                className="input-field" 
                placeholder="CHARACTER NAME"
                style={{ fontSize: '1.5rem', marginBottom: '2rem', padding: '1rem' }}
                value={character.name}
                onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {CLASSES.map(cls => (
                  <div 
                    key={cls.name}
                    className="die-btn"
                    style={{ padding: '1.5rem', borderColor: character.class === cls.name ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)' }}
                    onClick={() => setCharacter({ ...character, class: cls.name, color: cls.color })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       {cls.icon}
                       <b style={{ color: cls.color }}>{cls.name}</b>
                    </div>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-dim)' }}>{cls.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>II. THE ABILITY ROLLS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
                {Object.entries(character.stats).map(([k, v]) => (
                  <div key={k} className="stat-grid-item" style={{ padding: '2rem' }}>
                    <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.9rem' }}>{k}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{v}</div>
                  </div>
                ))}
              </div>
              <button className="btn" style={{ width: '100%', marginTop: '2rem', padding: '1.5rem', fontSize: '1.2rem', gap: '1rem' }} onClick={rollStats}>
                <Dice5 /> FATE DECIDES: ROLL STATS
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>III. AI FORGE: MINIATURE</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Describe your visual identity for the AI to synthesize a 3D model.</p>
              
              <textarea 
                className="input-field" 
                placeholder="Example: Elven rogue with green cloak, dual daggers, hooded and masked..."
                style={{ height: '150px', marginBottom: '2rem' }}
                value={character.prompt}
                onChange={(e) => setCharacter({ ...character, prompt: e.target.value })}
              />

              <button 
                className="btn" 
                style={{ width: '100%', padding: '1.5rem', background: 'var(--accent-purple)', gap: '1rem' }} 
                onClick={handleGenerateAI}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Box />} SYNTHESIZE 3D AVATAR
              </button>
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setStep(4)}>SKIP TO FINISH</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
               <div style={{ textAlign: 'center' }}>
                  <Sparkles size={80} color="var(--accent-gold)" style={{ marginBottom: '2rem' }} />
                  <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>HERO AWAKENED</h2>
                  <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>{character.name} the {character.class}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', margin: '3rem 0' }}>
                    {Object.values(character.stats).map((v, i) => <div key={i} className="stat-grid-item" style={{ padding: '1rem' }}>{v}</div>)}
                  </div>

                  <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }} onClick={finalizeCharacter}>
                    ENTER THE VTT SESSION
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Footer */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            {step > 1 ? (
              <button className="btn btn-outline" onClick={() => setStep(step - 1)}><ChevronLeft /> BACK</button>
            ) : <div />}
            {step < 4 && <button className="btn" onClick={() => setStep(step + 1)}>CONTINUE <ChevronRight /></button>}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CharacterCreator;

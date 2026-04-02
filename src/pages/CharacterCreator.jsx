import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Sword, Wand2, Sparkles, ChevronRight, ChevronLeft, Dice5, Save, Palette, Box, Loader2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows } from '@react-three/drei';
import { meshy } from '../lib/meshy';
import { characterService } from '../lib/supabase';
import ModelLoader from '../components/ModelLoader';

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
  const [isSaving, setIsSaving] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const status = await meshy.checkStatus(taskId);
          setGenerationProgress(status.progress || 0);
          if (status.status === 'SUCCEEDED' && status.model_urls?.glb) {
            setCharacter(prev => ({ ...prev, modelUrl: status.model_urls.glb }));
            setTaskId(null);
            setIsGenerating(false);
            setStep(4); // Auto-advance to final step
          } else if (status.status === 'FAILED') {
            alert('The Arcanum Forge failed: ' + (status.task_error?.message || 'Unknown Error'));
            setTaskId(null);
            setIsGenerating(false);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const rollStats = () => {
    const newStats = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(s => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      newStats[s] = rolls.slice(0, 3).reduce((a, b) => a + b, 0);
    });
    setCharacter({ ...character, stats: newStats });
  };

  const handleStartSynthesis = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    try {
      const id = await meshy.generateModel(`${character.class} hero, ${character.prompt}`);
      setTaskId(id);
    } catch (err) {
      alert('Synthesis request failed. Check your API key!');
      setIsGenerating(false);
    }
  };

  const finalizeCharacter = async () => {
    setIsSaving(true);
    try {
      await characterService.saveCharacter(character);
      navigate('/?mode=hero-saved');
    } catch (err) {
      alert('Failed to preserve character. Ensure Supabase is connected!');
      navigate('/session?mode=unsaved');
    } finally { setIsSaving(false); }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#08050a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="panel" style={{ width: '900px', padding: '3.5rem', border: '2px solid var(--accent-gold)', background: 'rgba(15,10,20,0.95)', position: 'relative', display: 'flex', gap: '3rem' }}>
        
        {/* Left Side: Form */}
        <div style={{ flex: 1.5 }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4].map(s => ( <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} /> ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1.5rem' }} className="gold-glow">I. IDENTITY & CALLING</h2>
                <input className="input-field" placeholder="CHARACTER NAME" style={{ fontSize: '1.5rem', marginBottom: '2rem', padding: '1rem', width: '100%' }} value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  {CLASSES.map(cls => (
                    <div key={cls.name} className="die-btn" style={{ padding: '1.2rem', borderColor: character.class === cls.name ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)', textAlign: 'left', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} onClick={() => setCharacter({ ...character, class: cls.name, color: cls.color })}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}> {cls.icon} <b style={{ color: cls.color }}>{cls.name}</b> </div>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>{cls.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>II. THE ABILITY ROLLS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
                  {Object.entries(character.stats).map(([k, v]) => ( <div key={k} className="stat-grid-item" style={{ padding: '2rem' }}> <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.9rem' }}>{k}</div> <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{v}</div> </div> ))}
                </div>
                <button className="btn" style={{ width: '100%', marginTop: '2.5rem', padding: '1.5rem', gap: '1rem' }} onClick={rollStats}> <Dice5 /> FATE DECIDES: ROLL STATS </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>III. AI FORGE: MINIATURE</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Describe your character's visual features. Meshy AI will synthesize a 3D model for the realm.</p>
                <textarea className="input-field" placeholder="Grizzled gray beard, plate armor with lion sigil, holding a massive stone maul..." style={{ height: '180px', marginBottom: '2.5rem', width: '100%' }} value={character.prompt} onChange={(e) => setCharacter({ ...character, prompt: e.target.value })} />
                <button className="btn" style={{ width: '100%', padding: '1.5rem', background: 'var(--accent-purple)', gap: '1rem' }} onClick={handleStartSynthesis} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Box />} 
                  {isGenerating ? `SYNTESIZING WORLD (${generationProgress}%)` : 'INITIALIZE SYNTHESIS'}
                </button>
                <button className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setStep(4)}>SKIP TO BATTLE</button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                 <div style={{ textAlign: 'center' }}>
                    <Sparkles size={60} color="var(--accent-gold)" style={{ marginBottom: '2.5rem' }} />
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>IDENTITY PRESERVED</h2>
                    <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>{character.name} the {character.class}</p>
                    <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                       <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>STATS RECORDED • 3D AVATAR SYNCED • ARCANUM READY</p>
                    </div>
                    <button className="btn" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', marginTop: '4rem', width: '100%' }} onClick={finalizeCharacter} disabled={isSaving}>
                      {isSaving ? <Loader2 className="animate-spin" /> : (character.modelUrl ? 'COMMIT TO VAULT' : 'FINALIZE WITHOUT MINI')}
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              {step > 1 ? <button className="btn btn-outline" onClick={() => setStep(step - 1)}><ChevronLeft /> BACK</button> : <div />}
              {step < 3 && <button className="btn" onClick={() => setStep(step + 1)}>PROCEED <ChevronRight /></button>}
            </div>
          )}
        </div>

        {/* Right Side: 3D Preview Panel */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.2rem', marginBottom: '0.3rem' }}>PREVIEW PORTAL</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{character.name}</div>
          </div>

          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 10 }}>
            {isGenerating && (
              <div style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem', borderRadius: '10px', backdropFilter: 'blur(10px)', border: '1px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <RefreshCw className="animate-spin" size={16} color="var(--accent-purple)" />
                  <span style={{ fontSize: '0.8rem' }}>FORGING: {generationProgress}%</span>
                </div>
              </div>
            )}
          </div>

          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={40} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.2} />
            <ambientLight intensity={0.5} />
            <pointLight position={[5, 5, 5]} intensity={1} color={character.color} />
            <Suspense fallback={null}>
              {character.modelUrl ? (
                <ModelLoader url={character.modelUrl} />
              ) : (
                <mesh position={[0, 0.4, 0]}>
                  <sphereGeometry args={[0.5, 32, 32]} />
                  <meshStandardMaterial color={character.color} emissive={character.color} emissiveIntensity={0.5} />
                </mesh>
              )}
              <ContactShadows resolution={1024} scale={5} blur={2.5} opacity={0.5} far={1} color="#000" />
            </Suspense>
            <Stars radius={50} depth={20} count={1000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="city" />
          </Canvas>
        </div>

      </motion.div>
    </div>
  );
};

export default CharacterCreator;


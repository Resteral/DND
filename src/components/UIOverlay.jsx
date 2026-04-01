import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  UserPlus, 
  Shield, 
  Sword, 
  MessageSquare, 
  Settings, 
  LayoutDashboard,
  Box,
  MapPin,
  ChevronRight,
  Import,
  Sparkles,
  Wand2,
  Trash2,
  Zap,
  Loader2,
  Save,
  Library,
  Volume2,
  Mic,
  Play,
  Eye,
  EyeOff,
  Flame,
  Wind
} from 'lucide-react';
import { characterImporter } from '../lib/importer';
import { motion, AnimatePresence } from 'framer-motion';
import MeshySpawner from './MeshySpawner';
import SoundRecorder from './SoundRecorder';
import { dungeonService } from '../lib/supabase';

const UIOverlay = ({ 
  onImportSuccess, 
  onRoomChange, 
  onSpawnProp, 
  onRollPhysics, 
  onClearDice,
  onSaveSound,
  onSaveDungeon,
  onLoadDungeon,
  onCastSpell,
  onToggleFog,
  showFog,
  roomType, 
  characters, 
  selectedId,
  diceHistory 
}) => {
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dungeonName, setDungeonName] = useState('');
  const [savedDungeons, setSavedDungeons] = useState([]);

  const selectedChar = characters.find((c, i) => (c.id ?? i) === selectedId);

  useEffect(() => {
    if (showLibrary) fetchDungeons();
  }, [showLibrary]);

  const fetchDungeons = async () => {
    try {
      const data = await dungeonService.getDungeons();
      setSavedDungeons(data);
    } catch (err) {
      console.warn('Supabase not connected. Using local mock dungeons.');
      setSavedDungeons([{ id: 1, name: 'The Lost Mine', created_at: new Date().toISOString() }]);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const character = await characterImporter.importFromDDB(importUrl);
      onImportSuccess(character);
      setImportUrl('');
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleProceduralGen = (type) => {
    setIsGenerating(true);
    setTimeout(() => {
      onRoomChange(type);
      setIsGenerating(false);
      setShowGenPanel(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (!dungeonName) return alert('Enter a name for your dungeon!');
    try {
      await onSaveDungeon(dungeonName);
      alert('Dungeon preserved in Supabase/Vercel Database!');
      setDungeonName('');
    } catch (err) {
      alert('Save failed. Check Supabase connection in .env');
    }
  };

  const playSound = (url) => { if (url) new Audio(url).play(); };

  return (
    <div className="app-container">
      {/* Top Bar Navigation */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="top-bar panel glowing-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles color="var(--accent-gold)" size={24} />
          <h1 className="gold-glow">Arcane VTT 3D</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => setShowLibrary(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Library size={16} /> LOAD ARCHIVE
          </button>
          
          <button className="btn btn-outline" onClick={() => onToggleFog()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: showFog ? '#ff4b4b' : 'var(--accent-gold)', borderColor: showFog ? '#ff4b4b' : 'var(--accent-gold)' }}>
             {showFog ? <EyeOff size={16} /> : <Eye size={16} />} FOG OF WAR
          </button>

          <button className="btn btn-outline" onClick={() => setShowGenPanel(!showGenPanel)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', background: showGenPanel ? 'rgba(123, 78, 178, 0.1)' : 'transparent' }}>
            <Wand2 size={16} /> GENESIS LAB
          </button>
          
          <div className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
             <MapPin size={16} /> {roomType.toUpperCase()}
          </div>
        </div>
      </motion.div>

      {/* Library/Save Modal */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="panel" style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '600px', zIndex: 2000, padding: '2.5rem', background: 'rgba(5, 5, 10, 0.99)', border: '2px solid var(--accent-gold)', pointerEvents: 'auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}> <h2 style={{ color: 'var(--accent-gold)' }}>DUNGEON ARCHIVE</h2> <button onClick={() => setShowLibrary(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button> </div>
             <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>SAVE CURRENT DUNGEON</h3>
                <div style={{ display: 'flex', gap: '1rem' }}> <input className="input-field" placeholder="Enter dungeon name..." value={dungeonName} onChange={(e) => setDungeonName(e.target.value)} /> <button className="btn" style={{ background: 'var(--accent-gold)', color: 'black' }} onClick={handleSave}> <Save size={16} /> SAVE TO CLOUD </button> </div>
             </div>
             <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>SAVED DUNGEONS</h3>
             <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {savedDungeons.map(d => ( <div key={d.id} className="die-btn" style={{ textAlign: 'left', padding: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => onLoadDungeon(d.id)}> <div> <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>{d.name}</div> <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(d.created_at).toLocaleDateString()}</div> </div> <ChevronRight size={20} color="var(--accent-purple)" /> </div> ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence> {showGenPanel && ( <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="panel" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', width: '500px', zIndex: 1000, padding: '2.5rem', background: 'rgba(8, 5, 10, 0.98)', border: '2px solid var(--accent-purple)', pointerEvents: 'auto' }}> <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}> <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem', letterSpacing: '0.2rem' }}>GENESIS LAB</h2> <button onClick={() => setShowGenPanel(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button> </div> <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}> <div className="die-btn" style={{ padding: '2.5rem', height: '140px' }} onClick={() => handleProceduralGen('dungeon')}> <Box size={40} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} /> <b style={{ letterSpacing: '2px' }}>CATACOMBS</b> </div> <div className="die-btn" style={{ padding: '2.5rem', height: '140px' }} onClick={() => handleProceduralGen('tavern')}> <Shield size={40} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} /> <b style={{ letterSpacing: '2px' }}>TAVERN</b> </div> </div> {isGenerating && <div style={{ marginTop: '2rem', textAlign: 'center' }}> <div className="glowing-panel" style={{ height: '2px', background: 'var(--accent-gold)', width: '100%', borderRadius: '2px' }}></div> <p style={{ marginTop: '1rem', color: 'var(--accent-gold)', fontSize: '0.9rem', fontStyle: 'italic' }}>SYNTHESIZING ARCANE GEOMETRY...</p> <Loader2 size={24} className="animate-spin" style={{ margin: '1rem auto', color: 'var(--accent-purple)' }} /> </div>} </motion.div> )} </AnimatePresence>

      {/* Left Interface */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="left-panel panel">
        <h3 style={{ fontSize: '0.9rem' }}><UserPlus size={16} /> PARTY MANAGEMENT</h3>
        <form onSubmit={handleImport} style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}> <input className="input-field" style={{ padding: '0.6rem', fontSize: '0.75rem' }} placeholder="D&D Beyond Character URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} /> <button type="submit" className="btn" style={{ padding: '0.5rem 0.75rem' }} disabled={isImporting}> {isImporting ? <Loader2 size={14} className="animate-spin" /> : 'SUMMON'} </button> </form>
        <div className="party-list" style={{ overflowY: 'auto', maxHeight: '150px' }}>
           {characters.map((char, i) => (
             <div key={char.id ?? i} className="stat-card stat-grid-item" style={{ marginBottom: '0.5rem', opacity: (char.id ?? i) === selectedId ? 1 : 0.6, borderColor: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ color: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'white' }}>{char.name}</b>
                  {char.soundUrl && <button onClick={() => playSound(char.soundUrl)} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer' }}><Volume2 size={12} /></button>}
                  <span style={{ color: '#ff4b4b', fontWeight: 'bold', fontSize: '11px' }}>{char.hp || '54/54'}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{char.class?.toUpperCase() || 'ADVENTURER'}</div>
             </div>
           ))}
        </div>
        <MeshySpawner onSpawn={onSpawnProp} />
        {selectedChar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}> <Sparkles size={14} /> CHARACTER STATS </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '1rem' }}>
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => ( <div key={s} className="stat-grid-item"> <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{s}</div> <div style={{ fontWeight: 'bold' }}>{selectedChar.stats?.[s.toLowerCase()] || 12}</div> </div> ))}
            </div>
            <SoundRecorder onSave={(url) => onSaveSound(selectedId, url)} entityName={selectedChar.name} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
               <button className="btn" style={{ background: '#4b1818', color: 'white', border: '1px solid #ff4b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => onCastSpell('#ff4b4b')}> <Flame size={14} /> ATTACK</button>
               <button className="btn" style={{ background: '#1d3a5a', color: 'white', border: '1px solid #4eb2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => onCastSpell('#4eb2ff')}> <Wind size={14} /> SPELL</button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Right Interface */}
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="right-panel panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <h3><Sword size={16} /> BATTLE LOG</h3> <button className="btn" style={{ padding: '2px 8px', fontSize: '9px', background: 'transparent', border: '1px solid var(--accent-purple)' }} onClick={onClearDice}>CLEAR 3D DICE</button> </div>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
          <div style={{ height: '350px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
             {diceHistory.map((roll, i) => (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} style={{ marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}> <b style={{ color: 'var(--accent-purple)' }}>{roll.entity}</b> <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{roll.time}</span> </div>
                   <div style={{ marginTop: '2px' }}> {roll.label}: <span style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', fontWeight: '900' }}>{roll.result || 'ROLLING...'}</span> </div>
                </motion.div>
             ))}
          </div>
        </div>
        <div className="dice-container" style={{ marginTop: '1rem' }}>
          {[4, 6, 8, 10, 12, 20].map(d => ( <button key={d} className="die-btn" style={{ padding: '1rem 0.5rem' }} onClick={() => onRollPhysics(d, `Roll d${d}`)}> <Dices size={20} color="var(--accent-gold)" /> <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>D{d}</span> </button> ))}
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bottom-bar panel" style={{ border: 'none', background: 'linear-gradient(rgba(15,10,20,0), rgba(15,10,20,0.9))' }}>
         <div style={{ display: 'flex', gap: '1rem', background: 'rgba(20,15,25,0.9)', padding: '0.75rem 2rem', borderRadius: '50px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '30px' }}><Shield size={16} /> DEFENSE</button>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '30px' }}><MapPin size={16} /> GRID</button>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '30px' }}><Zap size={16} /> VFX</button>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: 'auto 0.5rem' }}></div>
            <button className="btn" style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', borderRadius: '30px' }}>MASTER TURN RELEASE</button>
         </div>
      </motion.div>
    </div>
  );
};

export default UIOverlay;

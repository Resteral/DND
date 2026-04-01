import React, { useState, useEffect } from 'react';
import { 
  Dices, UserPlus, Shield, Sword, MessageSquare, Settings, LayoutDashboard, Box, MapPin, 
  ChevronRight, Import, Sparkles, Wand2, Trash2, Zap, Loader2, Save, Library, Volume2, 
  Mic, Play, Eye, EyeOff, Flame, Wind, FlameKindling, Send
} from 'lucide-react';
import { characterImporter } from '../lib/importer';
import { motion, AnimatePresence } from 'framer-motion';
import MeshySpawner from './MeshySpawner';
import SoundRecorder from './SoundRecorder';
import { dungeonService } from '../lib/supabase';

const UIOverlay = ({ 
  onImportSuccess, onRoomChange, onSpawnProp, onRollPhysics, onClearDice, onSaveSound, 
  onSaveDungeon, onLoadDungeon, onCastSpell, onToggleFog, onToggleTorches, onSendMessage,
  showFog, showTorches, roomType, characters, selectedId, diceHistory, chatHistory 
}) => {
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [message, setMessage] = useState('');
  const [dungeonName, setDungeonName] = useState('');
  const [savedDungeons, setSavedDungeons] = useState([]);

  const selectedChar = characters.find((c, i) => (c.id ?? i) === selectedId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message) return;
    onSendMessage(message);
    setMessage('');
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
    } finally { setIsImporting(false); }
  };

  const handleSave = async () => {
    if (!dungeonName) return alert('Enter a dungeon name!');
    await onSaveDungeon(dungeonName);
    setDungeonName('');
    alert('Dungeon preserved in Arcanum Archive.');
  };

  return (
    <div className="app-container">
      {/* Top Bar Navigation */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="top-bar panel glowing-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}> <Sparkles color="var(--accent-gold)" size={24} /> <h1 className="gold-glow">Arcane VTT 3D</h1> </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => setShowLibrary(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> <Library size={16} /> ARCHIVE </button>
          
          <button className="btn btn-outline" onClick={() => onToggleFog()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: showFog ? '#ff4b4b' : 'var(--accent-gold)', borderColor: showFog ? '#ff4b4b' : 'var(--accent-gold)' }}>
             {showFog ? <EyeOff size={16} /> : <Eye size={16} />} FOG
          </button>
          
          <button className="btn btn-outline" onClick={() => onToggleTorches()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: showTorches ? '#ffb700' : 'var(--text-dim)', borderColor: showTorches ? '#ffb700' : 'rgba(255,255,255,0.1)' }}>
             <FlameKindling size={16} /> TORCHLIGHT
          </button>

          <button className="btn btn-outline" onClick={() => setShowGenPanel(!showGenPanel)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}> <Wand2 size={16} /> GENESIS LAB </button>
          <div className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}> <MapPin size={16} /> {roomType.toUpperCase()} </div>
        </div>
      </motion.div>

      {/* Library Modal */}
      <AnimatePresence> {showLibrary && ( <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="panel" style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '600px', zIndex: 2000, padding: '2.5rem', background: 'rgba(5, 5, 10, 0.99)', border: '2px solid var(--accent-gold)', pointerEvents: 'auto' }}> <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}> <h2 style={{ color: 'var(--accent-gold)' }}>DUNGEON ARCHIVE</h2> <button onClick={() => setShowLibrary(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button> </div> <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}> <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>SAVE CURRENT REALM</h3> <div style={{ display: 'flex', gap: '1rem' }}> <input className="input-field" placeholder="Realm name..." value={dungeonName} onChange={(e) => setDungeonName(e.target.value)} /> <button className="btn" style={{ background: 'var(--accent-gold)', color: 'black' }} onClick={handleSave}> <Save size={16} /> SAVE </button> </div> </div> </motion.div> )} </AnimatePresence>

      <AnimatePresence> {showGenPanel && ( <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="panel" style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', width: '500px', zIndex: 1000, padding: '2.5rem', background: 'rgba(8, 5, 10, 0.98)', border: '2px solid var(--accent-purple)', pointerEvents: 'auto' }}> <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}> <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem', fontWeight: 'bold' }}>GENESIS LAB</h2> <button onClick={() => setShowGenPanel(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button> </div> <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}> <div className="die-btn" style={{ padding: '2rem' }} onClick={() => handleProceduralGen('dungeon')}> <Box size={40} color="var(--accent-purple)" /> <b style={{ marginTop: '1rem' }}>CATACOMBS</b> </div> <div className="die-btn" style={{ padding: '2rem' }} onClick={() => handleProceduralGen('tavern')}> <Shield size={40} color="var(--accent-gold)" /> <b style={{ marginTop: '1rem' }}>TAVERN</b> </div> </div> </motion.div> )} </AnimatePresence>

      {/* Left Interface */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="left-panel panel">
        <h3 style={{ fontSize: '0.9rem' }}><UserPlus size={16} /> REALM PARTY</h3>
        <form onSubmit={handleImport} style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}> <input className="input-field" style={{ padding: '0.6rem', fontSize: '0.75rem' }} placeholder="D&D Beyond URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} /> <button type="submit" className="btn" style={{ padding: '0.5rem' }}>SUMMON</button> </form>
        <div className="party-list" style={{ overflowY: 'auto', maxHeight: '150px' }}>
           {characters.map((char, i) => (
             <div key={char.id ?? i} className="stat-card stat-grid-item" style={{ marginBottom: '0.5rem', opacity: (char.id ?? i) === selectedId ? 1 : 0.6, borderColor: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ color: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'white' }}>{char.name}</b>
                  {char.soundUrl && <button onClick={() => new Audio(char.soundUrl).play()} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer' }}><Volume2 size={12} /></button>}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{char.class?.toUpperCase() || 'ADVENTURER'}</div>
             </div>
           ))}
        </div>
        <MeshySpawner onSpawn={onSpawnProp} />
        {selectedChar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => ( 
                <div key={s} className="stat-grid-item"> <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{s}</div> <div style={{ fontWeight: 'bold' }}>{selectedChar.stats?.[s.toLowerCase()] || 12}</div> </div> 
              ))}
            </div>
            <SoundRecorder onSave={(url) => onSaveSound(selectedId, url)} entityName={selectedChar.name} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
               <button className="btn" style={{ background: '#4b1818', border: '1px solid #ff4b4b' }} onClick={() => onCastSpell('#ff4b4b')}>ATTACK</button>
               <button className="btn" style={{ background: '#1d3a5a', border: '1px solid #4eb2ff' }} onClick={() => onCastSpell('#4eb2ff')}>SPELL</button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Right Interface - Dual Feed: Log & Chat */}
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="right-panel panel" style={{ width: '400px' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>BATTLE FEED</h3>
           <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.1)' }}></div>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>REALM CHAT</h3>
        </div>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ height: '180px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
             {diceHistory.map((roll, i) => (
                <div key={i} style={{ marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.4rem' }}>
                   <b style={{ color: 'var(--accent-purple)' }}>{roll.entity}</b> {roll.label}: <b style={{ color: 'var(--accent-gold)' }}>{roll.result || 'ROLLING...'}</b>
                </div>
             ))}
          </div>

          <div style={{ height: '300px', background: 'rgba(8, 5, 10, 0.6)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
             {chatHistory.map((chat, i) => (
                <div key={i} style={{ marginBottom: '0.5rem' }}>
                   <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>[{chat.sender}]:</span> {chat.text}
                </div>
             ))}
             {chatHistory.length === 0 && <p style={{ textAlign: 'center', opacity: 0.3, marginTop: '5rem' }}>Silence in the realm...</p>}
          </div>
          
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
             <input className="input-field" placeholder="Broadcast to party..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ padding: '0.6rem' }} />
             <button type="submit" className="btn" style={{ padding: '0.6rem' }}><Send size={16} /></button>
          </form>
        </div>
        
        <div className="dice-container" style={{ marginTop: '1rem' }}>
          {[4, 6, 8, 10, 12, 20].map(d => ( <button key={d} className="die-btn" style={{ padding: '1rem' }} onClick={() => onRollPhysics(d, `D${d}`)}> <Dices size={20} color="var(--accent-gold)" /> </button> ))}
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bottom-bar panel" style={{ border: 'none', background: 'linear-gradient(rgba(15,10,20,0), rgba(15,10,20,0.9))' }}>
         <div style={{ display: 'flex', gap: '1rem', background: 'rgba(20,15,25,0.9)', padding: '0.75rem 2.5rem', borderRadius: '50px', border: '1.5px solid var(--panel-border)', backdropFilter: 'blur(25px)' }}>
            <button className="btn btn-outline" style={{ borderRadius: '30px' }}><Shield size={16} /> SHIELD</button>
            <button className="btn btn-outline" style={{ borderRadius: '30px' }}><MapPin size={16} /> GRID</button>
            <button className="btn btn-outline" style={{ borderRadius: '30px' }}><Zap size={16} /> VFX</button>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: 'auto 0.5rem' }}></div>
            <button className="btn" style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)', fontWeight: 'bold', borderRadius: '30px' }}>MASTER TURN END</button>
         </div>
      </motion.div>
    </div>
  );
};

export default UIOverlay;

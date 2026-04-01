import React, { useState, useEffect } from 'react';
import { 
  Dices, UserPlus, Shield, Sword, MessageSquare, Settings, LayoutDashboard, Box, MapPin, 
  ChevronRight, Import, Sparkles, Wand2, Trash2, Zap, Loader2, Save, Library, Volume2, 
  Mic, Play, Eye, EyeOff, Flame, Wind, FlameKindling, Send, Music, AlertCircle, CheckCircle2
} from 'lucide-react';
import { characterImporter } from '../lib/importer';
import { motion, AnimatePresence } from 'framer-motion';
import MeshySpawner from './MeshySpawner';
import SoundRecorder from './SoundRecorder';
import { dungeonService } from '../lib/supabase';
import { InitiativeTracker, AmbientAudio } from './CombatTools';

const UIOverlay = ({ 
  onImportSuccess, onRoomChange, onSpawnProp, onRollPhysics, onClearDice, onSaveSound, 
  onSaveDungeon, onLoadDungeon, onCastSpell, onToggleFog, onToggleTorches, onSendMessage,
  onInitiativeUpdate, onTrackChange,
  showFog, showTorches, roomType, characters, selectedId, diceHistory, chatHistory,
  initiative, activeTrack 
}) => {
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState({ type: null, msg: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [message, setMessage] = useState('');
  const [dungeonName, setDungeonName] = useState('');

  const selectedChar = characters.find((c, i) => (c.id ?? i) === selectedId);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    setImportStatus({ type: 'loading', msg: 'Summoning from the weave...' });
    
    try {
      // Direct call to verification logic
      await onImportSuccess(importUrl);
      setImportStatus({ type: 'success', msg: 'Character successfully summoned!' });
      setImportUrl('');
      setTimeout(() => setImportStatus({ type: null, msg: '' }), 3000);
    } catch (err) {
      setImportStatus({ type: 'error', msg: err.message });
    } finally {
      setIsImporting(false);
    }
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

      {/* Left Interface: Party & Combat Orders */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="left-panel panel">
        <h3 style={{ fontSize: '0.9rem' }}><UserPlus size={16} /> REALM PARTY</h3>
        
        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.75rem 0' }}>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             <input className="input-field" style={{ padding: '0.6rem', fontSize: '0.75rem' }} placeholder="D&D Beyond URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
             <button type="submit" className="btn" style={{ padding: '0.5rem' }} disabled={isImporting}>
                {isImporting ? <Loader2 className="animate-spin" size={16} /> : 'SUMMON'}
             </button>
           </div>
           
           <AnimatePresence>
             {importStatus.type && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: importStatus.type === 'error' ? '#ff4b4b' : (importStatus.type === 'success' ? '#4bff4b' : 'var(--accent-gold)') }}>
                  {importStatus.type === 'error' ? <AlertCircle size={12} /> : (importStatus.type === 'success' ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />)}
                  {importStatus.msg}
               </motion.div>
             )}
           </AnimatePresence>
        </form>
        
        <InitiativeTracker initiative={initiative} onUpdate={onInitiativeUpdate} />
        <AmbientAudio activeTrack={activeTrack} onTrackChange={onTrackChange} />

        <div className="party-list" style={{ overflowY: 'auto', maxHeight: '120px', marginTop: '1rem' }}>
           {characters.map((char, i) => (
             <div key={char.id ?? i} className="stat-card" style={{ marginBottom: '0.5rem', opacity: (char.id ?? i) === selectedId ? 1 : 0.6, borderColor: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'var(--panel-border)', padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ color: (char.id ?? i) === selectedId ? 'var(--accent-gold)' : 'white', fontSize: '0.8rem' }}>{char.name}</b>
                  <span style={{ fontSize: '10px', color: '#ff4b4b', fontWeight: 'bold' }}>{char.hp || '54/54'}</span>
                </div>
             </div>
           ))}
        </div>
        
        {selectedChar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => ( <div key={s} className="stat-grid-item"> <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{s}</div> <div style={{ fontWeight: 'bold' }}>{selectedChar.stats?.[s.toLowerCase()] || 12}</div> </div> ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
               <button className="btn" style={{ background: '#4b1818', border: '1px solid #ff4b4b' }} onClick={() => onCastSpell('#ff4b4b')}>ATTACK</button>
               <button className="btn btn-outline" style={{ border: '1.5px solid var(--accent-gold)' }} onClick={() => onInitiativeUpdate([{ name: selectedChar.name, val: Math.floor(Math.random()*20)+1 }, ...initiative].sort((a,b)=>b.val-a.val))}>INITIATIVE</button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Right Interface: Battle Feed & Chat */}
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="right-panel panel" style={{ width: '380px' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>BATTLE FEED</h3>
           <div style={{ width: '2px', height: '14px', background: 'rgba(255,255,255,0.1)' }}></div>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>REALM CHAT</h3>
        </div>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ height: '180px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
             {diceHistory.map((roll, i) => ( <div key={i} style={{ marginBottom: '0.5rem' }}> <b style={{ color: 'var(--accent-purple)' }}>{roll.entity}</b> {roll.label}: <b style={{ color: 'var(--accent-gold)' }}>{roll.result || 'ROLLING...'}</b> </div> ))}
          </div>
          <div style={{ height: '300px', background: 'rgba(8, 5, 10, 0.6)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1.5px solid rgba(123, 78, 178, 0.1)' }}>
             {chatHistory.map((chat, i) => ( <div key={i} style={{ marginBottom: '0.5rem' }}> <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>[{chat.sender}]:</span> {chat.text} </div> ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (message) { onSendMessage(message); setMessage(''); } }} style={{ display: 'flex', gap: '0.5rem' }}>
             <input className="input-field" placeholder="Party message..." value={message} onChange={(e) => setMessage(e.target.value)} />
             <button type="submit" className="btn" style={{ padding: '0.6rem' }}><Send size={16} /></button>
          </form>
        </div>
        <div className="dice-container" style={{ marginTop: '1rem' }}>
          {[4, 6, 8, 10, 12, 20].map(d => ( <button key={d} className="die-btn" style={{ padding: '1rem' }} onClick={() => onRollPhysics(d, `D${d}`)}> <Dices size={20} color="var(--accent-gold)" /> </button> ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UIOverlay;

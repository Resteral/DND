import React, { useState, useEffect } from 'react';
import { 
  Dices, UserPlus, Shield, Sword, MessageSquare, Settings, LayoutDashboard, Box, MapPin, 
  ChevronRight, Import, Sparkles, Wand2, Trash2, Zap, Loader2, Save, Library, Volume2, 
  Mic, Play, Eye, EyeOff, Flame, Wind, FlameKindling, Send, Music, AlertCircle, CheckCircle2,
  BrainCircuit, Search, Ghost, Target
} from 'lucide-react';
import { characterImporter } from '../lib/importer';
import { arcaneSage } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import MeshySpawner from './MeshySpawner';
import SoundRecorder from './SoundRecorder';
import { dungeonService } from '../lib/supabase';
import { InitiativeTracker, AmbientAudio } from './CombatTools';

const UIOverlay = ({ 
  onImportSuccess, onRoomChange, onSpawnProp, onRollPhysics, onClearDice, onSaveSound, 
  onSaveDungeon, onLoadDungeon, onCastSpell, onToggleFog, onToggleTorches, onSendMessage,
  onInitiativeUpdate, onTrackChange, onSetSpellTarget,
  showFog, showTorches, roomType, characters, selectedId, diceHistory, chatHistory,
  initiative, activeTrack, activeSpell 
}) => {
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState({ type: null, msg: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [message, setMessage] = useState('');
  const [sageMsg, setSageMsg] = useState('');
  const [isSageThinking, setIsSageThinking] = useState(false);
  const [dungeonName, setDungeonName] = useState('');

  const selectedChar = characters.find((c, i) => (c.id ?? i) === selectedId);

  const handleImport = async (e) => { e.preventDefault(); if (!importUrl) return; setIsImporting(true); setImportStatus({ type: 'loading', msg: 'Summoning...' }); try { await onImportSuccess(importUrl); setImportStatus({ type: 'success', msg: 'Summoned!' }); setImportUrl(''); } catch (err) { setImportStatus({ type: 'error', msg: err.message }); } finally { setIsImporting(false); } };

  const handleSage = async (e) => {
     e.preventDefault(); if (!sageMsg || isSageThinking) return;
     const userMsg = sageMsg; setSageMsg(''); setIsSageThinking(true);
     onSendMessage(`Querying Sage: "${userMsg}"`);
     try {
       const res = await arcaneSage.summonResponse(userMsg);
       onSendMessage(`Sage Decree: ${res}`);
     } finally { setIsSageThinking(false); }
  };

  return (
    <div className="app-container">
      {/* Top Bar Navigation */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="top-bar panel glowing-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}> <Sparkles color="var(--accent-gold)" size={24} /> <h1 className="gold-glow">Arcane VTT 3D</h1> </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => setShowLibrary(true)} style={{ color: 'var(--accent-gold)' }}> <Library size={16} /> ARCHIVE </button>
          <button className="btn btn-outline" onClick={() => onToggleFog()} style={{ color: showFog ? '#ff4b4b' : 'var(--accent-gold)', borderColor: showFog ? '#ff4b4b' : 'var(--accent-gold)' }}>
             {showFog ? <EyeOff size={16} /> : <Eye size={16} />} FOG
          </button>
          <button className="btn btn-outline" onClick={() => onToggleTorches()} style={{ color: showTorches ? '#ffb700' : 'var(--text-dim)' }}>
             <FlameKindling size={16} /> TORCHLIGHT
          </button>
          <button className="btn btn-outline" onClick={() => setShowGenPanel(!showGenPanel)} style={{ border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}> <Wand2 size={16} /> GENESIS LAB </button>
          <div className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}> <MapPin size={16} /> {roomType.toUpperCase()} </div>
        </div>
      </motion.div>

      {/* Left Interface: Party & Combat Orders */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="left-panel panel">
        <h3 style={{ fontSize: '0.9rem' }}><UserPlus size={16} /> REALM PARTY</h3>
        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.75rem 0' }}> <div style={{ display: 'flex', gap: '0.5rem' }}> <input className="input-field" style={{ padding: '0.6rem', fontSize: '0.75rem' }} placeholder="D&D Beyond URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} /> <button type="submit" className="btn" style={{ padding: '0.5rem' }}>SUMMON</button> </div> </form>
        
        <InitiativeTracker initiative={initiative} onUpdate={onInitiativeUpdate} />
        <AmbientAudio activeTrack={activeTrack} onTrackChange={onTrackChange} />
        
        <div style={{ marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><BrainCircuit size={16} /> ARCANE SAGE (AI DM)</h3>
           <form onSubmit={handleSage} style={{ position: 'relative', marginTop: '0.75rem' }}>
              <input className="input-field" style={{ paddingRight: '40px', fontSize: '0.75rem' }} placeholder="Ask Sage for Rules or Quests..." value={sageMsg} onChange={(e) => setSageMsg(e.target.value)} disabled={isSageThinking} />
              <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: isSageThinking ? 'var(--accent-purple)' : 'var(--accent-gold)' }}>
                 {isSageThinking ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              </button>
           </form>
        </div>

        {selectedChar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
               <button className="btn" style={{ background: '#4b1818', border: '1px solid #ff4b4b' }} onClick={() => onSetSpellTarget('fireball')}> <Target size={14} style={{ marginRight: '6px' }} /> FIREBALL </button>
               <button className="btn btn-outline" style={{ border: '1.5px solid var(--accent-gold)' }} onClick={() => onCastSpell('#ff4b4b')}> MELEE </button>
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
          <div style={{ height: '400px', background: 'rgba(8, 5, 10, 0.6)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1.5px solid rgba(123, 78, 178, 0.1)' }}>
             {chatHistory.map((chat, i) => ( <div key={i} style={{ marginBottom: '1rem', background: chat.sender.includes('Sage') ? 'rgba(123, 78, 178, 0.1)' : 'transparent', padding: '0.5rem', borderRadius: '6px' }}> 
                <span style={{ color: chat.sender.includes('Sage') ? 'var(--accent-purple)' : 'var(--accent-gold)', fontWeight: 'bold' }}>[{chat.sender}]:</span> {chat.text} 
             </div> ))}
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

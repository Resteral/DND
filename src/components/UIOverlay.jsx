import React, { useState, useEffect } from 'react';
import { 
  Dices, UserPlus, Shield, Sword, MessageSquare, Settings, LayoutDashboard, Box, MapPin, 
  ChevronRight, Import, Sparkles, Wand2, Trash2, Zap, Loader2, Save, Library, Volume2, 
  Mic, Play, Eye, EyeOff, Flame, Wind, FlameKindling, Send, Music, AlertCircle, CheckCircle2,
  BrainCircuit, Search, Ghost, Target, Skull, UserCheck, Heart, HeartOff, Plus, Minus
} from 'lucide-react';
import { MONSTERS } from '../lib/monsters';
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
  onInitiativeUpdate, onTrackChange, onSetSpellTarget, onSpawnMonster, onModifyHP, onSetStatus,
  showFog, showTorches, roomType, characters, selectedId, diceHistory, chatHistory,
  initiative, activeTrack, activeSpell 
}) => {
  const [importUrl, setImportUrl] = useState('');
  const [tab, setTab] = useState('party');
  const [isImporting, setIsImporting] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [message, setMessage] = useState('');
  const [sageMsg, setSageMsg] = useState('');
  const [isSageThinking, setIsSageThinking] = useState(false);
  const [hpMod, setHpMod] = useState('5');

  const selectedChar = characters.find((c, i) => (c.id ?? i) === selectedId);

  const handleSage = async (e, mode = 'chat') => { 
    if (e) e.preventDefault();
    const msg = sageMsg || (mode === 'encounter' ? `Generate an encounter for a ${roomType}` : (mode === 'synthesis' ? `Design a 3D prop for a ${roomType}` : (mode === 'rules' ? 'Explain a common combat rule' : (mode === 'mapping' ? `Architect a ${roomType} layout` : ''))));
    if (!msg || isSageThinking) return; 
    setSageMsg(''); 
    setIsSageThinking(true); 
    onSendMessage(`Consulting Sage in ${mode.toUpperCase()} mode...`); 
    try { 
      const res = await arcaneSage.summonResponse(msg, chatHistory, mode); 
      if (mode === 'mapping') {
         try {
            const props = JSON.parse(res);
            props.forEach(p => onSpawnProp({ name: p.name, color: '#666', stats: { hp: 10 }, position: p.pos }));
            onSendMessage(`The Sage has Architected a new realm layout!`, 'Arcane Sage');
         } catch(e) { console.error('Mapping error:', e, res); onSendMessage(`Decree: ${res}`, 'Arcane Sage'); }
      } else {
         onSendMessage(`${mode.toUpperCase()} Decree: ${res}`, 'Arcane Sage'); 
      }
    } finally { setIsSageThinking(false); } 
  };

  return (
    <div className="app-container">
      {/* Top Bar Navigation */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="top-bar panel glowing-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}> <Sparkles color="var(--accent-gold)" size={24} /> <h1 className="gold-glow">Arcane VTT 3D</h1> </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => onToggleFog()} style={{ color: showFog ? '#ff4b4b' : 'var(--accent-gold)' }}> {showFog ? <EyeOff size={16} /> : <Eye size={16} />} FOG </button>
          <button className="btn btn-outline" onClick={() => onToggleTorches()} style={{ color: showTorches ? '#ffb700' : 'var(--text-dim)' }}> <FlameKindling size={16} /> TORCHLIGHT </button>
          <button className="btn btn-outline" onClick={() => setShowGenPanel(!showGenPanel)} style={{ border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}> <Wand2 size={16} /> GENESIS LAB </button>
          
          <select 
            className="input-field" 
            style={{ width: '120px', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
            value={roomType}
            onChange={(e) => onRoomChange(e.target.value)}
          >
            <option value="dungeon">DUNGEON</option>
            <option value="tavern">TAVERN</option>
            <option value="forest">FOREST</option>
            <option value="temple">TEMPLE</option>
          </select>

          <button className="btn" onClick={onSaveDungeon} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-gold)', color: 'black' }}>
            <Save size={16} /> SAVE SESSION
          </button>
        </div>
      </motion.div>

      {/* Left Interface: Party, Bestiary & Sage */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="left-panel panel">
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
           <button onClick={() => setTab('party')} style={{ background: 'none', border: 'none', color: tab === 'party' ? 'var(--accent-gold)' : 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}> <UserCheck size={14} /> PARTY </button>
           <button onClick={() => setTab('bestiary')} style={{ background: 'none', border: 'none', color: tab === 'bestiary' ? 'var(--accent-gold)' : 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}> <Skull size={14} /> BESTIARY </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'party' ? (
             <motion.div key="party" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <h3 style={{ fontSize: '0.8rem' }}><UserPlus size={16} /> REALM SUMMONER</h3>
               <form onSubmit={async (e) => { e.preventDefault(); if (importUrl) await onImportSuccess(importUrl); setImportUrl(''); }} style={{ margin: '0.75rem 0' }}> <input className="input-field" placeholder="D&D Beyond URL..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} /> </form>
               <InitiativeTracker initiative={initiative} onUpdate={onInitiativeUpdate} />
               <AmbientAudio activeTrack={activeTrack} onTrackChange={onTrackChange} />
             </motion.div>
          ) : (
             <motion.div key="bestiary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <h3 style={{ fontSize: '0.8rem', color: '#ff4b4b' }}><Skull size={16} /> SRD BESTIARY</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {MONSTERS.map(m => ( <div key={m.name} className="stat-card" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(255, 75, 75, 0.2)' }}> <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{m.name}</span> <button className="btn" style={{ padding: '4px 10px', fontSize: '9px', background: '#4b1818', color: '#ff4b4b' }} onClick={() => onSpawnMonster(m)}>SPAWN</button> </div> ))}
               </div>
             </motion.div>
          )}
        </AnimatePresence>
        
        <div style={{ marginTop: 'auto', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
           <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><BrainCircuit size={16} /> ARCANE SAGE (AI DM)</h3>
           <div style={{ display: 'flex', gap: '0.3rem', margin: '0.5rem 0' }}>
              {['encounter', 'rules', 'synthesis'].map(m => (
                 <button key={m} className="btn" style={{ padding: '4px 8px', fontSize: '9px', opacity: 0.8 }} onClick={() => handleSage(null, m)}>{m.toUpperCase()}</button>
              ))}
           </div>
           <form onSubmit={(e) => { e.preventDefault(); handleSage(e, 'chat'); }} style={{ position: 'relative', marginTop: '0.75rem' }}>
              <input className="input-field" style={{ paddingRight: '40px', fontSize: '0.75rem' }} placeholder="Ask rules or quests..." value={sageMsg} onChange={(e) => setSageMsg(e.target.value)} disabled={isSageThinking} />
              <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--accent-gold)' }}> {isSageThinking ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} </button>
           </form>
        </div>

        {selectedChar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', marginTop: '1rem', borderTop: '1.5px solid var(--accent-gold)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={16} color="#ff4b4b" />
                  <b style={{ color: '#ff4b4b', fontSize: '1.2rem' }}>{selectedChar.hp_current}/{selectedChar.hp_max}</b>
               </div>
               <div style={{ display: 'flex', gap: '4px' }}>
                  <input className="input-field" style={{ width: '40px', padding: '1px', textAlign: 'center', fontSize: '12px' }} value={hpMod} onChange={(e) => setHpMod(e.target.value)} />
                  <button className="btn" style={{ padding: '4px', background: '#4b1818' }} onClick={() => onSetStatus(selectedChar.id, selectedChar.status === 'burning' ? null : 'burning')}> <Flame size={12} /> </button>
                  <button className="btn" style={{ padding: '4px', background: '#4b1818' }} onClick={() => onModifyHP(selectedChar.id, -parseInt(hpMod))}> <Minus size={12} /> </button>
                  <button className="btn" style={{ padding: '4px', background: '#1c4220' }} onClick={() => onModifyHP(selectedChar.id, parseInt(hpMod))}> <Plus size={12} /> </button>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '1.5rem' }}>
               {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => (
                  <div key={s} className="stat-grid-item" style={{ padding: '4px' }}>
                     <div style={{ fontSize: '7px', opacity: 0.5 }}>{s}</div>
                     <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{selectedChar.stats?.[s.toLowerCase()] || 10}</div>
                  </div>
               ))}
            </div>
            
            <SoundRecorder entityName={selectedChar.name} onSave={(url) => onSaveSound(selectedChar.id, url)} />

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem' }}>
               {['burning', 'poisoned', 'shielded'].map(s => (
                  <button 
                    key={s} 
                    className="btn" 
                    style={{ padding: '4px 8px', fontSize: '9px', background: selectedChar.status === s ? 'var(--accent-purple)' : '#222', border: '1px solid rgba(255,255,255,0.1)' }} 
                    onClick={() => onSetStatus(selectedChar.id, selectedChar.status === s ? null : s)}
                  >
                    {s.toUpperCase()}
                  </button>
               ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
               <h4 style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>SPELLBOOK</h4>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn" style={{ background: '#4b1818', border: '1px solid #ff4b4b', fontSize: '10px' }} onClick={() => onSetSpellTarget('fireball')}> <Flame size={12} style={{ marginRight: '4px' }} /> FIREBALL </button>
                  <button className="btn" style={{ background: '#1c4220', border: '1px solid #4bff4b', fontSize: '10px' }} onClick={() => onSetSpellTarget('restore')}> <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> RESTORE </button>
                  <button className="btn" style={{ background: '#1c2242', border: '1px solid #4169e1', fontSize: '10px' }} onClick={() => onSetSpellTarget('lightning')}> <Zap size={12} style={{ marginRight: '4px' }} /> BOLT </button>
                  <button className="btn" style={{ background: '#421c42', border: '1px solid #da70d6', fontSize: '10px' }} onClick={() => onSetSpellTarget('shatter')}> <Wind size={12} style={{ marginRight: '4px' }} /> SHATTER </button>
               </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Right Interface: Battle Feed & Chat */}
      <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="right-panel panel" style={{ width: '380px' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}> <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>BATTLE FEED</h3> <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>REALM CHAT</h3> </div>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ height: '400px', background: 'rgba(8, 5, 10, 0.6)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', overflowY: 'auto', border: '1.5px solid rgba(123, 78, 178, 0.1)' }}>
             {chatHistory.map((chat, i) => ( <div key={i} style={{ marginBottom: '1rem', background: chat.sender.includes('Sage') ? 'rgba(123, 78, 178, 0.1)' : 'transparent', padding: '0.5rem', borderRadius: '6px' }}> <span style={{ color: chat.sender.includes('Sage') ? 'var(--accent-purple)' : 'var(--accent-gold)', fontWeight: 'bold' }}>[{chat.sender}]:</span> {chat.text} </div> ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (message) { onSendMessage(message); setMessage(''); } }} style={{ display: 'flex', gap: '0.5rem' }}> <input className="input-field" placeholder="Party message..." value={message} onChange={(e) => setMessage(e.target.value)} /> <button type="submit" className="btn" style={{ padding: '0.6rem' }}><Send size={16} /></button> </form>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <div className="dice-container" style={{ flex: 1 }}> 
            {[4, 6, 8, 10, 12, 20].map(d => ( 
              <button key={d} className="die-btn" style={{ padding: '0.75rem' }} onClick={() => onRollPhysics(d, `D${d}`)}> 
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>D{d}</span>
              </button> 
            ))} 
          </div>
          <button className="die-btn" style={{ padding: '0 1rem', background: 'rgba(255, 75, 75, 0.1)', color: '#ff4b4b' }} onClick={onClearDice}>
            <Trash2 size={16} />
          </button>
        </div>
        
        {/* Genesis Lab Overlay */}
        <AnimatePresence>
          {showGenPanel && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <MeshySpawner onSpawn={(prop) => { onSpawnProp(prop); setShowGenPanel(false); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UIOverlay;

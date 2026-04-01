import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import LandingPage from './pages/LandingPage';
import CharacterCreator from './pages/CharacterCreator';
import { dungeonService, supabase } from './lib/supabase';
import { characterImporter } from './lib/importer';
import './App.css';

function VTTSession() {
  const [params] = useSearchParams();
  const [roomType, setRoomType] = useState('dungeon');
  const [selectedId, setSelectedId] = useState(null);
  const [activeDice, setActiveDice] = useState([]);
  const [diceHistory, setDiceHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [showFog, setShowFog] = useState(false);
  const [showTorches, setShowTorches] = useState(false);
  const [vfxs, setVfxs] = useState([]);
  const [activeSpell, setActiveSpell] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);

  const [characters, setCharacters] = useState([
    { id: 0, name: 'Turok the Brave', color: '#ff4b4b', level: 5, class: 'Barbarian', position: [0, 0, 0], hp: '54/54', stats: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 12 } }
  ]);

  useEffect(() => {
    const channelId = params.get('room') || 'default-room-1';
    const isMock = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_URL.startsWith('https');
    setConnectionStatus(isMock ? 'mock' : 'real');

    channelRef.current = supabase.channel(channelId);
    channelRef.current
      .on('broadcast', { event: 'token-move' }, ({ payload }) => { setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, position: payload.newPosition } : c)); })
      .on('broadcast', { event: 'dice-roll' }, ({ payload }) => { setActiveDice(prev => [...prev, { id: payload.diceId, sides: payload.sides, position: payload.position }]); setDiceHistory(prev => [{ id: payload.diceId, entity: payload.entity, label: payload.label, sides: payload.sides, result: null, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 10)]); })
      .on('broadcast', { event: 'chat-msg' }, ({ payload }) => { setChatHistory(prev => [...prev, payload].slice(-15)); })
      .on('broadcast', { event: 'initiative-sync' }, ({ payload }) => { setInitiative(payload.initiative); })
      .on('broadcast', { event: 'track-sync' }, ({ payload }) => { setActiveTrack(payload.track); })
      .on('broadcast', { event: 'vfx-spell' }, ({ payload }) => { setVfxs(prev => [...prev, payload]); })
      .on('broadcast', { event: 'toggle-fog' }, ({ payload }) => { setShowFog(payload.showFog); })
      .on('broadcast', { event: 'toggle-torch' }, ({ payload }) => { setShowTorches(payload.showTorches); })
      .subscribe((status) => { if (status === 'SUBSCRIBED') setConnectionStatus(isMock ? 'mock' : 'connected'); });
    return () => { supabase.removeChannel(channelRef.current); };
  }, [params]);

  const handleCastAtPos = (pos, color) => {
    setActiveSpell(null);
    const vfx = { id: Date.now(), position: [pos.x, 0.5, pos.z], color };
    setVfxs(prev => [...prev, vfx]);
    channelRef.current?.send({ type: 'broadcast', event: 'vfx-spell', payload: vfx });
    handleSendMessage(`Cast fireball at target location!`, 'Spellcaster');
  };

  const handleSendMessage = (text, sender = 'DM') => {
    const chat = { id: Date.now(), sender, text, time: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, chat].slice(-15));
    channelRef.current?.send({ type: 'broadcast', event: 'chat-msg', payload: chat });
  };

  return (
    <>
      <div style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, pointerEvents: 'none', display: 'flex', gap: '1rem' }}>
         <div style={{ background: 'rgba(0,0,0,0.85)', padding: '4px 12px', borderRadius: '50px', fontSize: '10px', color: connectionStatus === 'mock' ? '#ffb700' : (connectionStatus === 'connected' ? '#4bff4b' : '#ff4b4b'), border: `1px solid ${connectionStatus === 'mock' ? '#ffb700' : 'rgba(255,255,255,0.1)'}`, backdropFilter: 'blur(10px)' }}>
            ● {connectionStatus === 'mock' ? 'LOCAL MODE (ENVs MISSING)' : (connectionStatus === 'connected' ? 'REALM SYNCED' : 'CONNECTING...')}
         </div>
      </div>

      <Scene 
        characters={characters} roomType={roomType} selectedId={selectedId} activeDice={activeDice} showFog={showFog} showTorches={showTorches} vfxs={vfxs} activeSpell={activeSpell}
        onSelectCharacter={setSelectedId} 
        onDiceResult={(id, res) => setDiceHistory(prev => prev.map(r => r.id === id ? { ...r, result: res } : r))}
        onMoveCharacter={(id, pos) => { setCharacters(prev => prev.map(c => (c.id === id) ? { ...c, position: pos } : c)); channelRef.current?.send({ type: 'broadcast', event: 'token-move', payload: { charId: id, newPosition: pos } }); }}
        onCompleteVFX={(id) => setVfxs(prev => prev.filter(v => v.id !== id))}
        onCastSpell={handleCastAtPos}
      />
      <UIOverlay 
        characters={characters} roomType={roomType} selectedId={selectedId} diceHistory={diceHistory} initiative={initiative} activeTrack={activeTrack} chatHistory={chatHistory} showFog={showFog} showTorches={showTorches} activeSpell={activeSpell}
        onImportSuccess={async (url) => { try { const c = await characterImporter.importFromDDB(url); const id = characters.length; setCharacters(prev => [...prev, { ...c, id, color: '#c5a059', position: [Math.random()*4-2, 0, Math.random()*4-2] }]); setSelectedId(id); } catch(e) { alert(e.message); } }}
        onRoomChange={setRoomType} onRollPhysics={(sides, label) => { const id = Date.now(); const pos=[Math.random()*2-1, 6, Math.random()*2-1]; setActiveDice(prev=>[...prev, {id, sides, position:pos}]); channelRef.current?.send({type:'broadcast', event:'dice-roll', payload:{diceId:id, sides, position:pos, entity:'User', label}}); }}
        onClearDice={() => setActiveDice([])} onToggleFog={() => { const s = !showFog; setShowFog(s); channelRef.current?.send({type:'broadcast', event:'toggle-fog', payload:{showFog:s}}); }}
        onToggleTorches={() => { const s = !showTorches; setShowTorches(s); channelRef.current?.send({type:'broadcast', event:'toggle-torch', payload:{showTorches:s}}); }}
        onSendMessage={handleSendMessage} onInitiativeUpdate={(newInit) => { setInitiative(newInit); channelRef.current?.send({type:'broadcast', event:'initiative-sync', payload:{initiative:newInit}}); }} 
        onTrackChange={(track) => { setActiveTrack(track); channelRef.current?.send({type:'broadcast', event:'track-sync', payload:{track}}); }}
        onSetSpellTarget={setActiveSpell}
        onCastSpell={(color) => { if (selectedId === null) return; const char = characters.find(c => (c.id ?? 0) === selectedId); if (!char) return; const vfx = { id: Date.now(), position: [char.position[0], 1.2, char.position[2]], color }; setVfxs(prev => [...prev, vfx]); channelRef.current?.send({ type: 'broadcast', event: 'vfx-spell', payload: vfx }); }}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-character" element={<CharacterCreator />} />
        <Route path="/session" element={<VTTSession />} />
      </Routes>
    </Router>
  );
}

export default App;

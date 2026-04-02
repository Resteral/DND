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
  const [alerts, setAlerts] = useState([]);
  const [activeSpell, setActiveSpell] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);

  const [characters, setCharacters] = useState([
    { id: 0, name: 'Turok the Brave', color: '#ff4b4b', level: 5, class: 'Barbarian', position: [0, 0, 0], hp_max: 54, hp_current: 54, stats: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 12 } }
  ]);

  useEffect(() => {
    const channelId = params.get('room') || 'default-room-1';
    const isMock = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_URL.startsWith('https');
    setConnectionStatus(isMock ? 'mock' : 'real');

    // Load dungeon if starting from archive
    if (channelId.startsWith('dungeon-')) {
      const dungeonId = channelId.replace('dungeon-', '');
      const loadDungeon = async () => {
        try {
          const { data, error } = await supabase.from('dungeons').select('*').eq('id', dungeonId).single();
          if (data && data.config) {
            const config = data.config;
            setCharacters(config.characters || []);
            setRoomType(config.roomType || 'dungeon');
            setShowFog(config.showFog || false);
            setShowTorches(config.showTorches || false);
            setInitiative(config.initiative || []);
            setActiveTrack(config.activeTrack || null);
            handleSendMessage(`Reality Stabilized. Restored realm: ${data.name}`, 'System');
          }
        } catch (e) { console.error('Dungeon load error:', e); }
      };
      loadDungeon();
    }

    // Load character if from vault
    if (channelId.startsWith('vault-')) {
      const heroId = channelId.replace('vault-', '');
      const loadHero = async () => {
        try {
          const { data, error } = await supabase.from('characters').select('*').eq('id', heroId).single();
          if (data) {
             const hp = 10 + (data.stats.con || 10); // Simple HP calc for now
             const newHero = { ...data, id: Date.now(), hp_max: hp, hp_current: hp, position: [0, 0, 0] };
             setCharacters(prev => [...prev, newHero]);
             handleSendMessage(`Summoned ${data.name} from the Arcanum Vault!`, 'System');
          }
        } catch (e) { console.error('Vault summon error:', e); }
      };
      loadHero();
    }

    channelRef.current = supabase.channel(channelId);
    channelRef.current
      .on('broadcast', { event: 'token-move' }, ({ payload }) => { setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, position: payload.newPosition } : c)); })
      .on('broadcast', { event: 'token-spawn' }, ({ payload }) => { setCharacters(prev => [...prev, payload]); })
      .on('broadcast', { event: 'token-hp' }, ({ payload }) => { 
          setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, hp_current: payload.newHP } : c));
          setAlerts(prev => [...prev, { id: Date.now(), text: (payload.mod > 0 ? '+' : '') + payload.mod, position: payload.pos, color: payload.mod > 0 ? '#4bff4b' : '#ff4b4b' }]);
      })
      .on('broadcast', { event: 'dice-roll' }, ({ payload }) => { setActiveDice(prev => [...prev, { id: payload.diceId, sides: payload.sides, position: payload.position }]); setDiceHistory(prev => [{ id: payload.diceId, entity: payload.entity, label: payload.label, sides: payload.sides, result: null, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 10)]); })
      .on('broadcast', { event: 'chat-msg' }, ({ payload }) => { setChatHistory(prev => [...prev, payload].slice(-15)); })
      .on('broadcast', { event: 'initiative-sync' }, ({ payload }) => { setInitiative(payload.initiative); })
      .on('broadcast', { event: 'track-sync' }, ({ payload }) => { setActiveTrack(payload.track); })
      .on('broadcast', { event: 'vfx-spell' }, ({ payload }) => { setVfxs(prev => [...prev, payload]); })
      .on('broadcast', { event: 'toggle-fog' }, ({ payload }) => { setShowFog(payload.showFog); })
      .on('broadcast', { event: 'toggle-torch' }, ({ payload }) => { setShowTorches(payload.showTorches); })
      .on('broadcast', { event: 'room-sync' }, ({ payload }) => { setRoomType(payload.roomType); })
      .on('broadcast', { event: 'token-sound' }, ({ payload }) => { 
          setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, soundUrl: payload.soundUrl } : c));
          new Audio(payload.soundUrl).play().catch(() => {});
      })
      .on('broadcast', { event: 'token-status' }, ({ payload }) => {
          setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, status: payload.status } : c));
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') setConnectionStatus(isMock ? 'mock' : 'connected'); });
    return () => { supabase.removeChannel(channelRef.current); };
  }, [params]);

  const handleCastAtPos = (pos, color) => {
    setActiveSpell(null);
    const vfx = { id: Date.now(), position: [pos.x, 0.5, pos.z], color };
    setVfxs(prev => [...prev, vfx]);
    channelRef.current?.send({ type: 'broadcast', event: 'vfx-spell', payload: vfx });
    handleSendMessage(`Detonated tactical spell at target location!`, 'Spellcaster');
  };

  const handleSendMessage = (text, sender = 'DM') => {
    const chat = { id: Date.now(), sender, text, time: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, chat].slice(-15));
    channelRef.current?.send({ type: 'broadcast', event: 'chat-msg', payload: chat });
  };

  const handleModifyHP = (id, mod) => {
    setCharacters(prev => prev.map(c => {
       if (c.id === id) {
          const newHP = Math.max(0, Math.min(c.hp_max, c.hp_current + mod));
          setAlerts(al => [...al, { id: Date.now(), text: (mod > 0 ? '+' : '') + mod, position: [c.position[0], 2, c.position[2]], color: mod > 0 ? '#4bff4b' : '#ff4b4b' }]);
          channelRef.current?.send({ type: 'broadcast', event: 'token-hp', payload: { charId: id, newHP, mod, pos: [c.position[0], 2, c.position[2]] } });
          return { ...c, hp_current: newHP };
       }
       return c;
    }));
  };

  const handleSaveSession = async () => {
    try {
      const config = { characters, roomType, showFog, showTorches, initiative, activeTrack };
      const sessionName = `Realm Session - ${new Date().toLocaleDateString()}`;
      await dungeonService.saveDungeon(sessionName, config);
      handleSendMessage(`Session preserved in the Arcanum Archive!`, 'System');
    } catch (e) { alert('Failed to preserve session: ' + e.message); }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, pointerEvents: 'none', display: 'flex', gap: '1rem' }}>
         <div style={{ background: 'rgba(0,0,0,0.85)', padding: '4px 12px', borderRadius: '50px', fontSize: '10px', color: connectionStatus === 'mock' ? '#ffb700' : (connectionStatus === 'connected' ? '#4bff4b' : '#ff4b4b'), border: `1px solid ${connectionStatus === 'mock' ? '#ffb700' : 'rgba(255,255,255,0.1)'}`, backdropFilter: 'blur(10px)' }}>
            ● {connectionStatus === 'mock' ? 'LOCAL MODE (ENVs MISSING)' : (connectionStatus === 'connected' ? 'REALM SYNCED' : 'CONNECTING...')}
         </div>
      </div>

      <Scene 
        characters={characters} roomType={roomType} selectedId={selectedId} activeDice={activeDice} showFog={showFog} showTorches={showTorches} vfxs={vfxs} alerts={alerts} activeSpell={activeSpell}
        onSelectCharacter={setSelectedId} 
        onDiceResult={(id, res) => setDiceHistory(prev => prev.map(r => r.id === id ? { ...r, result: res } : r))}
        onMoveCharacter={(id, pos) => { setCharacters(prev => prev.map(c => (c.id === id) ? { ...c, position: pos } : c)); channelRef.current?.send({ type: 'broadcast', event: 'token-move', payload: { charId: id, newPosition: pos } }); }}
        onCompleteVFX={(id) => setVfxs(prev => prev.filter(v => v.id !== id))}
        onCompleteAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
        onCastSpell={handleCastAtPos}
      />
      <UIOverlay 
        characters={characters} roomType={roomType} selectedId={selectedId} diceHistory={diceHistory} initiative={initiative} activeTrack={activeTrack} chatHistory={chatHistory} showFog={showFog} showTorches={showTorches} activeSpell={activeSpell}
        onImportSuccess={async (url) => { try { const c = await characterImporter.importFromDDB(url); const id = characters.length; 
            const hp = parseInt(c.hp?.split('/')[0] || '10');
            setCharacters(prev => [...prev, { ...c, id, hp_max: hp, hp_current: hp, color: '#c5a059', position: [Math.random()*4-2, 0, Math.random()*4-2] }]); setSelectedId(id); } catch(e) { alert(e.message); } }}
        onRoomChange={(type) => { setRoomType(type); channelRef.current?.send({type:'broadcast', event:'room-sync', payload:{roomType:type}}); }}
        onRollPhysics={(sides, label) => { const id = Date.now(); const pos=[Math.random()*2-1, 6, Math.random()*2-1]; setActiveDice(prev=>[...prev, {id, sides, position:pos}]); channelRef.current?.send({type:'broadcast', event:'dice-roll', payload:{diceId:id, sides, position:pos, entity:'User', label}}); }}
        onClearDice={() => setActiveDice([])} onToggleFog={() => { const s = !showFog; setShowFog(s); channelRef.current?.send({type:'broadcast', event:'toggle-fog', payload:{showFog:s}}); }}
        onToggleTorches={() => { const s = !showTorches; setShowTorches(s); channelRef.current?.send({type:'broadcast', event:'toggle-torch', payload:{showTorches:s}}); }}
        onSendMessage={handleSendMessage} onInitiativeUpdate={(newInit) => { setInitiative(newInit); channelRef.current?.send({type:'broadcast', event:'initiative-sync', payload:{initiative:newInit}}); }} 
        onTrackChange={(track) => { setActiveTrack(track); channelRef.current?.send({type:'broadcast', event:'track-sync', payload:{track}}); }}
        onSetSpellTarget={setActiveSpell} 
        onSaveSound={(charId, soundUrl) => {
           setCharacters(prev => prev.map(c => (c.id === charId) ? { ...c, soundUrl } : c));
           channelRef.current?.send({ type: 'broadcast', event: 'token-sound', payload: { charId, soundUrl } });
        }}
        onSetStatus={(charId, status) => {
           setCharacters(prev => prev.map(c => (c.id === charId) ? { ...c, status } : c));
           channelRef.current?.send({ type: 'broadcast', event: 'token-status', payload: { charId, status } });
        }}
        onSpawnProp={(prop) => {
           const id = Date.now();
           const newProp = { ...prop, id, hp_max: 1, hp_current: 1 };
           setCharacters(prev => [...prev, newProp]);
           channelRef.current?.send({ type: 'broadcast', event: 'token-spawn', payload: newProp });
           handleSendMessage(`Synthesized ${prop.name} for the Realm.`, 'System');
        }}
        onSpawnMonster={(m) => {
           const id = Date.now(); const pos = [Math.random()*6-3, 0, Math.random()*6-3];
           const hp = parseInt(m.hp.split('/')[0]);
           const newChar = { ...m, id, hp_max: hp, hp_current: hp, position: pos };
           setCharacters(prev => [...prev, newChar]);
           channelRef.current?.send({ type: 'broadcast', event: 'token-spawn', payload: newChar });
        }}
        onModifyHP={handleModifyHP}
        onSaveDungeon={handleSaveSession}
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

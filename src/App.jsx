import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import LandingPage from './pages/LandingPage';
import { dungeonService, supabase } from './lib/supabase';
import './App.css';

function VTTSession() {
  const [params] = useSearchParams();
  const [roomType, setRoomType] = useState('dungeon');
  const [selectedId, setSelectedId] = useState(null);
  const [activeDice, setActiveDice] = useState([]);
  const [diceHistory, setDiceHistory] = useState([]);
  const [showFog, setShowFog] = useState(false);
  const [vfxs, setVfxs] = useState([]);
  const channelRef = useRef(null);

  const [characters, setCharacters] = useState([
    { 
      id: 0, 
      name: 'Turok the Brave', 
      color: '#ff4b4b', 
      level: 5, 
      class: 'Barbarian', 
      position: [0, 0, 0],
      hp: '54/54',
      stats: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
      soundUrl: null
    }
  ]);

  useEffect(() => {
    const channelId = params.get('room') || 'default-room-1';
    channelRef.current = supabase.channel(channelId);

    channelRef.current
      .on('broadcast', { event: 'token-move' }, ({ payload }) => {
        setCharacters(prev => prev.map(c => (c.id === payload.charId) ? { ...c, position: payload.newPosition } : c));
      })
      .on('broadcast', { event: 'dice-roll' }, ({ payload }) => {
        setActiveDice(prev => [...prev, { id: payload.diceId, sides: payload.sides, position: payload.position }]);
        setDiceHistory(prev => [{ id: payload.diceId, entity: payload.entity, label: payload.label, sides: payload.sides, result: null, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 10)]);
      })
      .on('broadcast', { event: 'vfx-spell' }, ({ payload }) => {
        setVfxs(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'toggle-fog' }, ({ payload }) => {
        setShowFog(payload.showFog);
      })
      .subscribe();

    return () => { supabase.removeChannel(channelRef.current); };
  }, [params]);

  const handleMoveCharacter = (charId, newPosition) => {
    setCharacters(prev => prev.map(c => (c.id === charId) ? { ...c, position: newPosition } : c));
    channelRef.current?.send({ type: 'broadcast', event: 'token-move', payload: { charId, newPosition } });
  };

  const handleCastSpell = (color) => {
    if (selectedId === null) return;
    const char = characters.find(c => (c.id ?? 0) === selectedId);
    if (!char) return;

    const vfx = {
      id: Date.now(),
      position: [char.position[0], 1.2, char.position[2]],
      color: color
    };
    
    setVfxs(prev => [...prev, vfx]);
    channelRef.current?.send({ type: 'broadcast', event: 'vfx-spell', payload: vfx });
    
    // Also roll a d20 for effect
    handleRollPhysics(20, 'ARCANE CAST');
  };

  const handleToggleFog = () => {
    const newState = !showFog;
    setShowFog(newState);
    channelRef.current?.send({ type: 'broadcast', event: 'toggle-fog', payload: { showFog: newState } });
  };

  const handleRollPhysics = (sides, label) => {
    const diceId = Date.now();
    const entity = selectedId !== null ? (characters.find(c => (c.id ?? 0) === selectedId)?.name || 'Adventurer') : 'Adventurer';
    const position = [Math.random()*2-1, 6, Math.random()*2-1];
    setActiveDice(prev => [...prev, { id: diceId, sides, position }]);
    setDiceHistory(prev => [{ id: diceId, entity, label, sides, result: null, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 10)]);
    channelRef.current?.send({ type: 'broadcast', event: 'dice-roll', payload: { diceId, sides, position, entity, label } });
  };

  const handleDiceResult = useCallback((diceId, result) => {
    setDiceHistory(prev => prev.map(roll => roll.id === diceId ? { ...roll, result } : roll));
  }, []);

  const handleSaveDungeon = async (name) => {
    await dungeonService.saveDungeon(name, { characters, roomType });
  };

  const handleLoadDungeon = async (id) => {
    const data = await dungeonService.loadDungeon(id);
    if (data?.config) { setCharacters(data.config.characters); setRoomType(data.config.roomType); }
  };

  return (
    <>
      <Scene 
        characters={characters} roomType={roomType} 
        onSelectCharacter={setSelectedId} onMoveCharacter={handleMoveCharacter}
        selectedId={selectedId} activeDice={activeDice} onDiceResult={handleDiceResult}
        showFog={showFog} vfxs={vfxs} onCompleteVFX={(id) => setVfxs(prev => prev.filter(v => v.id !== id))}
      />
      <UIOverlay 
        onImportSuccess={(c) => { 
          const id = characters.length;
          setCharacters(prev => [...prev, { ...c, id, color: '#c5a059', position: [Math.random()*4-2, 0, Math.random()*4-2] }]);
          setSelectedId(id);
        }} 
        onRoomChange={setRoomType} onSpawnProp={(p) => setCharacters(prev => [...prev, { ...p, id: characters.length, type: 'prop' }])}
        onRollPhysics={handleRollPhysics} onClearDice={() => setActiveDice([])} onToggleFog={handleToggleFog} showFog={showFog}
        onSaveSound={(id, url) => setCharacters(prev => prev.map(c => (c.id ?? 0) === id ? { ...c, soundUrl: url } : c))}
        onSaveDungeon={handleSaveDungeon} onLoadDungeon={handleLoadDungeon} onCastSpell={handleCastSpell}
        roomType={roomType} characters={characters} selectedId={selectedId} diceHistory={diceHistory}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/session" element={<VTTSession />} />
      </Routes>
    </Router>
  );
}

export default App;

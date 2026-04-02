import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, PerspectiveCamera, Environment, Stars, Float, Text, 
  Circle, Sparkles, ContactShadows, useGLTF, RoundedBox, Torus
} from '@react-three/drei';
import { Physics, useSphere, useBox, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import PhysicsDice from './PhysicsDice';

const Token = ({ character, isSelected, onClick, onMove }) => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const currentPos = meshRef.current.position;
      const destPos = new THREE.Vector3(...character.position);
      currentPos.lerp(destPos, 0.1);
    }
  });

  const hpPerc = Math.max(0, character.hp_current / character.hp_max);
  const hpColor = hpPerc > 0.5 ? '#4bff4b' : (hpPerc > 0.2 ? '#ffb700' : '#ff4b4b');

  return (
    <group position={character.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.6, 0.6, 0.15, 32]} />
        <meshStandardMaterial color={isSelected ? 'var(--accent-gold)' : character.color} metalness={0.8} roughness={0.2} />
        {isSelected && <pointLight position={[0, 0.5, 0]} intensity={1.5} color="var(--accent-gold)" distance={3} />}
      </mesh>
      
      {character.modelUrl ? (
        <ModelLoader url={character.modelUrl} isSelected={isSelected} />
      ) : (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshStandardMaterial color={character.color} emissive={character.color} emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}

      {/* Persistent Status Effects */}
      {character.status === 'burning' && <Sparkles count={50} scale={1} size={4} speed={0.8} color="#ff4b4b" position={[0, 1, 0]} />}
      {character.status === 'poisoned' && <Sparkles count={30} scale={1} size={3} speed={0.4} color="#4bff4b" position={[0, 1, 0]} />}
      {character.status === 'shielded' && (
        <mesh position={[0, 1, 0]}>
           <sphereGeometry args={[1.2, 32, 32]} />
           <meshStandardMaterial color="#4b4bff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Health Bar Visualization */}
      <group position={[0, 2.2, 0]}>
        <mesh position={[0, 0, 0]}>
           <planeGeometry args={[1.2, 0.15]} />
           <meshBasicMaterial color="#000" transparent opacity={0.6} />
        </mesh>
        <mesh position={[-0.6 + (hpPerc * 0.6), 0, 0.01]}>
           <planeGeometry args={[hpPerc * 1.2, 0.1]} />
           <meshBasicMaterial color={hpColor} />
        </mesh>
      </group>

      <Text position={[0, 1.8, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" className="entity-label">
        {character.name}
      </Text>
    </group>
  );
};

const SpellVFX = ({ id, position, color, onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  useFrame((state, delta) => {
    setOpacity(prev => Math.max(0, prev - delta * 0.8));
    if (opacity <= 0) onComplete(id);
  });

  return (
    <group position={position}>
      <Sparkles count={50} scale={2} size={3} speed={0.4} color={color} opacity={opacity} />
      <pointLight intensity={opacity * 2} color={color} distance={4} />
    </group>
  );
};

const FloatingText = ({ id, text, position, color, onComplete }) => {
  const [y, setY] = useState(position[1]);
  const [opacity, setOpacity] = useState(1);
  
  useFrame((state, delta) => {
    setY(prev => prev + delta);
    setOpacity(prev => Math.max(0, prev - delta * 0.5));
    if (opacity <= 0) onComplete(id);
  });

  return (
    <Text position={[position[0], y, position[2]]} fontSize={0.4} color={color} opacity={opacity}>
      {text}
    </Text>
  );
};

const AoETargeter = ({ onCast }) => {
  const { viewport, mouse, raycaster, scene } = useThree();
  const targetRef = useRef();
  useFrame(() => {
    if (targetRef.current) {
       raycaster.setFromCamera(mouse, scene.children.find(c => c.isPerspectiveCamera));
       const intersects = raycaster.intersectObjects(scene.children, true);
       const floor = intersects.find(i => i.object.name === 'floor');
       if (floor) targetRef.current.position.set(floor.point.x, 0.1, floor.point.z);
    }
  });
  return (
    <group ref={targetRef} onClick={(e) => { e.stopPropagation(); onCast(targetRef.current.position.clone()); }}>
      <Torus args={[2, 0.05, 16, 100]} rotation={[Math.PI/2, 0, 0]}> <meshBasicMaterial color="#ff4b4b" transparent opacity={0.5} /> </Torus>
      <Circle args={[2]} rotation={[-Math.PI/2, 0, 0]} position={[0, -0.01, 0]}> <meshBasicMaterial color="#ff4b4b" transparent opacity={0.1} /> </Circle>
    </group>
  );
};

const Room = ({ type, showFog, showTorches }) => {
  const getFloorColor = () => {
    switch (type) {
      case 'dungeon': return '#0a0a0a';
      case 'tavern': return '#2a1a10';
      case 'forest': return '#0b160b';
      case 'temple': return '#1a1a2a';
      default: return '#151515';
    }
  };

  const getGridColor = () => {
    switch (type) {
      case 'forest': return '#1d2d1d';
      case 'tavern': return '#4a2d1a';
      case 'temple': return '#2d2d4a';
      default: return '#333';
    }
  };

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} name="floor">
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={getFloorColor()} roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper args={[40, 40, getGridColor(), '#111']} position={[0, 0.01, 0]} />
      
      {type === 'tavern' && (
        <group position={[0, 0, 0]}>
           {[[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([x, z], i) => (
             <mesh key={i} position={[x, 2.5, z]} castShadow>
               <boxGeometry args={[0.5, 5, 0.5]} />
               <meshStandardMaterial color="#1a100a" />
             </mesh>
           ))}
        </group>
      )}

      {type === 'forest' && (
         <group>
           {[...Array(30)].map((_, i) => (
              <mesh key={i} position={[Math.sin(i * 1.5) * (10 + i/2), 2, Math.cos(i * 1.5) * (10 + i/2)]} castShadow>
                 <coneGeometry args={[0.8, 4, 6]} />
                 <meshStandardMaterial color="#0b1a0b" roughness={1} />
              </mesh>
           ))}
         </group>
      )}

      {type === 'temple' && (
        <group>
           {[[-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8]].map(([x, y, z], i) => (
              <group key={i} position={[x, y, z]}>
                <mesh position={[0, 2, 0]}> <cylinderGeometry args={[0.6, 0.6, 4, 16]} /> <meshStandardMaterial color="#3a3a4a" /> </mesh>
                <mesh position={[0, 4, 0]}> <boxGeometry args={[1.5, 0.2, 1.5]} /> <meshStandardMaterial color="#4a4a5a" /> </mesh>
              </group>
           ))}
           <Sparkles count={300} scale={20} size={2} speed={0.3} color="#ffd700" />
        </group>
      )}

      {showFog && <fog attach="fog" args={['#000', 2, 25]} />}
      <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};

const Scene = ({ 
  characters, roomType, onSelectCharacter, onMoveCharacter, selectedId, 
  activeDice, onDiceResult, showFog, showTorches, vfxs, onCompleteVFX,
  activeSpell, onCastSpell, alerts, onCompleteAlert 
}) => {
  const [clickState, setClickState] = useState(null);
  const handlePointerDown = (e) => { if (activeSpell) return; if (e.button === 0) setClickState({ x: e.clientX, y: e.clientY }); };
  const handlePointerUp = (e) => {
    if (activeSpell || !clickState) return;
    const dist = Math.sqrt(Math.pow(e.clientX - clickState.x, 2) + Math.pow(e.clientY - clickState.y, 2));
    if (dist < 5 && selectedId !== null && e.intersections[0]?.object.name === 'floor') {
      const point = e.intersections[0].point;
      onMoveCharacter(selectedId, [point.x, 0, point.z]);
    }
    setClickState(null);
  };

  return (
    <div className="scene-container">
      <Canvas shadows onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <PerspectiveCamera makeDefault position={[8, 10, 8]} fov={40} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={20} />
        <ambientLight intensity={showTorches ? 0.2 : 0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Physics gravity={[0, -9.81, 0]}>
           <Room type={roomType} showFog={showFog} showTorches={showTorches} />
           {characters.map((char, i) => ( <Token key={char.id ?? i} character={char} isSelected={(char.id ?? i) === selectedId} onClick={() => onSelectCharacter(char.id ?? i)} onMove={(pos) => onMoveCharacter(char.id ?? i, pos)} /> ))}
           {activeDice.map(d => ( <PhysicsDice key={d.id} sides={d.sides} position={d.position} onResult={(res) => onDiceResult(d.id, res)} /> ))}
        </Physics>
        {vfxs.map(v => ( <SpellVFX key={v.id} {...v} onComplete={onCompleteVFX} /> ))}
        {alerts.map(a => ( <FloatingText key={a.id} id={a.id} text={a.text} position={a.position} color={a.color} onComplete={onCompleteAlert} /> ))}
        {activeSpell === 'fireball' && ( <AoETargeter onCast={(pos) => onCastSpell(pos, '#ff4b4b')} /> )}
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default Scene;

import React, { Suspense, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  ContactShadows, 
  Text, 
  Float,
  Html
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Physics, usePlane } from '@react-three/cannon';
import PhysicsDice from './PhysicsDice';
import { SpellVFX } from './VFX';
import * as THREE from 'three';

const ProceduralRoom = ({ type = 'dungeon', seed = 0 }) => {
  const tiles = useMemo(() => {
    const items = [];
    const size = 5;
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        const h = Math.random() * 0.1;
        const color = type === 'tavern' ? '#5a3825' : '#2a2a2a';
        items.push({ x, z, h, color });
      }
    }
    return items;
  }, [type, seed]);

  return (
    <group>
      {tiles.map((tile, i) => (
        <mesh key={i} position={[tile.x, tile.h / 2, tile.z]}>
          <boxGeometry args={[0.95, 0.1 + tile.h, 0.95]} />
          <meshStandardMaterial 
            color={tile.color} 
            roughness={0.8} 
            metalness={0.2}
            emissive={tile.color}
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
      
      <mesh position={[0, 1, -5.5]}>
        <boxGeometry args={[11, 2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-5.5, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11, 2, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
};

const PhysicsFloor = ({ onGridClick, showFog = false }) => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));
  
  return (
    <group>
      <mesh ref={ref} receiveShadow onClick={(e) => { e.stopPropagation(); onGridClick(e.point); }}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b0810" transparent opacity={0.1} />
      </mesh>
      
      {showFog && (
        <mesh position={[0, 2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <planeGeometry args={[40, 40]} />
           <meshStandardMaterial color="#08050a" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
};

const CharacterToken = ({ 
  position = [0, 0, 0], 
  name = 'Adventurer', 
  color = '#7b4eb2', 
  isSelected = false, 
  onClick,
  hp = '??/??'
}) => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
    }
  });

  return (
    <Float speed={isSelected ? 3 : 1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
          <meshStandardMaterial color={isSelected ? '#fff' : color} metalness={0.8} roughness={0.2} />
        </mesh>
        
        {isSelected && (
          <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshStandardMaterial color="#c5a059" emissive="#c5a059" emissiveIntensity={5} transparent opacity={0.8} />
          </mesh>
        )}
        
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.3} />
        </mesh>

        <mesh position={[0, 1.2, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 16]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>

        <Html position={[0, 2.8, 0]} center>
          <div className="entity-label" style={{ 
            background: 'rgba(0,0,0,0.8)', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            border: `1px solid ${isSelected ? '#c5a059' : color}`,
            color: 'white',
            fontSize: '12px',
            boxShadow: isSelected ? '0 0 10px rgba(197, 160, 89, 0.5)' : 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            <b style={{ textTransform: 'uppercase' }}>{name}</b>
          </div>
        </Html>
      </group>
    </Float>
  );
};

const Scene = ({ 
  characters = [], 
  roomType = 'dungeon', 
  onSelectCharacter, 
  onMoveCharacter,
  selectedId,
  activeDice = [], 
  onDiceResult,
  showFog,
  vfxs = [],
  onCompleteVFX
}) => {
  const handleGridClick = (point) => {
    if (selectedId !== null) {
      const snappedPosition = [Math.round(point.x), 0, Math.round(point.z)];
      onMoveCharacter(selectedId, snappedPosition);
    }
  };

  return (
    <div className="canvas-container">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 40 }} onPointerMissed={() => onSelectCharacter(null)}>
        <color attach="background" args={['#08050a']} />
        <fog attach="fog" args={['#08050a', 10, 35]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 10, 5]} intensity={150} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-5, 5, -5]} color="#7b4eb2" intensity={80} />
        
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <PhysicsFloor onGridClick={handleGridClick} showFog={showFog} />
            <ProceduralRoom type={roomType} />
            
            {characters.map((char, index) => (
              <CharacterToken 
                key={char.id ?? index} 
                position={char.position || [index * 1.5 - 2, 0, 1]} 
                name={char.name} 
                color={char.color || '#7b4eb2'} 
                isSelected={selectedId === (char.id ?? index)}
                onClick={() => onSelectCharacter(char.id ?? index)}
                hp={char.hp}
              />
            ))}
            
            {activeDice.map((dice) => (
              <PhysicsDice 
                key={dice.id} 
                position={dice.position} 
                onResult={(res) => onDiceResult(dice.id, res)} 
              />
            ))}
            
            <SpellVFX vfxs={vfxs} onCompleteVFX={onCompleteVFX} />
          </Physics>
          
          <Environment preset="night" />
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#000" />
          
          <EffectComposer>
            <Bloom luminanceThreshold={1} intensity={1.5} />
          </EffectComposer>
        </Suspense>
        
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
};

export default Scene;

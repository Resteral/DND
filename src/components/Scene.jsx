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
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(...character.position));
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      const currentPos = meshRef.current.position;
      const destPos = new THREE.Vector3(...character.position);
      currentPos.lerp(destPos, 0.1);
    }
  });

  return (
    <group position={character.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color={isSelected ? 'var(--accent-gold)' : character.color} metalness={0.8} roughness={0.2} />
        {isSelected && <pointLight position={[0, 0.5, 0]} intensity={1.5} color="var(--accent-gold)" distance={3} />}
      </mesh>
      
      {character.modelUrl ? (
        <ModelLoader url={character.modelUrl} />
      ) : (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshStandardMaterial color={character.color} emissive={character.color} emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}

      <Text position={[0, 1.5, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
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

const AoETargeter = ({ onCast }) => {
  const { viewport, mouse, raycaster, scene } = useThree();
  const targetRef = useRef();

  useFrame(() => {
    if (targetRef.current) {
       raycaster.setFromCamera(mouse, scene.children.find(c => c.isPerspectiveCamera));
       const intersects = raycaster.intersectObjects(scene.children, true);
       const floor = intersects.find(i => i.object.name === 'floor');
       if (floor) {
         targetRef.current.position.set(floor.point.x, 0.1, floor.point.z);
       }
    }
  });

  return (
    <group ref={targetRef} onClick={(e) => { e.stopPropagation(); onCast(targetRef.current.position.clone()); }}>
      <Torus args={[2, 0.05, 16, 100]} rotation={[Math.PI/2, 0, 0]}>
        <meshBasicMaterial color="#ff4b4b" transparent opacity={0.5} />
      </Torus>
      <Circle args={[2]} rotation={[-Math.PI/2, 0, 0]} position={[0, -0.01, 0]}>
        <meshBasicMaterial color="#ff4b4b" transparent opacity={0.1} />
      </Circle>
    </group>
  );
};

const Room = ({ type, showFog, showTorches }) => {
  const isDungeon = type === 'dungeon';
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} name="floor">
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={isDungeon ? '#151515' : '#2a1a10'} roughness={0.8} />
      </mesh>
      <gridHelper args={[20, 20, '#444', '#222']} position={[0, 0.01, 0]} />
      {showFog && <fog attach="fog" args={['#000', 5, 15]} />}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};

const Scene = ({ 
  characters, roomType, onSelectCharacter, onMoveCharacter, selectedId, 
  activeDice, onDiceResult, showFog, showTorches, vfxs, onCompleteVFX,
  activeSpell, onCastSpell 
}) => {
  const [clickState, setClickState] = useState(null);

  const handlePointerDown = (e) => {
    if (activeSpell) return;
    if (e.button === 0) setClickState({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    if (activeSpell) return;
    if (!clickState) return;
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
           {characters.map((char, i) => (
             <Token key={char.id ?? i} character={char} isSelected={(char.id ?? i) === selectedId} onClick={() => onSelectCharacter(char.id ?? i)} onMove={(pos) => onMoveCharacter(char.id ?? i, pos)} />
           ))}
           {activeDice.map(d => (
             <PhysicsDice key={d.id} sides={d.sides} position={d.position} onResult={(res) => onDiceResult(d.id, res)} />
           ))}
        </Physics>

        {vfxs.map(v => ( <SpellVFX key={v.id} {...v} onComplete={onCompleteVFX} /> ))}
        
        {activeSpell === 'fireball' && (
           <AoETargeter onCast={(pos) => onCastSpell(pos, '#ff4b4b')} />
        )}

        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default Scene;

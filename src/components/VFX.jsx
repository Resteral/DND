import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleBurst = ({ position = [0, 1, 0], color = '#7b4eb2', onComplete }) => {
  const pointsRef = useRef();
  const particleCount = 100;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];
      
      vel[i * 3] = (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 1] = (Math.random()) * 0.2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return [pos, vel];
  }, [position]);

  const sizes = useMemo(() => new Float32Array(particleCount).fill(0.1), []);
  
  let frameCount = 0;
  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        velocities[i * 3 + 1] -= 0.005; // Gravity
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.material.opacity -= 0.02;
    }
    frameCount++;
    if (frameCount > 60 && onComplete) onComplete();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const SpellVFX = ({ vfxs = [], onCompleteVFX }) => {
  return (
    <group>
      {vfxs.map((v) => (
        <ParticleBurst 
          key={v.id} 
          position={v.position} 
          color={v.color} 
          onComplete={() => onCompleteVFX(v.id)} 
        />
      ))}
    </group>
  );
};

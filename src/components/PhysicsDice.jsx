import React, { useState, useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const PhysicsDice = ({ sides = 20, position = [0, 5, 0], onResult }) => {
  const [ref, api] = useSphere(() => ({
    mass: 1.5,
    position,
    args: [0.55],
    linearDamping: 0.6,
    angularDamping: 0.5,
    velocity: [Math.random() * 8 - 4, -5, Math.random() * 8 - 4],
    angularVelocity: [Math.random() * 20, Math.random() * 20, Math.random() * 20],
    material: { friction: 0.8, restitution: 0.3 }
  }));

  const [result, setResult] = useState(null);
  const stableCount = useRef(0);
  const hasReported = useRef(false);
  const velocity = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => {
      velocity.current = v;
    });
    return () => unsubscribe();
  }, [api.velocity]);

  useFrame(() => {
    if (hasReported.current) return;

    const [vx, vy, vz] = velocity.current;
    // Lower threshold for "moving" to ensure it actually stops
    const isMoving = Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01 || Math.abs(vz) > 0.01;

    if (!isMoving) {
      stableCount.current++;
      if (stableCount.current > 80) { // Wait longer to ensure stability
        const finalValue = Math.floor(Math.random() * sides) + 1;
        setResult(finalValue);
        onResult(finalValue);
        hasReported.current = true;
      }
    } else {
      stableCount.current = 0;
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color="#c5a059" 
          metalness={0.9} 
          roughness={0.1}
          emissive="#c5a059"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {result && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.5}
          color="#fff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000"
        >
          {result}
        </Text>
      )}
    </group>
  );
};

export default PhysicsDice;

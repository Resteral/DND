import React, { useState, useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const DiceD20 = ({ position = [0, 5, 0], onResult }) => {
  // Linear and Angular damping help the dice lose momentum and eventually stop
  const [ref, api] = useSphere(() => ({
    mass: 1.5,
    position,
    args: [0.55],
    linearDamping: 0.6,
    angularDamping: 0.5,
    velocity: [Math.random() * 8 - 4, -5, Math.random() * 8 - 4],
    angularVelocity: [Math.random() * 15, Math.random() * 15, Math.random() * 15],
    material: { friction: 0.8, restitution: 0.3 }
  }));

  const [result, setResult] = useState(null);
  const stableCount = useRef(0);
  const hasReported = useRef(false);

  useFrame(() => {
    // Better stop detection logic
    api.velocity.subscribe((v) => {
      const isMoving = Math.abs(v[0]) > 0.05 || Math.abs(v[1]) > 0.05 || Math.abs(v[2]) > 0.05;
      if (!isMoving) {
        stableCount.current++;
        if (stableCount.current > 40 && !hasReported.current) {
          const finalValue = Math.floor(Math.random() * 20) + 1;
          setResult(finalValue);
          onResult(finalValue);
          hasReported.current = true;
        }
      } else {
        stableCount.current = 0;
      }
    });
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
          position={[0, 0.7, 0]}
          fontSize={0.4}
          color="#000"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#c5a059"
          font="https://fonts.gstatic.com/s/outfit/v11/QGYsz_NR7DWCrc7_m3mS8T_uydis.woff"
        >
          {result}
        </Text>
      )}
    </group>
  );
};

export default DiceD20;

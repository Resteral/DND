import React, { useRef, Suspense } from 'react';
import { useGLTF, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ModelLoader = ({ url, color = '#7b4eb2', isSelected = false }) => {
  // Use GLTF loader for Meshy assets
  const { scene } = useGLTF(url);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  // Apply materials from color if needed or just use pure mesh
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Optionally tint the model
      // child.material.emissive = new THREE.Color(color);
      // child.material.emissiveIntensity = 0.1;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={1.5} 
      position={[0, 0.4, 0]} 
    />
  );
};

export default ModelLoader;

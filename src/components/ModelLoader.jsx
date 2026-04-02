import React, { useRef, Suspense } from 'react';
import { useGLTF, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ModelLoader = ({ url, isSelected = false }) => {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  clonedScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={clonedScene} 
      scale={1.5} 
      position={[0, 0.4, 0]} 
    />
  );
};

export default ModelLoader;

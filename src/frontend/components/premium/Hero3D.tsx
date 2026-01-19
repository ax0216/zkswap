/**
 * ZKSwap Vault - 3D Hero Section
 *
 * Immersive hero with animated 3D vault, particle field, and call-to-action.
 */

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Box, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ============================================================================
// 3D Components
// ============================================================================

function VaultCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= 0.007;
      outerRingRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group>
        {/* Core Vault */}
        <mesh ref={meshRef}>
          <RoundedBox args={[2, 2, 2]} radius={0.2} smoothness={4}>
            <MeshDistortMaterial
              color="#6366f1"
              roughness={0.1}
              metalness={0.9}
              distort={0.2}
              speed={2}
            />
          </RoundedBox>
        </mesh>

        {/* Inner Ring */}
        <mesh ref={ringRef} position={[0, 0, 0]}>
          <torusGeometry args={[1.8, 0.05, 16, 100]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Outer Ring */}
        <mesh ref={outerRingRef} position={[0, 0, 0]}>
          <torusGeometry args={[2.5, 0.03, 16, 100]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Glowing Center */}
        <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Lock Icon Effect */}
        <Box args={[0.3, 0.5, 0.1]} position={[0, 0.1, 1.1]}>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[0.2, 0.3, 0.1]} position={[0, -0.15, 1.1]}>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </Box>
      </group>
    </Float>
  );
}

interface Particle {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
}

function FloatingParticles({ count = 100 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo<Particle[]>(() => {
    const temp: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      const scale = Math.random() * 0.05 + 0.02;
      temp.push({ x, y, z, scale, speed: Math.random() * 0.02 + 0.01 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      const matrix = new THREE.Matrix4();
      const y = particle.y + Math.sin(time * particle.speed + i) * 2;
      matrix.setPosition(particle.x, y, particle.z);
      matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#6366f1"
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#06b6d4"
      />
      <VaultCore />
      <FloatingParticles count={80} />
    </>
  );
}

// ============================================================================
// Hero Component
// ============================================================================

interface Hero3DProps {
  onGetStarted?: () => void;
}

export function Hero3D({ onGetStarted }: Hero3DProps) {
  return (
    <section className="w-full relative min-h-screen flex items-center overflow-hidden py-16 sm:py-20 md:py-0">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-midnight" />
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
      <div className="absolute inset-0 grid-pattern" />

      {/* 3D Canvas - hide on small mobile */}
      <div className="absolute inset-0 z-0 opacity-30 sm:opacity-50 md:opacity-70 lg:opacity-100">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 section-container w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs sm:text-sm text-gray-300">Live on Midnight Testnet</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            >
              <span className="text-white">Private Swaps.</span>
              <br />
              <span className="gradient-text">Zero Knowledge.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              The first privacy-preserving DEX on Midnight Network.
              Your balances and transactions protected by cutting-edge ZK proofs.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={onGetStarted}
                className="btn-neon text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Launch App
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <button className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 hover:border-white/30 transition-all duration-300">
                Read Docs
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10"
            >
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">$0</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">TVL (Testnet)</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">0.5%</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Swap Fee</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">100%</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Private</div>
              </div>
            </motion.div>
          </motion.div>

          {/* 3D Vault Space (handled by canvas behind) */}
          <div className="hidden lg:block h-[400px] xl:h-[500px]" />
        </div>
      </div>

      {/* Scroll Indicator - hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="hidden sm:block absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-1.5 sm:gap-2 text-gray-500"
        >
          <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero3D;

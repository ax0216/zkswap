/**
 * ZKSwap Vault - Particle Field Background
 *
 * Animated particle system for immersive backgrounds.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

interface ParticleFieldProps {
  count?: number;
  color?: string;
  speed?: number;
  opacity?: number;
  size?: number;
  interactive?: boolean;
}

// ============================================================================
// Particle System (Three.js)
// ============================================================================

interface ParticlesProps {
  count: number;
  color: string;
  speed: number;
  size: number;
  mousePosition: { x: number; y: number };
  interactive: boolean;
}

function Particles({ count, color, speed, size, mousePosition, interactive }: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 20;
      pos[i3 + 2] = (Math.random() - 0.5) * 10;

      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    return [pos, vel];
  }, [count]);

  useEffect(() => {
    originalPositions.current = positions.slice();
  }, [positions]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const positionAttribute = meshRef.current.geometry.getAttribute('position');
    const posArray = positionAttribute.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Base movement
      posArray[i3] += velocities[i3] * speed;
      posArray[i3 + 1] += velocities[i3 + 1] * speed;
      posArray[i3 + 2] += velocities[i3 + 2] * speed;

      // Add gentle wave motion
      posArray[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.002;

      // Interactive mouse influence
      if (interactive && originalPositions.current) {
        const dx = mousePosition.x * 10 - posArray[i3];
        const dy = mousePosition.y * 10 - posArray[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          const force = (3 - dist) * 0.02;
          posArray[i3] -= dx * force * 0.1;
          posArray[i3 + 1] -= dy * force * 0.1;
        }
      }

      // Boundary wrapping
      if (posArray[i3] > 10) posArray[i3] = -10;
      if (posArray[i3] < -10) posArray[i3] = 10;
      if (posArray[i3 + 1] > 10) posArray[i3 + 1] = -10;
      if (posArray[i3 + 1] < -10) posArray[i3 + 1] = 10;
      if (posArray[i3 + 2] > 5) posArray[i3 + 2] = -5;
      if (posArray[i3 + 2] < -5) posArray[i3 + 2] = 5;
    }

    positionAttribute.needsUpdate = true;

    // Gentle rotation
    meshRef.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// Connection Lines
// ============================================================================

interface ConnectionLinesProps {
  count: number;
  color: string;
}

function ConnectionLines({ count, color }: ConnectionLinesProps) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 6); // 2 points per line, 3 coords each
    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      // Start point
      pos[i6] = (Math.random() - 0.5) * 15;
      pos[i6 + 1] = (Math.random() - 0.5) * 15;
      pos[i6 + 2] = (Math.random() - 0.5) * 8;
      // End point (nearby)
      pos[i6 + 3] = pos[i6] + (Math.random() - 0.5) * 2;
      pos[i6 + 4] = pos[i6 + 1] + (Math.random() - 0.5) * 2;
      pos[i6 + 5] = pos[i6 + 2] + (Math.random() - 0.5) * 1;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!lineRef.current) return;
    lineRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    lineRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * 2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </lineSegments>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ParticleField({
  count = 200,
  color = '#8b5cf6',
  speed = 1,
  opacity = 0.6,
  size = 0.05,
  interactive = true,
}: ParticleFieldProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Particles
          count={count}
          color={color}
          speed={speed}
          size={size}
          mousePosition={mousePosition}
          interactive={interactive}
        />
        <ConnectionLines count={Math.floor(count / 4)} color={color} />
      </Canvas>
    </div>
  );
}

// ============================================================================
// CSS Particle Alternative (Lighter)
// ============================================================================

interface CSSParticleFieldProps {
  count?: number;
}

export function CSSParticleField({ count = 50 }: CSSParticleFieldProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-purple-500/30 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default ParticleField;

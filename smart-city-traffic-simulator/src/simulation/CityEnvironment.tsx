/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Plane, Box, Sky } from '@react-three/drei';
import * as THREE from 'three';

export const CityEnvironment: React.FC<{ lanes: any[], isDaytime: boolean }> = ({ lanes, isDaytime }) => {
  // Generate random buildings
  const buildings = useMemo(() => {
    const b = [];
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      
      // Don't place buildings on roads
      const onRoad = lanes.some(lane => {
        const dx = lane.start.x - 400 - x;
        const dz = lane.start.y - 400 - z;
        return Math.sqrt(dx * dx + dz * dz) < 150;
      });

      if (!onRoad) {
        b.push({
          id: i,
          position: [x, 0, z],
          args: [
            40 + Math.random() * 60, 
            100 + Math.random() * 400, 
            40 + Math.random() * 60
          ],
          color: isDaytime 
            ? `hsl(${200 + Math.random() * 40}, 10%, ${60 + Math.random() * 20}%)`
            : `hsl(${200 + Math.random() * 40}, 30%, ${20 + Math.random() * 20}%)`
        });
      }
    }
    return b;
  }, [lanes, isDaytime]);

  return (
    <group>
      {/* Sky / Background */}
      {isDaytime ? (
        <Sky sunPosition={[100, 100, 100]} />
      ) : (
        <color attach="background" args={['#0f172a']} />
      )}

      {/* Ground */}
      <Plane args={[5000, 5000]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color={isDaytime ? "#475569" : "#0f172a"} />
      </Plane>

      {/* Roads */}
      {lanes.map((lane, i) => {
        const dx = lane.end.x - lane.start.x;
        const dy = lane.end.y - lane.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const centerX = (lane.start.x + lane.end.x) / 2 - 400;
        const centerZ = (lane.start.y + lane.end.y) / 2 - 400;

        return (
          <group key={i} position={[centerX, 0.1, centerZ]} rotation={[0, -angle, 0]}>
            <Plane args={[length, 100]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color={isDaytime ? "#334155" : "#1e293b"} />
            </Plane>
            {/* Road Markings */}
            <Plane args={[length, 2]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <meshStandardMaterial color="#fef08a" transparent opacity={0.5} />
            </Plane>
          </group>
        );
      })}

      {/* Buildings */}
      {buildings.map(b => (
        <Box key={b.id} args={b.args as any} position={[b.position[0], (b.args[1] as number) / 2, b.position[2]]}>
          <meshStandardMaterial color={b.color} />
          {/* Windows (simple emissive boxes) */}
          {!isDaytime && (
            <>
              <Box args={[b.args[0] + 1, 2, b.args[2] + 1]} position={[0, b.args[1] / 4, 0]}>
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.2} transparent opacity={0.3} />
              </Box>
              <Box args={[b.args[0] + 1, 2, b.args[2] + 1]} position={[0, b.args[1] / 2, 0]}>
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.2} transparent opacity={0.3} />
              </Box>
            </>
          )}
        </Box>
      ))}

      {/* Ambient Light */}
      <ambientLight intensity={isDaytime ? 0.8 : 0.2} />
      <directionalLight 
        position={[500, 500, 500]} 
        intensity={isDaytime ? 1.2 : 0.5} 
        castShadow 
      />
      {!isDaytime && <fog attach="fog" args={['#0f172a', 100, 2000]} />}
    </group>
  );
};

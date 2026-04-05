/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Vehicle } from '../simulation/Vehicle.ts';
import { VehicleType } from '../simulation/types.ts';

export const Vehicle3D: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Map 2D (x, y) to 3D (x, z)
      meshRef.current.position.set(vehicle.position.x - 400, 0, vehicle.position.y - 400);
      meshRef.current.rotation.y = -vehicle.angle;
    }
  });

  const getBodyHeight = () => {
    switch (vehicle.type) {
      case VehicleType.BUS: return 15;
      case VehicleType.FIRE_TRUCK: return 12;
      case VehicleType.AMBULANCE: return 10;
      default: return 6;
    }
  };

  const bodyHeight = getBodyHeight();

  return (
    <group ref={meshRef}>
      {/* Main Body */}
      <Box args={[vehicle.width, bodyHeight, vehicle.height]} position={[0, bodyHeight / 2, 0]}>
        <meshStandardMaterial color={vehicle.color} />
      </Box>

      {/* Windows / Cabin */}
      <Box args={[vehicle.width * 0.4, bodyHeight * 0.6, vehicle.height * 0.9]} position={[vehicle.width * 0.1, bodyHeight * 0.8, 0]}>
        <meshStandardMaterial color="#334155" transparent opacity={0.7} />
      </Box>

      {/* Headlights */}
      <pointLight position={[vehicle.width / 2, bodyHeight / 2, -vehicle.height / 3]} intensity={0.5} distance={50} color="#fef08a" />
      <pointLight position={[vehicle.width / 2, bodyHeight / 2, vehicle.height / 3]} intensity={0.5} distance={50} color="#fef08a" />
      
      {/* Emergency Lights */}
      {vehicle.isEmergency && vehicle.flashState && (
        <pointLight 
          position={[0, bodyHeight + 2, 0]} 
          intensity={2} 
          distance={100} 
          color={vehicle.type === VehicleType.AMBULANCE ? "#3b82f6" : "#ef4444"} 
        />
      )}

      {/* Wheels (simple) */}
      <Box args={[8, 4, 2]} position={[-vehicle.width / 3, 2, -vehicle.height / 2 - 1]}>
        <meshStandardMaterial color="#111" />
      </Box>
      <Box args={[8, 4, 2]} position={[-vehicle.width / 3, 2, vehicle.height / 2 + 1]}>
        <meshStandardMaterial color="#111" />
      </Box>
      <Box args={[8, 4, 2]} position={[vehicle.width / 3, 2, -vehicle.height / 2 - 1]}>
        <meshStandardMaterial color="#111" />
      </Box>
      <Box args={[8, 4, 2]} position={[vehicle.width / 3, 2, vehicle.height / 2 + 1]}>
        <meshStandardMaterial color="#111" />
      </Box>
    </group>
  );
};

export const TrafficLight3D: React.FC<{ light: any }> = ({ light }) => {
  const textRef = useRef<any>(null);
  const textBackRef = useRef<any>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  const yellowLightRef = useRef<THREE.Mesh>(null);
  const greenLightRef = useRef<THREE.Mesh>(null);

  const colors = {
    Red: "#ef4444",
    Yellow: "#f59e0b",
    Green: "#10b981",
    Off: "#1e293b"
  };

  useFrame(() => {
    // Update countdown text
    if (textRef.current) {
      const time = light.getCountdownText();
      const textToDisplay = time || "";
      
      if (textRef.current.text !== textToDisplay) {
        textRef.current.text = textToDisplay;
      }
      if (textBackRef.current && textBackRef.current.text !== textToDisplay) {
        textBackRef.current.text = textToDisplay;
      }
      
      // Update text color based on state
      const activeColor = light.state === 'Red' ? colors.Red : (light.state === 'Green' ? colors.Green : colors.Yellow);
      if (textRef.current.color !== activeColor) {
        textRef.current.color = activeColor;
      }
      if (textBackRef.current && textBackRef.current.color !== activeColor) {
        textBackRef.current.color = activeColor;
      }
    }

    // Update light spheres emissive intensity
    if (redLightRef.current && yellowLightRef.current && greenLightRef.current) {
      (redLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = light.state === 'Red' ? 2 : 0;
      (yellowLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = light.state === 'Yellow' ? 2 : 0;
      (greenLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = light.state === 'Green' ? 2 : 0;
      
      (redLightRef.current.material as THREE.MeshStandardMaterial).color.set(light.state === 'Red' ? colors.Red : colors.Off);
      (yellowLightRef.current.material as THREE.MeshStandardMaterial).color.set(light.state === 'Yellow' ? colors.Yellow : colors.Off);
      (greenLightRef.current.material as THREE.MeshStandardMaterial).color.set(light.state === 'Green' ? colors.Green : colors.Off);
    }
  });

  return (
    <group position={[light.position.x - 400, 0, light.position.y - 400]} rotation={[0, Math.PI / 2 - light.angle, 0]}>
      {/* Pole */}
      <Cylinder args={[2, 2, 60]} position={[0, 30, 0]}>
        <meshStandardMaterial color="#334155" />
      </Cylinder>
      
      {/* Light Box */}
      <Box args={[10, 30, 10]} position={[0, 50, 0]}>
        <meshStandardMaterial color="#0f172a" />
      </Box>

      {/* Lights */}
      <Sphere ref={redLightRef} args={[3]} position={[0, 60, 6]}>
        <meshStandardMaterial 
          color={colors.Off} 
          emissive={colors.Red}
          emissiveIntensity={0}
        />
      </Sphere>
      <Sphere ref={yellowLightRef} args={[3]} position={[0, 50, 6]}>
        <meshStandardMaterial 
          color={colors.Off} 
          emissive={colors.Yellow}
          emissiveIntensity={0}
        />
      </Sphere>
      <Sphere ref={greenLightRef} args={[3]} position={[0, 40, 6]}>
        <meshStandardMaterial 
          color={colors.Off} 
          emissive={colors.Green}
          emissiveIntensity={0}
        />
      </Sphere>

      {/* Countdown Board */}
      <group position={[0, 75, 0]}>
        <Box args={[12, 12, 2]}>
          <meshStandardMaterial color="#000" />
        </Box>
        <Text
          ref={textRef}
          position={[0, 0, 1.1]}
          fontSize={8}
          color={colors.Red}
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
          anchorX="center"
          anchorY="middle"
        >
          0
        </Text>
        {/* Back side text */}
        <Text
          ref={textBackRef}
          position={[0, 0, -1.1]}
          rotation={[0, Math.PI, 0]}
          fontSize={8}
          color={colors.Red}
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
          anchorX="center"
          anchorY="middle"
        >
          0
        </Text>
      </group>
    </group>
  );
};

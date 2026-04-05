/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, DriverStrategy } from '../Vehicle.ts';
import { LightState } from '../types.ts';

export class NormalDriver implements DriverStrategy {
  update(vehicle: Vehicle, neighbors: Vehicle[], lights: any[], dt: number): void {
    const safeDistance = 50;
    const stopDistance = 30;
    let targetVelocity = vehicle.maxVelocity;

    // Check traffic lights
    const relevantLight = lights.find(l => l.controlledLaneIds.includes(vehicle.laneId));
    if (relevantLight) {
      const distToLight = Math.sqrt(
        Math.pow(relevantLight.position.x - vehicle.position.x, 2) +
        Math.pow(relevantLight.position.y - vehicle.position.y, 2)
      );

      // Simple check: if light is red or yellow and we're approaching it
      if (distToLight < 150 && distToLight > 20) {
        if (relevantLight.state === LightState.RED) {
          targetVelocity = 0;
        } else if (relevantLight.state === LightState.YELLOW) {
          // If too close to stop safely, proceed through yellow
          if (distToLight < 60) {
            targetVelocity = vehicle.maxVelocity;
          } else {
            targetVelocity = 0;
          }
        }
      }
    }

    // Check neighbors in front
    const vehicleInFront = neighbors.find(n => {
      if (n.id === vehicle.id) return false;
      const dx = n.position.x - vehicle.position.x;
      const dy = n.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Check if in front (dot product)
      const dot = dx * Math.cos(vehicle.angle) + dy * Math.sin(vehicle.angle);
      return dot > 0 && dist < safeDistance * 2;
    });

    if (vehicleInFront) {
      const dx = vehicleInFront.position.x - vehicle.position.x;
      const dy = vehicleInFront.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < stopDistance) {
        targetVelocity = 0;
      } else if (dist < safeDistance) {
        targetVelocity = Math.min(targetVelocity, vehicleInFront.velocity * 0.8);
      }
    }

    // Yield to emergency vehicles
    const emergencyNearby = neighbors.find(n => n.isEmergency && n.id !== vehicle.id);
    if (emergencyNearby) {
      const dx = emergencyNearby.position.x - vehicle.position.x;
      const dy = emergencyNearby.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        // Slow down or stop to let them pass
        targetVelocity *= 0.5;
        vehicle.isYielding = true;
      } else {
        vehicle.isYielding = false;
      }
    }

    // Simple acceleration logic
    if (vehicle.velocity < targetVelocity) {
      vehicle.acceleration = 0.5;
    } else {
      vehicle.acceleration = -1.0;
    }
  }
}

export class AggressiveDriver implements DriverStrategy {
  update(vehicle: Vehicle, neighbors: Vehicle[], lights: any[], dt: number): void {
    const safeDistance = 30;
    const stopDistance = 15;
    let targetVelocity = vehicle.maxVelocity * 1.2;

    // Check traffic lights - might run yellow or late red
    const relevantLight = lights.find(l => l.controlledLaneIds.includes(vehicle.laneId));
    if (relevantLight) {
      const distToLight = Math.sqrt(
        Math.pow(relevantLight.position.x - vehicle.position.x, 2) +
        Math.pow(relevantLight.position.y - vehicle.position.y, 2)
      );

      if (distToLight < 100 && distToLight > 20) {
        if (relevantLight.state === LightState.RED && distToLight > 50) {
          targetVelocity = 0;
        } else if (relevantLight.state === LightState.YELLOW) {
          // Aggressive drivers speed up for yellow
          targetVelocity = vehicle.maxVelocity * 1.5;
        }
      }
    }

    // Overtaking logic
    const vehicleInFront = neighbors.find(n => {
      if (n.id === vehicle.id) return false;
      const dx = n.position.x - vehicle.position.x;
      const dy = n.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dot = dx * Math.cos(vehicle.angle) + dy * Math.sin(vehicle.angle);
      return dot > 0 && dist < safeDistance * 2;
    });

    if (vehicleInFront) {
      const dx = vehicleInFront.position.x - vehicle.position.x;
      const dy = vehicleInFront.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < stopDistance) {
        targetVelocity = 0;
      } else if (dist < safeDistance) {
        // Try to overtake if possible (simplified: just speed up if space)
        vehicle.isOvertaking = true;
        targetVelocity = vehicle.maxVelocity * 1.3;
      }
    } else {
      vehicle.isOvertaking = false;
    }

    if (vehicle.velocity < targetVelocity) {
      vehicle.acceleration = 1.0;
    } else {
      vehicle.acceleration = -1.5;
    }
  }
}

export class EmergencyDriver implements DriverStrategy {
  update(vehicle: Vehicle, neighbors: Vehicle[], lights: any[], dt: number): void {
    // Emergency vehicles ignore traffic lights and speed
    let targetVelocity = vehicle.maxVelocity * 1.5;

    // Still need to avoid direct collisions
    const vehicleInFront = neighbors.find(n => {
      if (n.id === vehicle.id) return false;
      const dx = n.position.x - vehicle.position.x;
      const dy = n.position.y - vehicle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dot = dx * Math.cos(vehicle.angle) + dy * Math.sin(vehicle.angle);
      return dot > 0 && dist < 40;
    });

    if (vehicleInFront) {
      targetVelocity = vehicleInFront.velocity;
      if (vehicleInFront.velocity < 1) targetVelocity = 0;
    }

    if (vehicle.velocity < targetVelocity) {
      vehicle.acceleration = 2.0;
    } else {
      vehicle.acceleration = -2.0;
    }
  }
}

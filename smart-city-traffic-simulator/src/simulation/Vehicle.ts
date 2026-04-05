/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, VehicleType, DriverStyle, LightState } from './types.ts';

export interface DriverStrategy {
  update(vehicle: Vehicle, neighbors: Vehicle[], lights: any[], dt: number): void;
}

export class Vehicle {
  id: string;
  type: VehicleType;
  style: DriverStyle;
  position: Point;
  velocity: number;
  maxVelocity: number;
  acceleration: number;
  angle: number;
  width: number;
  height: number;
  color: string;
  laneId: string;
  targetLaneId: string | null = null;
  isEmergency: boolean;
  isYielding: boolean = false;
  isOvertaking: boolean = false;
  driver: DriverStrategy;
  distanceTraveled: number = 0;
  
  // For flashing lights (Ambulance/Fire Truck)
  flashTimer: number = 0;
  flashState: boolean = false;

  constructor(
    id: string,
    type: VehicleType,
    style: DriverStyle,
    position: Point,
    angle: number,
    laneId: string,
    driver: DriverStrategy
  ) {
    this.id = id;
    this.type = type;
    this.style = style;
    this.position = position;
    this.angle = angle;
    this.laneId = laneId;
    this.driver = driver;
    this.velocity = 0;
    this.acceleration = 0;
    this.isEmergency = type === VehicleType.AMBULANCE || type === VehicleType.FIRE_TRUCK;
    
    // Set dimensions and properties based on type
    switch (type) {
      case VehicleType.CAR:
        this.width = 40;
        this.height = 20;
        this.maxVelocity = 5 + Math.random() * 2;
        this.color = '#3b82f6';
        break;
      case VehicleType.MOTORCYCLE:
        this.width = 25;
        this.height = 12;
        this.maxVelocity = 6 + Math.random() * 3;
        this.color = '#ef4444';
        break;
      case VehicleType.BICYCLE:
        this.width = 20;
        this.height = 8;
        this.maxVelocity = 2 + Math.random() * 1;
        this.color = '#10b981';
        break;
      case VehicleType.AMBULANCE:
        this.width = 50;
        this.height = 25;
        this.maxVelocity = 8;
        this.color = '#ffffff';
        break;
      case VehicleType.FIRE_TRUCK:
        this.width = 65;
        this.height = 30;
        this.maxVelocity = 7;
        this.color = '#dc2626';
        break;
      case VehicleType.BUS:
        this.width = 80;
        this.height = 35;
        this.maxVelocity = 4;
        this.color = '#f59e0b';
        break;
      default:
        this.width = 30;
        this.height = 15;
        this.maxVelocity = 5;
        this.color = '#6b7280';
    }
  }

  update(neighbors: Vehicle[], lights: any[], dt: number) {
    this.driver.update(this, neighbors, lights, dt);
    
    // Basic physics integration
    this.velocity += this.acceleration * dt;
    this.velocity = Math.max(0, Math.min(this.velocity, this.maxVelocity));
    
    this.position.x += Math.cos(this.angle) * this.velocity;
    this.position.y += Math.sin(this.angle) * this.velocity;
    this.distanceTraveled += this.velocity;

    if (this.isEmergency) {
      this.flashTimer += dt;
      if (this.flashTimer > 0.2) {
        this.flashState = !this.flashState;
        this.flashTimer = 0;
      }
    }
  }
}

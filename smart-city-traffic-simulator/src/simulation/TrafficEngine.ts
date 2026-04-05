/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle } from './Vehicle.ts';
import { TrafficLight } from './TrafficLight.ts';
import { ScenarioGenerator, ScenarioData } from './ScenarioGenerator.ts';
import { ScenarioType, VehicleType, DriverStyle, Point } from './types.ts';
import { NormalDriver, AggressiveDriver, EmergencyDriver } from './drivers/Strategies.ts';

import { SoundManager } from './SoundManager.ts';

export class TrafficEngine {
  vehicles: Vehicle[] = [];
  lights: TrafficLight[] = [];
  scenarioData: ScenarioData;
  isManual: boolean = false;
  density: number = 0.5;
  lastSpawnTime: number = 0;
  spawnInterval: number = 2000; // ms
  soundManager = SoundManager.getInstance();

  constructor(scenario: ScenarioType) {
    this.scenarioData = ScenarioGenerator.generate(scenario);
    this.lights = this.scenarioData.lights.map(l => new TrafficLight(l));
  }

  update(dt: number) {
    // Update lights
    this.lights.forEach(l => {
      const prevState = l.state;
      l.update(dt, this.isManual);
      if (l.state !== prevState) {
        this.soundManager.playTurnSignal();
      }
    });

    // Update vehicles
    this.vehicles.forEach(v => {
      const prevOvertaking = v.isOvertaking;
      v.update(this.vehicles, this.lights, dt);
      
      if (v.isOvertaking && !prevOvertaking) {
        this.soundManager.playHorn();
      }
      
      if (v.isEmergency && Math.random() < 0.01) {
        this.soundManager.playSiren();
      }
    });

    // Remove vehicles that are out of bounds or finished their path
    this.vehicles = this.vehicles.filter(v => {
      const bounds = this.scenarioData.bounds;
      return v.position.x >= -100 && v.position.x <= bounds.width + 100 &&
             v.position.y >= -100 && v.position.y <= bounds.height + 100;
    });

    // Spawn new vehicles based on density
    const now = Date.now();
    const effectiveSpawnInterval = this.spawnInterval / (this.density + 0.1);
    
    if (now - this.lastSpawnTime > effectiveSpawnInterval) {
      this.spawnVehicle();
      this.lastSpawnTime = now;
    }
  }

  spawnVehicle() {
    const spawnPoint = this.scenarioData.spawnPoints[Math.floor(Math.random() * this.scenarioData.spawnPoints.length)];
    
    // Check if spawn point is clear
    const isClear = !this.vehicles.some(v => {
      const dx = v.position.x - spawnPoint.position.x;
      const dy = v.position.y - spawnPoint.position.y;
      return Math.sqrt(dx * dx + dy * dy) < 60;
    });

    if (!isClear) return;

    const types = [
      VehicleType.CAR, VehicleType.CAR, VehicleType.CAR,
      VehicleType.MOTORCYCLE, VehicleType.MOTORCYCLE,
      VehicleType.BICYCLE,
      VehicleType.BUS,
      VehicleType.AMBULANCE,
      VehicleType.FIRE_TRUCK
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const styles = [DriverStyle.NORMAL, DriverStyle.NORMAL, DriverStyle.NORMAL, DriverStyle.AGGRESSIVE];
    const style = type === VehicleType.AMBULANCE || type === VehicleType.FIRE_TRUCK 
      ? DriverStyle.EMERGENCY 
      : styles[Math.floor(Math.random() * styles.length)];

    let driver;
    switch (style) {
      case DriverStyle.EMERGENCY: driver = new EmergencyDriver(); break;
      case DriverStyle.AGGRESSIVE: driver = new AggressiveDriver(); break;
      default: driver = new NormalDriver();
    }

    const id = Math.random().toString(36).substr(2, 9);
    const vehicle = new Vehicle(
      id,
      type,
      style,
      { ...spawnPoint.position },
      spawnPoint.angle,
      spawnPoint.laneId,
      driver
    );
    
    this.vehicles.push(vehicle);
  }

  toggleLight(id: string) {
    const light = this.lights.find(l => l.id === id);
    if (light) light.toggleManual();
  }

  setScenario(scenario: ScenarioType) {
    this.scenarioData = ScenarioGenerator.generate(scenario);
    this.lights = this.scenarioData.lights.map(l => new TrafficLight(l));
    this.vehicles = [];
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, Lane, ScenarioType, LightType, LightState, TrafficLightConfig } from './types.ts';

export interface ScenarioData {
  lanes: Lane[];
  lights: TrafficLightConfig[];
  spawnPoints: { laneId: string; position: Point; angle: number }[];
  bounds: { width: number; height: number };
}

export class ScenarioGenerator {
  static generate(type: ScenarioType): ScenarioData {
    switch (type) {
      case ScenarioType.JUNCTION_3:
        return this.generate3Way();
      case ScenarioType.JUNCTION_4:
        return this.generate4Way();
      case ScenarioType.JUNCTION_5:
        return this.generate5Way();
      case ScenarioType.CITY_GRID:
        return this.generateCityGrid();
      default:
        return this.generate4Way();
    }
  }

  private static generate4Way(): ScenarioData {
    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    const roadWidth = 100;
    const laneWidth = roadWidth / 2;

    const lanes: Lane[] = [
      // North to South
      { id: 'n-s-1', start: { x: centerX - laneWidth / 2, y: 0 }, end: { x: centerX - laneWidth / 2, y: centerY - roadWidth / 2 }, direction: Math.PI / 2, nextLanes: ['n-s-2', 'n-e-1', 'n-w-1'] },
      { id: 'n-s-2', start: { x: centerX - laneWidth / 2, y: centerY + roadWidth / 2 }, end: { x: centerX - laneWidth / 2, y: height }, direction: Math.PI / 2, nextLanes: [] },
      
      // South to North
      { id: 's-n-1', start: { x: centerX + laneWidth / 2, y: height }, end: { x: centerX + laneWidth / 2, y: centerY + roadWidth / 2 }, direction: -Math.PI / 2, nextLanes: ['s-n-2', 's-e-1', 's-w-1'] },
      { id: 's-n-2', start: { x: centerX + laneWidth / 2, y: centerY - roadWidth / 2 }, end: { x: centerX + laneWidth / 2, y: 0 }, direction: -Math.PI / 2, nextLanes: [] },
      
      // West to East
      { id: 'w-e-1', start: { x: 0, y: centerY + laneWidth / 2 }, end: { x: centerX - roadWidth / 2, y: centerY + laneWidth / 2 }, direction: 0, nextLanes: ['w-e-2', 'w-n-1', 'w-s-1'] },
      { id: 'w-e-2', start: { x: centerX + roadWidth / 2, y: centerY + laneWidth / 2 }, end: { x: width, y: centerY + laneWidth / 2 }, direction: 0, nextLanes: [] },
      
      // East to West
      { id: 'e-w-1', start: { x: width, y: centerY - laneWidth / 2 }, end: { x: centerX + roadWidth / 2, y: centerY - laneWidth / 2 }, direction: Math.PI, nextLanes: ['e-w-2', 'e-n-1', 'e-s-1'] },
      { id: 'e-w-2', start: { x: centerX - roadWidth / 2, y: centerY - laneWidth / 2 }, end: { x: 0, y: centerY - laneWidth / 2 }, direction: Math.PI, nextLanes: [] },
    ];

    const lights: TrafficLightConfig[] = [
      { id: 'l-n', position: { x: centerX - roadWidth / 2, y: centerY - roadWidth / 2 }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.RED, durations: { [LightState.RED]: 13, [LightState.YELLOW]: 3, [LightState.GREEN]: 10 }, controlledLaneIds: ['n-s-1'], angle: -Math.PI / 2 },
      { id: 'l-s', position: { x: centerX + roadWidth / 2, y: centerY + roadWidth / 2 }, type: LightType.LAST_10S_COUNTDOWN, initialState: LightState.RED, durations: { [LightState.RED]: 13, [LightState.YELLOW]: 3, [LightState.GREEN]: 10 }, controlledLaneIds: ['s-n-1'], angle: Math.PI / 2 },
      { id: 'l-w', position: { x: centerX - roadWidth / 2, y: centerY + roadWidth / 2 }, type: LightType.NO_COUNTDOWN, initialState: LightState.GREEN, durations: { [LightState.RED]: 13, [LightState.YELLOW]: 3, [LightState.GREEN]: 10 }, controlledLaneIds: ['w-e-1'], angle: Math.PI },
      { id: 'l-e', position: { x: centerX + roadWidth / 2, y: centerY - roadWidth / 2 }, type: LightType.NO_COUNTDOWN, initialState: LightState.GREEN, durations: { [LightState.RED]: 13, [LightState.YELLOW]: 3, [LightState.GREEN]: 10 }, controlledLaneIds: ['e-w-1'], angle: 0 },
    ];

    const spawnPoints = [
      { laneId: 'n-s-1', position: { x: centerX - laneWidth / 2, y: 0 }, angle: Math.PI / 2 },
      { laneId: 's-n-1', position: { x: centerX + laneWidth / 2, y: height }, angle: -Math.PI / 2 },
      { laneId: 'w-e-1', position: { x: 0, y: centerY + laneWidth / 2 }, angle: 0 },
      { laneId: 'e-w-1', position: { x: width, y: centerY - laneWidth / 2 }, angle: Math.PI },
    ];

    return { lanes, lights, spawnPoints, bounds: { width, height } };
  }

  private static generate3Way(): ScenarioData {
    const data = this.generate4Way();
    // Remove East arm
    data.lanes = data.lanes.filter(l => !l.id.startsWith('e-') && !l.id.endsWith('-e-1'));
    data.lights = data.lights.filter(l => l.id !== 'l-e');
    data.spawnPoints = data.spawnPoints.filter(s => s.laneId !== 'e-w-1');
    return data;
  }

  private static generate5Way(): ScenarioData {
    const data = this.generate4Way();
    // Add a diagonal arm
    const centerX = 400;
    const centerY = 400;
    const angle = Math.PI / 4;
    const laneWidth = 50;
    
    data.lanes.push(
      { id: 'diag-in', start: { x: centerX + 300 * Math.cos(angle), y: centerY + 300 * Math.sin(angle) }, end: { x: centerX + 50 * Math.cos(angle), y: centerY + 50 * Math.sin(angle) }, direction: angle + Math.PI, nextLanes: ['n-s-2', 'w-e-2'] },
      { id: 'diag-out', start: { x: centerX + 50 * Math.cos(angle + 0.2), y: centerY + 50 * Math.sin(angle + 0.2) }, end: { x: centerX + 300 * Math.cos(angle + 0.2), y: centerY + 300 * Math.sin(angle + 0.2) }, direction: angle, nextLanes: [] }
    );
    
    // Adjust all lights for 3-phase cycle (39s total)
    const durations = { [LightState.RED]: 26, [LightState.YELLOW]: 3, [LightState.GREEN]: 10 };
    
    data.lights = [
      // Phase 1: North-South
      { id: 'l-n', position: { x: 350, y: 350 }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.GREEN, durations, controlledLaneIds: ['n-s-1'], angle: -Math.PI / 2 },
      { id: 'l-s', position: { x: 450, y: 450 }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.GREEN, durations, controlledLaneIds: ['s-n-1'], angle: Math.PI / 2 },
      
      // Phase 2: West-East
      { id: 'l-w', position: { x: 350, y: 450 }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.RED, initialTimer: 13, durations, controlledLaneIds: ['w-e-1'], angle: Math.PI },
      { id: 'l-e', position: { x: 450, y: 350 }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.RED, initialTimer: 13, durations, controlledLaneIds: ['e-w-1'], angle: 0 },
      
      // Phase 3: Diagonal
      { id: 'l-diag', position: { x: centerX + 60 * Math.cos(angle), y: centerY + 60 * Math.sin(angle) }, type: LightType.ALWAYS_COUNTDOWN, initialState: LightState.RED, initialTimer: 26, durations, controlledLaneIds: ['diag-in'], angle: angle }
    ];
    
    data.spawnPoints.push({
      laneId: 'diag-in',
      position: { x: centerX + 300 * Math.cos(angle), y: centerY + 300 * Math.sin(angle) },
      angle: angle + Math.PI
    });

    return data;
  }

  private static generateCityGrid(): ScenarioData {
    // A 2x2 grid of intersections
    const width = 1200;
    const height = 1200;
    const lanes: Lane[] = [];
    const lights: TrafficLightConfig[] = [];
    const spawnPoints: any[] = [];
    
    const gridPoints = [300, 900];
    const roadWidth = 80;
    const laneWidth = 40;

    gridPoints.forEach((gx, ix) => {
      gridPoints.forEach((gy, iy) => {
        // Create intersection at (gx, gy)
        // Horizontal lanes
        lanes.push(
          { id: `h-${ix}-${iy}-in`, start: { x: gx - 200, y: gy + laneWidth / 2 }, end: { x: gx - roadWidth / 2, y: gy + laneWidth / 2 }, direction: 0, nextLanes: [`h-${ix}-${iy}-out`] },
          { id: `h-${ix}-${iy}-out`, start: { x: gx + roadWidth / 2, y: gy + laneWidth / 2 }, end: { x: gx + 200, y: gy + laneWidth / 2 }, direction: 0, nextLanes: [] }
        );
        
        lights.push({
          id: `l-h-${ix}-${iy}`,
          position: { x: gx - roadWidth / 2, y: gy + roadWidth / 2 },
          type: LightType.NO_COUNTDOWN,
          initialState: (ix + iy) % 2 === 0 ? LightState.GREEN : LightState.RED,
          durations: { [LightState.RED]: 10, [LightState.YELLOW]: 2, [LightState.GREEN]: 8 },
          controlledLaneIds: [`h-${ix}-${iy}-in`],
          angle: Math.PI
        });

        spawnPoints.push({
          laneId: `h-${ix}-${iy}-in`,
          position: { x: gx - 200, y: gy + laneWidth / 2 },
          angle: 0
        });
      });
    });

    return { lanes, lights, spawnPoints, bounds: { width, height } };
  }
}

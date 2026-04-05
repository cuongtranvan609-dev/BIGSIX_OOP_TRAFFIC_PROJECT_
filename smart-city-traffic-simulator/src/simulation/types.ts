/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum VehicleType {
  CAR = 'Car',
  MOTORCYCLE = 'Motorcycle',
  BICYCLE = 'Bicycle',
  AMBULANCE = 'Ambulance',
  FIRE_TRUCK = 'Fire Truck',
  BUS = 'Bus'
}

export enum DriverStyle {
  NORMAL = 'Normal',
  AGGRESSIVE = 'Aggressive',
  EMERGENCY = 'Emergency'
}

export enum LightState {
  RED = 'Red',
  YELLOW = 'Yellow',
  GREEN = 'Green'
}

export enum LightType {
  ALWAYS_COUNTDOWN = 'Always Countdown',
  NO_COUNTDOWN = 'No Countdown',
  LAST_10S_COUNTDOWN = 'Last 10s Countdown'
}

export enum ScenarioType {
  JUNCTION_3 = '3-Way Junction',
  JUNCTION_4 = '4-Way Junction',
  JUNCTION_5 = '5-Way Junction',
  CITY_GRID = 'City Grid'
}

export interface Point {
  x: number;
  y: number;
}

export interface Lane {
  id: string;
  start: Point;
  end: Point;
  direction: number; // Angle in radians
  nextLanes: string[]; // IDs of lanes this lane connects to
}

export interface TrafficLightConfig {
  id: string;
  position: Point;
  type: LightType;
  initialState: LightState;
  initialTimer?: number;
  angle?: number;
  durations: {
    [LightState.RED]: number;
    [LightState.YELLOW]: number;
    [LightState.GREEN]: number;
  };
  controlledLaneIds: string[];
}

export interface SimulationState {
  vehicles: any[];
  lights: any[];
  lanes: Lane[];
  scenario: ScenarioType;
  density: number;
  isManual: boolean;
  isGraphical: boolean;
}

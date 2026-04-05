/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, LightState, LightType, TrafficLightConfig } from './types.ts';

export class TrafficLight {
  id: string;
  position: Point;
  type: LightType;
  state: LightState;
  timer: number;
  angle: number;
  durations: {
    [LightState.RED]: number;
    [LightState.YELLOW]: number;
    [LightState.GREEN]: number;
  };
  controlledLaneIds: string[];

  constructor(config: TrafficLightConfig) {
    this.id = config.id;
    this.position = config.position;
    this.type = config.type;
    this.state = config.initialState;
    this.durations = config.durations;
    this.controlledLaneIds = config.controlledLaneIds;
    this.timer = config.initialTimer !== undefined ? config.initialTimer : this.durations[this.state];
    this.angle = config.angle || 0;
  }

  update(dt: number, isManual: boolean) {
    if (isManual) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.nextState();
    }
  }

  nextState() {
    switch (this.state) {
      case LightState.RED:
        this.state = LightState.GREEN;
        break;
      case LightState.GREEN:
        this.state = LightState.YELLOW;
        break;
      case LightState.YELLOW:
        this.state = LightState.RED;
        break;
    }
    this.timer = this.durations[this.state];
  }

  toggleManual() {
    this.nextState();
  }

  getCountdownText(): string | null {
    const seconds = Math.ceil(this.timer);
    
    if (this.type === LightType.ALWAYS_COUNTDOWN) {
      return seconds.toString();
    }
    
    if (this.type === LightType.LAST_10S_COUNTDOWN && seconds <= 10) {
      return seconds.toString();
    }
    
    return null;
  }
}

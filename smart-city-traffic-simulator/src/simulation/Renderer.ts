/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle } from './Vehicle.ts';
import { TrafficLight } from './TrafficLight.ts';
import { Point, LightState, VehicleType } from './types.ts';

export interface Renderer {
  render(ctx: CanvasRenderingContext2D, vehicles: Vehicle[], lights: TrafficLight[], lanes: any[], scale: number): void;
}

export class BasicRenderer implements Renderer {
  render(ctx: CanvasRenderingContext2D, vehicles: Vehicle[], lights: TrafficLight[], lanes: any[], scale: number) {
    ctx.save();
    ctx.scale(scale, scale);

    // Draw lanes
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 100;
    lanes.forEach(lane => {
      ctx.beginPath();
      ctx.moveTo(lane.start.x, lane.start.y);
      ctx.lineTo(lane.end.x, lane.end.y);
      ctx.stroke();
    });

    // Draw vehicles as rectangles
    vehicles.forEach(v => {
      ctx.save();
      ctx.translate(v.position.x, v.position.y);
      ctx.rotate(v.angle);
      
      ctx.fillStyle = v.color;
      ctx.fillRect(-v.width / 2, -v.height / 2, v.width, v.height);
      
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v.type.substr(0, 4), 0, 5);
      
      ctx.restore();
    });

    // Draw lights
    lights.forEach(l => {
      ctx.save();
      ctx.translate(l.position.x, l.position.y);
      
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-10, -30, 20, 60);
      
      const colors = {
        [LightState.RED]: '#ef4444',
        [LightState.YELLOW]: '#f59e0b',
        [LightState.GREEN]: '#10b981'
      };
      
      ctx.fillStyle = l.state === LightState.RED ? colors[LightState.RED] : '#374151';
      ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = l.state === LightState.YELLOW ? colors[LightState.YELLOW] : '#374151';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = l.state === LightState.GREEN ? colors[LightState.GREEN] : '#374151';
      ctx.beginPath(); ctx.arc(0, 20, 8, 0, Math.PI * 2); ctx.fill();
      
      const countdown = l.getCountdownText();
      if (countdown) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(countdown, 0, 45);
      }
      
      ctx.restore();
    });

    ctx.restore();
  }
}

export class SpriteRenderer implements Renderer {
  render(ctx: CanvasRenderingContext2D, vehicles: Vehicle[], lights: TrafficLight[], lanes: any[], scale: number) {
    ctx.save();
    ctx.scale(scale, scale);

    // Draw roads with more detail
    lanes.forEach(lane => {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 100;
      ctx.beginPath();
      ctx.moveTo(lane.start.x, lane.start.y);
      ctx.lineTo(lane.end.x, lane.end.y);
      ctx.stroke();
      
      // Dashed lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(lane.start.x, lane.start.y);
      ctx.lineTo(lane.end.x, lane.end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw vehicles with "sprites" (simulated with paths)
    vehicles.forEach(v => {
      ctx.save();
      ctx.translate(v.position.x, v.position.y);
      ctx.rotate(v.angle);
      
      // Body
      ctx.fillStyle = v.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      
      if (v.type === VehicleType.CAR) {
        this.drawCar(ctx, v);
      } else if (v.type === VehicleType.AMBULANCE || v.type === VehicleType.FIRE_TRUCK) {
        this.drawEmergency(ctx, v);
      } else if (v.type === VehicleType.BUS) {
        this.drawBus(ctx, v);
      } else {
        ctx.fillRect(-v.width / 2, -v.height / 2, v.width, v.height);
      }
      
      ctx.restore();
    });

    // Draw lights (same as basic but more polished)
    lights.forEach(l => {
      this.drawLight(ctx, l);
    });

    ctx.restore();
  }

  private drawCar(ctx: CanvasRenderingContext2D, v: Vehicle) {
    ctx.beginPath();
    ctx.roundRect(-v.width / 2, -v.height / 2, v.width, v.height, 5);
    ctx.fill();
    
    // Windows
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(v.width * 0.1 - v.width / 2, -v.height * 0.4, v.width * 0.2, v.height * 0.8);
    
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(v.width / 2 - 5, -v.height / 2 + 2, 5, 4);
    ctx.fillRect(v.width / 2 - 5, v.height / 2 - 6, 5, 4);
  }

  private drawEmergency(ctx: CanvasRenderingContext2D, v: Vehicle) {
    ctx.beginPath();
    ctx.roundRect(-v.width / 2, -v.height / 2, v.width, v.height, 3);
    ctx.fill();
    
    // Flashing lights
    if (v.flashState) {
      ctx.fillStyle = v.type === VehicleType.AMBULANCE ? '#3b82f6' : '#ef4444';
      ctx.shadowBlur = 15;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v.type === VehicleType.AMBULANCE ? 'AMBU' : 'FIRE', 0, 5);
  }

  private drawBus(ctx: CanvasRenderingContext2D, v: Vehicle) {
    ctx.beginPath();
    ctx.roundRect(-v.width / 2, -v.height / 2, v.width, v.height, 2);
    ctx.fill();
    
    // Windows along the side
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-v.width / 2 + 10 + i * 14, -v.height / 2 + 5, 10, v.height - 10);
    }
  }

  private drawLight(ctx: CanvasRenderingContext2D, l: TrafficLight) {
    ctx.save();
    ctx.translate(l.position.x, l.position.y);
    
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-12, -32, 24, 64, 5);
    ctx.fill();
    
    const colors = {
      [LightState.RED]: '#ef4444',
      [LightState.YELLOW]: '#f59e0b',
      [LightState.GREEN]: '#10b981'
    };
    
    // Red
    ctx.fillStyle = l.state === LightState.RED ? colors[LightState.RED] : '#1f2937';
    if (l.state === LightState.RED) ctx.shadowBlur = 10; ctx.shadowColor = colors[LightState.RED];
    ctx.beginPath(); ctx.arc(0, -20, 9, 0, Math.PI * 2); ctx.fill();
    
    // Yellow
    ctx.shadowBlur = 0;
    ctx.fillStyle = l.state === LightState.YELLOW ? colors[LightState.YELLOW] : '#1f2937';
    if (l.state === LightState.YELLOW) ctx.shadowBlur = 10; ctx.shadowColor = colors[LightState.YELLOW];
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    
    // Green
    ctx.shadowBlur = 0;
    ctx.fillStyle = l.state === LightState.GREEN ? colors[LightState.GREEN] : '#1f2937';
    if (l.state === LightState.GREEN) ctx.shadowBlur = 10; ctx.shadowColor = colors[LightState.GREEN];
    ctx.beginPath(); ctx.arc(0, 20, 9, 0, Math.PI * 2); ctx.fill();
    
    ctx.shadowBlur = 0;
    const countdown = l.getCountdownText();
    if (countdown) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(countdown, 0, 50);
    }
    
    ctx.restore();
  }
}

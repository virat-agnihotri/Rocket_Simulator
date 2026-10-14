import { designColor } from '../designTokens';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Compass, Info } from 'lucide-react';
import type { TelemetryPoint } from '../types/simulation';

interface TrajectoryVisualizerProps {
  telemetry: TelemetryPoint[];
  targetAltitudeM: number;
}

export const TrajectoryVisualizer: React.FC<TrajectoryVisualizerProps> = ({
  telemetry,
  targetAltitudeM,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || telemetry.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + playbackSpeed;
        if (next >= telemetry.length - 1) {
          setIsPlaying(false);
          return telemetry.length - 1;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, telemetry.length, playbackSpeed]);

  const currentPoint = telemetry[currentIndex] || telemetry[0];

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || telemetry.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const EARTH_RADIUS = 6371000.0;
    // Maximum extent from center
    const maxR = Math.max(
      EARTH_RADIUS + targetAltitudeM * 1.3,
      ...telemetry.map((pt) => Math.hypot(pt.x_m, pt.y_m))
    );

    const centerX = width / 2;
    const centerY = height / 2;
    const baseScale = (Math.min(width, height) * 0.44) / maxR;
    const scale = baseScale * zoomLevel;

    // Helper to transform ECI meters (x, y) to canvas (cx, cy)
    // In our coordinate system, launch is at (x=R, y=0). We rotate 90 deg so launch is top for intuitive display
    const toCanvas = (x: number, y: number) => {
      // Rotate by -90 deg: canvasX = centerX + y * scale, canvasY = centerY - x * scale
      const cx = centerX + (y * scale);
      const cy = centerY - (x * scale);
      return { cx, cy };
    };

    // Draw deep space background gradient
    const bgGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, width / 2);
    bgGrad.addColorStop(0, designColor('background-secondary'));
    bgGrad.addColorStop(1, designColor('background'));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw coordinate grid rings
    ctx.strokeStyle = designColor('border');
    ctx.lineWidth = 1;
    [EARTH_RADIUS, EARTH_RADIUS + 100000, EARTH_RADIUS + targetAltitudeM].forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * scale, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw Target Orbit Ring
    ctx.strokeStyle = designColor('border');
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, (EARTH_RADIUS + targetAltitudeM) * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Atmosphere boundary (100 km Karman line)
    ctx.strokeStyle = designColor('text-secondary');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (EARTH_RADIUS + 100000) * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Earth globe
    const earthRadiusPx = EARTH_RADIUS * scale;
    const earthGrad = ctx.createRadialGradient(
      centerX - earthRadiusPx * 0.2,
      centerY - earthRadiusPx * 0.2,
      earthRadiusPx * 0.1,
      centerX,
      centerY,
      earthRadiusPx
    );
    earthGrad.addColorStop(0, '#1e3a8a');
    earthGrad.addColorStop(0.7, '#0f172a');
    earthGrad.addColorStop(1, '#020617');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadiusPx, 0, 2 * Math.PI);
    ctx.fill();

    // Atmosphere glow edge
    ctx.strokeStyle = designColor('text-secondary');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadiusPx, 0, 2 * Math.PI);
    ctx.stroke();

    // Full solver trajectory remains distinct from the traversed path.
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = designColor('gold');
    ctx.lineWidth = 2;
    ctx.beginPath();
    const start = toCanvas(telemetry[0].x_m, telemetry[0].y_m);
    ctx.moveTo(start.cx, start.cy);
    for (let i = 1; i < telemetry.length; i++) {
      const pt = toCanvas(telemetry[i].x_m, telemetry[i].y_m);
      ctx.lineTo(pt.cx, pt.cy);
    }
    ctx.stroke();

    ctx.setLineDash([]);

    // Highlight traversed trajectory up to current point
    if (currentIndex > 0) {
      ctx.strokeStyle = designColor('telemetry');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(start.cx, start.cy);
      for (let i = 1; i <= currentIndex; i++) {
        const pt = toCanvas(telemetry[i].x_m, telemetry[i].y_m);
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();
    }

    // Draw current rocket position marker
    if (currentPoint) {
      const { cx, cy } = toCanvas(currentPoint.x_m, currentPoint.y_m);

      // Rocket glow
      ctx.fillStyle = currentPoint.is_engine_active ? designColor('ember') : designColor('telemetry');
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Rocket marker dot
      ctx.fillStyle = currentPoint.is_engine_active ? designColor('ember') : designColor('telemetry');
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Exhaust plume if burning
      if (currentPoint.is_engine_active) {
        ctx.strokeStyle = designColor('ember');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        // Thrust direction trail
        ctx.lineTo(cx - 8, cy + 6);
        ctx.stroke();
      }
    }
  }, [telemetry, targetAltitudeM, currentIndex, zoomLevel]);

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="h-[420px] rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
        No telemetry loaded. Run a flight simulation to view trajectory.
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
      {/* HUD Overlay Info Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-mono pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">T+:</span>
          <span className="font-bold text-slate-100">{currentPoint?.time_s.toFixed(1)} s</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ALT:</span>
          <span className="font-bold text-sky-300">{(currentPoint?.altitude_m / 1000).toFixed(1)} km</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SPD:</span>
          <span className="font-bold text-emerald-300">{currentPoint?.speed_mps.toFixed(0)} m/s</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">MASS:</span>
          <span className="font-bold text-amber-300">{(currentPoint?.mass_kg / 1000).toFixed(1)} t</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/60 pointer-events-auto">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trajectory Canvas */}
      <canvas
        ref={canvasRef}
        width={760}
        height={480}
        className="w-full h-[460px] block cursor-crosshair"
      />

      {/* Legend & Physical Notice */}
      <div className="absolute bottom-16 left-3 z-10 flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Earth Globe
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Ascent Trajectory
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 border-t border-sky-400 border-dashed inline-block" /> Target Orbit
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <Info className="w-3 h-3 text-sky-400" /> Planar ECI Projection
        </span>
      </div>

      {/* Mission Playback Controls */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentIndex(0);
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Restart Mission"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Timeline Range Slider */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 w-12">0 s</span>
          <input
            type="range"
            min={0}
            max={telemetry.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value));
            }}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[11px] font-mono text-slate-400 w-14 text-right">
            {telemetry[telemetry.length - 1]?.time_s.toFixed(0)} s
          </span>
        </div>

        {/* Speed multiplier selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-0.5 rounded ${
                playbackSpeed === s ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

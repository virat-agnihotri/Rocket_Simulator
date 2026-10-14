# Live Mission Control — frontend prototype

Navigate to **/live** from the new **Live Launch** navigation item. The original Dashboard, Configuration, Simulation, Optimization, Comparison, Saved Missions and Documentation routes are preserved.

## Interactions

1. Select Nominal, High wind, or Engine fault.
2. Adjust horizontal wind (m/s), engine-failure trigger time and thrust-loss percentage as applicable.
3. Click **Initiate Launch**.
4. Watch the rocket animation and synchronized altitude, vertical speed, propellant remaining, dynamic pressure, graphs and event log.
5. Use Pause / Resume, Reset, playback-speed selector or timeline scrubbing. **New Launch** applies updated scenario settings.

## Physics disclaimer

The Live Launch screen currently uses **simplified in-browser point-mass vertical dynamics** at 0.2-second integration steps for a deterministic interactive demo, with approximate lateral wind drift. It does **not** use the backend FastAPI RK45/2D/orbital science engine; wind effects, thrust-loss effects, and impact times are illustrative and **not flight-certified**. A positive horizontal wind is treated as a lateral aerodynamic force only. 3D aerodynamics, structural loads and attitude control are not represented. The model terminates at ground impact, a 300-km height cap, or 500 seconds, whichever is first.

## Build

Requires Node.js and the dependencies in `frontend/package.json`. In the `frontend` directory run `npm ci`, then `npm run build` and `npm run dev`.

**Environment limitation during preparation:** `npm ci` did not complete in this sandbox and the bundled node_modules lacked several declared dependencies (React Router, lucide-react, Recharts). Therefore the production build could not be fully verified here. The initial TypeScript check identified two unused declarations in the new file; these were removed. Run `npm ci && npm run build` on a network-connected machine to verify.

## Next implementation phase

Integrate the live UI with a backend incremental simulation session that accepts events, maintains one authoritative simulation clock, and streams physics-derived telemetry. In particular, migrate engine failure and atmospheric disturbances into the scientific solver and add validated 3D wind dynamics if needed.

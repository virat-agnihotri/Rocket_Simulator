# Space mission experience

The home page (`/`, also `/mission-3d`) provides an illustrative Three.js introduction, scientific simulation playback, and a rocket experiment form. The previous dashboard is at `/dashboard`; configuration, saved missions, optimization, comparison, and scientific result pages remain available. `/live` is explicitly an illustrative demo and never supplies results to this experience.

## Start on Windows

Open `F:\telementry_project\rocket-mission-platform` in VS Code. Select **Rocket Backend (FastAPI)** and press F5. Its `.vscode/launch.json` explicitly uses `${workspaceFolder}/.venv/Scripts/python.exe`, `module: uvicorn`, `app.main:app`, and `${workspaceFolder}/backend` as the working directory. Opening the parent `F:\telementry_project` also works through its existing corresponding launch configuration.

Equivalent PowerShell commands, in separate terminals:

```powershell
Set-Location F:\telementry_project\rocket-mission-platform\backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
Set-Location F:\telementry_project\rocket-mission-platform\frontend
npm run dev
```

Visit http://127.0.0.1:5173. Vite proxies `/api` and `/health` to port 8000. Production hosting needs the equivalent proxy or a `VITE_API_BASE_URL` set at build time plus matching backend CORS configuration. Run `npm run build` for the frontend distribution.

Select **Begin Analysis**, edit the rocket parameters below the views, and run the scientific simulation. A completed result starts paused at time zero. Launch/Play, Pause, Reset, speed, and seeking control both views through one `usePlayback` clock. Each comparison row replays that exact result, even if the current form has changed. Table metrics are peak altitude, speed, acceleration and dynamic pressure, final remaining propellant, and solver orbital classification/target outcome. Comparison history is page-session only; persistent mission management remains under Saved Missions. A failed API request retains the last successful playback and exposes an error for retry.

## Coordinate conversion and physics limits

Backend position is planar Earth-centered inertial `(x_m, y_m)`, initially near `(R + launch_altitude, 0)`, where `R = 6,371,000 m`. Launch-view coordinates are `(y_m, x_m - R, 0)` in meters; velocity is `(vy_mps, vx_mps, 0)`. This is an axis swap and constant translation, not a flat-Earth trajectory approximation. For Earth overview coordinates, add R back and scale: `(y_m/1e6, x_m/1e6, 0)`. Earth radius is 6.371 scene units. The conversion preserves geocentric distance and embeds the whole trajectory in the XY plane without inventing an out-of-plane component. Rocket orientation is `rotation.z = -(pitch_rad + atan2(y_m,x_m))`, consistent with radial/tangential guidance.

The Earth texture orientation and red launch reference are illustrative. This view does not georeference a launch site, infer ground track on a rotating Earth, or model arbitrary inclination. Existing launch latitude settings do not turn the planar solver into geographic 3D physics. Earth rotates only in the decorative introduction; the analysis globe stays in the inertial display frame. The solver remains single stage: no fabricated booster separation. Rocket size and exhaust are visual cues, not geometry, plume physics, or measured imagery. The amber Earth marker is enlarged for visibility.

## Assets and accessibility

All runtime assets are local: NASA Earth JPEG, NASA launcher GLB, and bundled Draco decoder. Credits and license notices remain in `THIRD_PARTY_NOTICES.md` and `licenses/`. The reference Earth tutorial and three-globe repositories informed scene organization; their code/maps were not copied. Their texture terms are separate from code licenses, so the existing NASA map was retained.

Reduced-motion preference stops the decorative Earth/satellite/rocket animation and disables smooth scrolling, camera smoothing, and exhaust flicker. Scientific playback is paused until explicitly requested. Panels stack on narrow screens, controls wrap, navigation stays available, and comparison tables scroll horizontally. Texture/model loading uses suspense; failed assets fall back to simple geometry. WebGL failures show a textual fallback while result charts and controls remain available. Optional detailed Saturn V assets are retained but scientific playback uses a schematic single-stage vehicle.

Remaining limits: three WebGL canvases can be expensive on low-end hardware; the 3D bundle triggers Vite's size advisory. No real-time data feed is connected. Run comparison is not retained across navigation/reload. Browser hardware and OS reduced-motion settings still need testing on deployment targets.

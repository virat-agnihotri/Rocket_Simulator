# Rocket Mission Platform implementation

The application was copied from the downloaded Rocket_Mission_Live_Control_Prototype into this isolated folder. Original sources in ../assets remain untouched.

## Start

Frontend: in frontend, run `npm ci`, then `npm run dev`. Open http://localhost:5173/mission-3d.

Backend: install backend/requirements.txt in a project virtual environment, then from backend run `uvicorn app.main:app --reload`. Vite proxies /api and /health to port 8000.

An isolated `.venv` has been prepared in this folder. From backend, use `..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload` on Windows. The installed dependency snapshot is recorded in backend/requirements.lock.txt.

The 3D mock view works without the backend. Existing simulation, optimization, saved-mission, comparison, documentation, and 2D live routes remain. Run a scientific simulation and select Latest simulation in the 3D view to replay its telemetry.

## Design

features/mission-view contains telemetry fixtures/adapters, authoritative playback time, scene components, camera tracking, trajectories, charts, and event state. The clock is updated with requestAnimationFrame; HUD/chart renders are throttled. Scene sampling uses the same clock. Stage state is derived from time, making backward seeks reversible.

Positions are meters in the launch view. The Earth overview uses million-meter units; the two views share one telemetry source. Backend planar ECI telemetry is embedded in 3D without adding out-of-plane motion or stage physics.

NASA launcher and Saturn V GLBs are served locally. Draco decoding is local. Saturn V is explicitly a preview of another vehicle. The SLS-inspired schematic uses separate core, booster, upper-stage, and engine meshes, with illustrative separation. It is not the detailed downloaded SLS.

## Outstanding asset work

- Open the original SLS Max scene in compatible authoring software; verify hierarchy, pivot locations, units, and materials; export a new GLB into this project. Do not overwrite originals.
- Verify separate boosters, stage assemblies, and engine meshes before enabling detailed-model separation. Do not merge those meshes during optimization.
- The launcher is one merged mesh: service-arm animation needs additional authoring.
- NASA Earth (A) is included as a JPEG derivative of the original 1440×720 TIFF. Earth (B) is square and unsuitable for the current equirectangular globe. Other downloaded tutorial maps remain excluded pending provenance review. Globe geographic alignment is illustrative.
- Model heights are normalized for illustrative presentation, not engineering dimensions.
- Full SLS physics, per-engine failures, live streaming, and 3D attitude dynamics require backend contract/solver work. The original science solver is single-stage and planar.

## Verification

Frontend: `npm run build`; `npm run lint`; `node --test tests/mission.test.ts`.

Backend: from backend, `python -m pytest tests`. Do not start production services against copied SQLite files until their intended data source is confirmed.

See THIRD_PARTY_NOTICES.md and frontend/src/assets/manifest.ts for asset provenance.

Two inherited Python issues were fixed only in the working copy: guidance.py referenced a return annotation defined later in the module, so annotations are now deferred. The ground-support calculation also cancelled centripetal acceleration for a vehicle corotating with Earth, causing artificial lift and excessive solver steps in the low-thrust test. Ground support now retains the centripetal acceleration with a small contact tolerance; a regression test verifies zero radius acceleration.


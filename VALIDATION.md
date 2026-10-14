# Validation — 2026-10-13

- Production frontend build: passed. The 3D route is lazy-loaded separately from existing pages. Vite still reports large bundle warnings for chart and 3D libraries.
- Frontend lint: no errors. Three inherited warnings remain in SavedMissionsPage, LiveMissionPage, and TrajectoryVisualizer; those source files were preserved.
- Telemetry/playback tests: 4 passed. Covers irregular sample interpolation, endpoint clamping, engine shutdown boundaries, backward stage seeking, and backend coordinate mapping.
- Backend tests: 35 passed in 36.66 seconds, including the new pad-contact regression. One installed FastAPI/Starlette test-client deprecation warning remains.
- Browser verification: both canvases render, NASA launcher loads using the local Draco decoder, Saturn V preview loads, NASA Earth texture displays, timeline seeking crosses booster separation, and backward seeking restores attachment state. No application console errors were observed during these checks.
- End-to-end production workflow: configured and ran a scientific simulation through the preserved UI, received 451 telemetry samples, then selected Latest simulation in the 3D view. The view switched to backend telemetry, reported the solver's initial 465 m/s speed, and disabled mock stage separation. The navigation reports FASTAPI READY.
- Selected preserved files were compared byte-for-byte with the original prototype: LiveMissionPage, API service, simulation types, backend entry point, integrator, and optimizer match. All edits and derived assets are confined to this working project.

## Material limitations

The detailed SLS Max/DWF model is not converted and its hierarchy remains unverified. The current separable rocket is a schematic. Saturn V is a labeled preview of a different vehicle. Staging is a deterministic visual mock; the backend remains a planar single-stage solver. Earth geographic alignment and model sizing are illustrative. Further subdivision of the already lazy-loaded bundles is a performance improvement for a later iteration.

## Space experience verification (2026-10-13)

- Project `.venv` Python 3.12.14: all 35 backend pytest tests passed, including API, optimization, orbital, pad contact and simulation tests. One upstream Starlette/httpx deprecation warning.
- Frontend telemetry tests: 5 passed, including irregular-time interpolation, engine/stage seeking, and off-axis coordinate embedding/radius preservation.
- TypeScript and Vite production build passed. Vite warns about bundles over 500 kB.
- Frontend lint completed without errors; remaining warnings concern existing SavedMissionsPage, LiveMissionPage and TrajectoryVisualizer code.
- Browser checks: introduction renders; Begin Analysis scrolls to analysis; a scientific API run returns telemetry and comparison metrics; both scenes render with local Earth texture and rocket exhaust; Launch/Play and Pause update and stop the shared clock. Narrow-screen layout checked at 390 x 844; controls and experiment fields reflow. Reduced-motion behavior is implemented using matchMedia but OS-setting and low-end GPU validation remain deployment checks.
- Both parent-workspace and project-workspace VS Code launch files point to the project `.venv`, module uvicorn, app.main:app, and backend working directory. The same interpreter/module command successfully started the backend and served health/API requests.

See `docs/space-experience.md` for startup and limitations.

> Superseded permission assessment: the subsequent embedded-metadata audit verified the Starship full-stack CC BY 4.0 license and imported it. See model-permissions.md and THIRD_PARTY_NOTICES.md for the current decisions. The original implementation record below is retained as history.

# Rocket Hangar integration report — 2026-10-14

## Outcome
The existing platform was extended in place. All 14 original registry vehicles, their identifiers, and model files are preserved. The hangar upgrade is implemented and validated. No new Starship model has been copied into public assets or registered: both supplied repositories and both local ZIP archives contain no license granting model reuse. The older repository explicitly describes model credits as pending. The requested import remains incomplete until model reuse rights are established.

## Architecture and preservation
React 19, TypeScript, Vite, Three.js, React Three Fiber and Drei comprise the frontend. FastAPI supplies the scientific backend. `rocketRegistry.ts` already centralized 14 vehicles. `RocketAsset.tsx` loads cached GLB (with local Draco decoders) and STL resources, clones scenes, normalizes their longest axis upward, preserves materials, and grounds their base using bounding boxes. `MissionView` already passes the selected registry ID to the launch scene and flight instrument. `MissionScene` animates that vehicle from scientific telemetry. Playback, seeking, engine effects, Earth tracking, illustrative staging and backend equations were preserved.

Preserved vehicles:
- Saturn V (`saturn-v`)
- Ares I Variant A (`ares-a`)
- Ares I Variant B (`ares-b`)
- Mercury Atlas Friendship 7 (`atlas-6`)
- Mercury Atlas Aurora 7 (`atlas-7`)
- Mercury Atlas Faith 7 (`atlas-9`)
- Mercury Redstone Freedom 7 (`redstone`)
- Explorer Jupiter-C (`jupiter-c`)
- SLS Block 1 (`sls-block-1`): original STL and flight derivative both retained
- Space Shuttle Variant A (`shuttle-a`)
- Space Shuttle Variant B (`shuttle-b`)
- Space Shuttle Variant C (`shuttle-c`)
- Space Shuttle Variant D (`shuttle-d`)
- Shuttle Solid Rocket Booster (`solid-booster`)

## New-resource inventory and import status
Confirmed resource directory: `F:/telementry_project/assets`. Source ZIPs remain intact. Exact archive entries, sizes, scene node names, extension requirements, image dependencies and classifications are recorded in `starship-resource-inventory.json`. The older recursive NASA/reference inventory remains in `asset-inventory.json`.

| Source archive / entry | Classification | Format / structure | Final asset path | Status |
| --- | --- | --- | --- | --- |
| `starship-sim-main.zip` / `starship-sim-main/public/models/starship-full.glb` | Complete Starship / Super Heavy stack | GLB 2; 291 meshes, 330 nodes; five embedded WebP images; Draco compression; no animation clips | None | Pending asset license / creator attribution |
| `starship-sim-main.zip` / `starship-sim-main/public/models/mechazilla.glb` | Launch tower | GLB 2; 18 meshes / nodes; Draco; no images or clips | None | Pending license; not a selectable rocket |
| `Starship-Simulator-main.zip` / `Starship-Simulator-main/ship2.glb` | Individual upper stage | GLB 2; two meshes / nodes; no images or clips | None | Pending license; not a complete stack |
| `Starship-Simulator-main.zip` / `Starship-Simulator-main/booster2.glb` | Individual booster | GLB 2; ten meshes, 13 nodes; no images or clips | None | Pending license; not a complete stack |
| `Starship-Simulator-main.zip` / `Starship-Simulator-main/launchtower.glb` | Launch tower | GLB 2; one mesh / node; one animation clip | None | Pending license; not a selectable rocket |

All five GLBs have valid magic/version/declared-length headers and embedded resources; none has external file URIs. Header and hierarchy inspection is not a claim that their complete geometry, visual orientation or animation clips were verified in a renderer. No conversion or replacement downloads were performed. The complete stack exposes named ship, booster, flap, grid-fin and engine groups; actual separation mapping is unverified and the scientific backend supplies no staging timeline. The downloaded simulators contain viewer implementations, but their physics and UI were not copied.

Licensing sources checked:
- https://github.com/astrogeekdk/Starship-Simulator (no LICENSE; README says model credits pending)
- https://github.com/4M4Z3/starship-sim (no LICENSE or model attribution found)
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

Public GitHub availability alone does not establish a reuse license. This hold follows the user's requirement to integrate only appropriately licensed assets; it does not assert that reuse permission cannot subsequently be obtained.

## Files changed and features
- `frontend/src/assets/rocketRegistry.ts`: preserved all entries and IDs; added manufacturer/source credit, local thumbnail, license reference, explicit null physics preset, presentation height, scale correction, vertical offset, camera FOV and documented axis-normalization mode. Existing orientation and flip metadata preserved. Values represent presentation settings, not measured physical dimensions.
- `frontend/public/models/<existing-id>/preview.png`: 14 preview images copied from their existing NASA source folders. Originals retained. No new rocket geometry was added.
- `frontend/src/features/mission-view/components/RocketSelector.tsx`: replaced the many simultaneous card canvases with lazy static thumbnails and one demand-rendered selected preview. Added search, category filtering, empty-state text, candidate/confirmed selection, metadata, Visual Model Only labels, load progress, error state, camera reset, orbit rotation/zoom, reduced rendering resolution and a configuration link. Drei Bounds fits the actual selected geometry to the preview camera. Each switch/reset replaces the preview scene; GLTF and STL loaders retain their existing asset cache.
- `frontend/src/features/mission-view/components/mission.css`: responsive hangar gallery and preview styling using existing design tokens; restrained entry fade with reduced-motion handling.
- `frontend/src/features/mission-view/components/Experiment.tsx`: added a navigation anchor to the existing vehicle-input workflow.
- `frontend/src/features/mission-view/scene/RocketAsset.tsx`: applies registry presentation height, scale correction and vertical offset consistently in preview and flight; preserves the established per-model bounding-box scale and flip behavior.
- `frontend/tests/assets.test.mjs`: focused preservation, thumbnail-existence and visual-only metadata assertions.
- `.gitignore`: allows the central registry and preview images to be reviewed while keeping heavy models and other source asset files excluded.
- `docs/starship-resource-inventory.json`: detailed new archive inventory.
- `docs/rocket-hangar-integration.md`: this report.

Confirmed selection updates existing launch/ascent rendering, flight instrument and telemetry playback. No backend schema or vehicle parameters are inferred from appearance. Previewing alone does not change the confirmed flight model.

## Validation commands and results
Commands run from `frontend`:
1. `npm run build` — PASS, run three times after implementation changes. Existing Vite large-chunk warning remains.
2. `npm run lint` — PASS, run twice. Three existing warnings remain in `LiveMissionPage.tsx`, `SavedMissionsPage.tsx` and `TrajectoryVisualizer.tsx`; no new lint errors.
3. `node --experimental-strip-types --test tests/coordinates.test.ts tests/mission.test.ts tests/assets.test.mjs` — PASS, initially seven tests; final eight tests after the added preservation test. Tests verify all existing embedded assets and Draco decode, original SLS retention, coordinate mapping, playback/seeking, engine state, and no fabricated backend stages.

Command run from `backend`:
4. `../.venv/Scripts/python.exe -m pytest` — PASS, 35 tests, one existing Starlette/httpx deprecation warning. Duration 439.79 seconds. Covers API, solver, optimization, atmosphere, pad contact, propulsion, gravity and orbital calculations.

Browser checks on `http://127.0.0.1:5173/`:
- All 14 original gallery entries present in page state.
- Search for SLS isolates SLS; no-match search shows useful empty-state text.
- Crew-launch category displays the two Ares variants.
- SLS selection confirmation updates the flight instrument and selected-model note.
- Actual screenshots inspected: SLS rendered upright, centered and grounded in the hangar, with original untextured STL appearance. Drag changed the preview camera view. Reset reloaded the selected preview. SLS also appeared in the existing launch scene, with the existing Earth scene intact.
- Initial browser accessibility state reported WebGL fallback; later screenshots confirmed actual 3D rendering. The fallback keeps metadata selection available.
- No scientific mission was submitted through the browser during this change; the backend suite independently exercises scientific simulation and exports.

## Remaining limitations
- New Starship import is pending actual model license or rights-holder permission. No new model is claimed integrated.
- No verified vehicle-specific physics presets were provided. Existing configuration inputs remain the explicit workflow.
- No verified structural stage mapping or scientific stage timeline exists; none was fabricated.
- Original model orientations remain as previously normalized; new Starship bounding-box transforms cannot be claimed verified until import is cleared and rendered.
- Browser inspection was desktop-only and sampled SLS, rather than re-rendering all 14 models at all viewport sizes. Missing-file error handling and scroll zoom are implemented but were not deliberately fault-injected or separately measured in the browser. Scientific countdown/flight replay was not exercised with the blocked new models.
- Registry model geometry remains intentionally ignored by Git under the existing asset policy. Source resources must accompany the project when transferred.

Browser screenshot saved: docs/visual-verification/rocket-hangar.jpg (SLS preview, filtered gallery, confirmed selection).

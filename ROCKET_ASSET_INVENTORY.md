# Rocket 3D Asset Inventory & Licensing Audit

**Audit Date:** October 14, 2026  
**Auditor:** Three.js Developer, Senior Aerospace Simulation Engineer, Software QA Engineer  
**Codebase:** `f:\telementry_project\rocket-mission-platform`  
**Asset Registry File:** [`frontend/src/assets/rocketRegistry.ts`](file:///f:/telementry_project/rocket-mission-platform/frontend/src/assets/rocketRegistry.ts)  
**Notices File:** [`THIRD_PARTY_NOTICES.md`](file:///f:/telementry_project/rocket-mission-platform/THIRD_PARTY_NOTICES.md)

---

## 1. Executive Summary

A comprehensive inventory and intellectual property audit of all 3D digital assets was completed across `f:\telementry_project\assets`, `f:\telementry_project\downloads`, and `frontend/public/models/`.

### Summary Statistics
- **Total Rocket-Related Asset Files Audited:** 55 files discovered.
- **Active Production Vehicles Integrated:** 15 launch vehicles registered in `rocketRegistry.ts`.
- **Integrated Asset Formats:** 13 Binary glTF (`.glb`), 2 Stereolithography (`.stl`).
- **Licensing Compliance:** 
  - 14 models: **NASA Media Usage Guidelines** (Attribution required, no endorsement).
  - 1 model: **Creative Commons Attribution 4.0 International (CC-BY-4.0)** (`starship-s24-b7` by clarence365).
  - 6 raw files: **Excluded from runtime distribution** (`booster2.glb`, `ship2.glb`, `launchtower.glb`, `mechazilla.glb`, and raw SLS `.max`/`.dwf` files) due to unverified provenance.

---

## 2. Active Integrated Rocket Fleet (15 Vehicles)

The following 15 vehicles are actively integrated into the 3D Hangar, vehicle selector, and flight visualization scene. Each model has been normalized to stand vertically along $+Y$ with its nozzle at $-Y$ and origin at base contact.

| ID | Vehicle Name | Format | Asset Size | Local Up-Axis | Presentation Height | Provenance & Creator | License | Status |
|:---|:---|:---:|:---:|:---:|:---:|:---|:---:|:---:|
| `saturn-v` | Saturn V | GLB | 927 kB | $+Z \to +Y$ | $60.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `ares-a` | Ares I (Variant A) | GLB | 98 kB | $+Z \to +Y$ | $60.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `ares-b` | Ares I (Variant B) | GLB | 99 kB | $+Z \to +Y$ | $60.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `atlas-6` | Atlas V 401 (Friendship 7) | GLB | 1,027 kB | $+Z \to +Y$ | $58.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `atlas-7` | Atlas V 501 (Aurora 7) | GLB | 1,027 kB | $+Z \to +Y$ | $58.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `atlas-9` | Atlas V 551 (Faith 7) | GLB | 1,026 kB | $+Z \to +Y$ | $58.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `redstone` | Mercury-Redstone (Freedom 7) | GLB | 1,028 kB | $+Z \to +Y$ | $25.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `jupiter-c` | Explorer Jupiter-C | GLB | 149 kB | $+Z \to +Y$ | $21.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `sls-block-1` | Space Launch System (Block 1) | STL | 13,683 kB | Custom $R_x(-90^\circ)$ | $65.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `shuttle-a` | Space Shuttle Stack (A) | GLB | 1,194 kB | $+Z \to +Y$, Inverted | $56.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `shuttle-b` | Space Shuttle Stack (B) | GLB | 11 kB | $+Z \to +Y$, Inverted | $56.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `shuttle-c` | Space Shuttle Orbiter (Discovery) | GLB | 26 kB | $+Z \to +Y$ | $37.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `shuttle-d` | Space Shuttle Stack (D) | GLB | 2,472 kB | $+Z \to +Y$ | $56.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `solid-booster` | Space Shuttle Solid Rocket Booster | GLB | 2,665 kB | $+Z \to +Y$ | $45.0\text{ m}$ | NASA 3D Resources | NASA Media Guidelines | **Active** |
| `starship-s24-b7` | SpaceX Starship S24 & Booster 7 | GLB | 3,810 kB | $+Y$ (Standard) | $120.0\text{ m}$ | clarence365 | CC-BY-4.0 | **Active** |

---

## 3. Detailed Model Metadata & Asset Pipeline Integration

### 3.1 Starship S24 & Booster 7 (`starship-s24-b7`)
- **File Location:** `/models/rockets/starship-s24-b7/rocket.glb` ($3.81\text{ MB}$).
- **Thumbnail:** `/models/rockets/starship-s24-b7/preview.jpg` ($12.1\text{ kB}$).
- **Attribution Document:** [`frontend/public/models/rockets/starship-s24-b7/ATTRIBUTION.md`](file:///f:/telementry_project/rocket-mission-platform/frontend/public/models/rockets/starship-s24-b7/ATTRIBUTION.md).
- **Embedded glTF Metadata (`asset.extras`):**
  - Title: `Spacex Starship Ship 24 & Booster 7 V4`
  - Author: `clarence365` (Sketchfab UID `97875d14b63e4b9ca9ed425ef4253306`)
  - License: `CC-BY-4.0`
- **Asset Geometry:** Pre-quantized and compressed with Draco extension via `glTF-Transform v4.3.0`.
- **Runtime Handling:** Decoded dynamically using the locally hosted Draco web-assembly decoder in `/decoders/draco/`.

### 3.2 Space Launch System Block 1 (`sls-block-1`)
- **File Location:** `/models/sls-block-1/sls-block-1-flight.stl` ($13.68\text{ MB}$).
- **Original Printing Mesh:** `/models/sls-block-1/sls-block-1.stl` ($13.72\text{ MB}$) preserved for reference.
- **Orientation Behavior:** Requires an explicit rotation matrix $R_x = -\pi/2$ radians ($-90^\circ$). Handled via `orientation: [-1.57079632679, 0, 0]` in `rocketRegistry.ts` and passed through [`RocketAsset.tsx`](file:///f:/telementry_project/rocket-mission-platform/frontend/src/features/mission-view/scene/RocketAsset.tsx).
- **Material:** Dynamically shaded at runtime using Three.js `MeshStandardMaterial` (`roughness: 0.65`, `color: #F1EDE5`).

### 3.3 Saturn V (`saturn-v`)
- **File Location:** `/models/saturn-v/saturn-v.glb` ($927\text{ kB}$).
- **Thumbnail:** `/models/saturn-v/preview.png` ($289\text{ kB}$).
- **Axis Correction:** NASA GLB convention oriented with the long axis along $+Z$. The `normalize` algorithm automatically detects $Z > Y$ and rotates $R_x = -\pi/2$, correctly orienting the Apollo spacecraft upward along $+Y$.

### 3.4 Launch Pad Complex (`launchpad`)
- **File Location:** `/models/launchpad/launcher.glb` ($198\text{ kB}$).
- **Role:** Static launch pad and mobile launcher platform positioned at $(0, 0, 0)$ in `LaunchView`.

---

## 4. Licensing Audit & Intellectual Property Compliance

### 4.1 NASA 3D Resources (14 Vehicles + Launch Pad)
- **Source:** [NASA 3D Resources Repository](https://github.com/nasa/NASA-3D-Resources)
- **Terms:** [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- **Permitted Uses:** Non-commercial educational, informational, and simulation purposes.
- **Conditions:**
  1. Full acknowledgment of NASA as the original source.
  2. The NASA insignia and logo must not be used to endorse commercial products.
  3. No individual creator names were attached to the source GLBs; attribution is assigned to "NASA 3D Resources".

### 4.2 Creative Commons CC-BY-4.0 (1 Vehicle)
- **Model:** `Spacex Starship Ship 24 & Booster 7 V4`
- **Creator:** `clarence365`
- **License Code:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/legalcode.en)
- **Compliance Actions Taken:**
  1. Creator name and model title prominently displayed in the 3D Vehicle Hangar modal.
  2. Direct hyperlink to the original Sketchfab model listing.
  3. Clear statement of CC-BY-4.0 terms.
  4. Disclosure of modifications (glTF-Transform compression, runtime orientation, and preview render).
  5. License document distributed alongside the binary asset in `ATTRIBUTION.md`.

### 4.3 Excluded Candidate Models (Segregated on Disk)
To maintain strict intellectual property integrity, the following downloaded files have been reviewed and explicitly excluded from the served application:

| Filename / Archive | Origin | Reason for Exclusion |
|:---|:---|:---|
| `booster2.glb` | `Starship-Simulator-main.zip` | No creator metadata or license file provided in source repository. |
| `ship2.glb` | `Starship-Simulator-main.zip` | Unverified 3D art provenance; software MIT license does not extend to art. |
| `launchtower.glb` | `Starship-Simulator-main.zip` | Lacks model-specific copyright release. |
| `mechazilla.glb` | `starship-sim-main.zip` | Attribution and author identity cannot be established. |
| `Block 1 (GNC markings scanline).max` | SLS 3ds Max Archive | Proprietary Autodesk format; unverified raw scanline source terms. |
| `Block 1 (GNC markings scanline).dwf` | SLS DWF Archive | Non-web vector CAD format with proprietary shader bindings. |

All excluded files remain safely retained in the local `assets/` and `downloads/` directories for archival purposes without being served to end users.

---

## 5. Asset Pipeline Optimization Recommendations

1. **Convert STL to GLB/Draco:**
   - The current `sls-block-1-flight.stl` is $13.68\text{ MB}$. Converting this single mesh to a Draco-compressed binary GLB (`.glb`) will reduce file size to approximately $\sim 600\text{ kB}$ (a $95\%$ bandwidth reduction) and improve mobile GPU memory footprint.
2. **Standardize Axis Conventions at Build Time:**
   - Pre-baking orientation transforms ($Z$-up to $Y$-up) with `gltf-transform` during an automated asset build step will eliminate runtime matrix inversions and bounding-box queries during initial component mount.
3. **Texture Map Compression with KTX2 / Basis Universal:**
   - High-resolution textures (e.g., Earth land/ocean specular maps) should be transcoded to `.ktx2` using Basis Universal compression, enabling direct GPU hardware decompression without CPU inflation.

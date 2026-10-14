# Third-party notices and asset provenance

Runtime libraries are installed as dependencies rather than copied reference repositories. Their complete licenses are supplied by installed packages. Preserve license notices when distributing builds.

- React Three Fiber: MIT, Poimandres. https://github.com/pmndrs/react-three-fiber
- Drei: MIT, react-spring/Poimandres. https://github.com/pmndrs/drei
- Three.js: MIT, three.js authors. https://github.com/mrdoob/three.js
- Draco decoder files: copied from the installed Three.js glTF decoder distribution; Apache-2.0, Google. Retain the decoder distribution license.

## Included models

- public/models/launchpad/launcher.glb: original assets/Mobile Launcher (assembled).glb; corresponding NASA repository model: 3D Models/Mobile Launcher/Mobile Launcher (assembled).glb.
- public/models/saturn-v/saturn-v.glb: original assets/Saturn V.glb; corresponding NASA repository model: 3D Models/Saturn V/Saturn V.glb.

NASA repository: https://github.com/nasa/NASA-3D-Resources

NASA usage guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/

The downloaded NASA README describes its assets as free and without copyright. Preserve NASA/source credit; review asset-specific credits and identifiers before external publication. Inclusion does not imply NASA endorsement.

The included public/textures/earth/nasa-earth.jpg is a JPEG derivative of NASA-3D-Resources/Images and Textures/Earth (A)/Earth (A).tif. No Earth tutorial code or Planet Pixel Emporium maps are included in this build. Planet Pixel Emporium textures have separate terms from the tutorial's MIT code license. The Max/DWF SLS sources remain in the original assets folder and are not served.

The copied prototype has no discovered application-level license. No new license is asserted over its code.


## Space experience update

The new introduction and synchronized scientific playback reuse the existing NASA Earth JPEG and launcher model. The local `assets/threejs-earth-update-2024` and `assets/three-globe-master` repositories were reviewed as references only; no tutorial textures or repository code were redistributed. Their licenses and attributions remain in the original reference directories. The procedural satellites and schematic rocket are application geometry. See `docs/space-experience.md` for the coordinate mapping and limitations.

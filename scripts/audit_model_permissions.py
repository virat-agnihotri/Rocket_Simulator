"""Read-only download audit. Does not execute source repositories or modify downloads."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import re
import struct
import subprocess
import zipfile

PROJECT = Path(__file__).resolve().parents[1]
DOWNLOAD_ROOTS = [PROJECT.parent / 'assets', PROJECT.parent / 'downloads']
NASA = PROJECT.parent / 'assets/NASA-3D-Resources-master/NASA-3D-Resources-master'
FORMATS = {'.glb', '.gltf', '.obj', '.fbx', '.blend', '.stl', '.max', '.dwf', '.3ds', '.dae', '.wrl'}
NASA_TERMS = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
CC_TERMS = 'https://creativecommons.org/licenses/by/4.0/'
STARSHIP_SOURCE = 'https://sketchfab.com/3d-models/spacex-starship-ship-24-booster-7-v4-97875d14b63e4b9ca9ed425ef4253306'
CONDITIONAL = 'Requires attribution or additional conditions'
UNCLEAR = 'Permission unclear'
REPO_URLS = {
    'drei-master': 'https://github.com/pmndrs/drei',
    'gltfjsx-master': 'https://github.com/pmndrs/gltfjsx',
    'react-three-fiber-master': 'https://github.com/pmndrs/react-three-fiber',
    'three-globe-master': 'https://github.com/vasturiano/three-globe',
    'threejs-earth-update-2024': 'https://github.com/bobbyroe/threejs-earth-update-2024',
}
rocket_pattern = re.compile(r'(?i)(saturn|ares\s?1|atlas\s?[679]|redstone|jupiter-c|space launch system|space shuttle|starship|ship2|booster|mechazilla|launchtower|mobile launcher|block 1|s-ic|s-ii|s-iv)')


def inspect_document(data, extension):
    if extension == '.glb':
        if len(data) < 20:
            raise ValueError('Truncated GLB')
        magic, version, length, chunk, kind = struct.unpack_from('<IIIII', data)
        if magic != 0x46546C67 or version != 2 or length != len(data) or kind != 0x4E4F534A:
            raise ValueError('Invalid GLB header')
        document = json.loads(data[20:20 + chunk])
    elif extension == '.gltf':
        document = json.loads(data)
    else:
        return {}
    return {
        'asset': document.get('asset', {}),
        'sceneExtras': document.get('extras'),
        'meshCount': len(document.get('meshes', [])),
        'nodeCount': len(document.get('nodes', [])),
        'animationCount': len(document.get('animations', [])),
        'extensionsRequired': document.get('extensionsRequired', []),
        'externalDependencies': [r['uri'] for r in document.get('buffers', []) + document.get('images', []) if r.get('uri') and not r['uri'].startswith('data:')],
    }


registry_text = (PROJECT / 'frontend/src/assets/rocketRegistry.ts').read_text(encoding='utf-8-sig')
registry = json.loads(registry_text.split(' = ', 1)[1].split(' as const;', 1)[0])
served_by_source = {r['source']: r['url'] for r in registry}
served_by_source[str(NASA / '3D Models/Mobile Launcher/Mobile Launcher (assembled).glb')] = '/models/launchpad/launcher.glb'
records = []
archives = []
license_files = []


def classify(record, nasa=False, repo_url=None):
    path = record['source']
    record['rocketRelated'] = bool(rocket_pattern.search(path))
    record['classification'] = UNCLEAR
    record['creator'] = 'Not identified'
    record['sourceUrl'] = repo_url
    record['termsUrl'] = None
    record['conditions'] = []
    if nasa:
        record.update(classification=CONDITIONAL, creator='NASA 3D Resources contributors; individual author not identified', termsUrl=NASA_TERMS)
        record['conditions'] = ['Acknowledge NASA as source', 'Educational/informational simulation use', 'Do not imply NASA endorsement', 'NASA identifiers and third-party rights retain separate restrictions']
        record['evidence'] = ['NASA repository README grants use of collection and points to official media guidelines', 'Official guidelines explicitly cover 3D polygon data and texture maps', 'No model-specific contrary rights notice found in inspected model metadata or adjacent text files']
    else:
        record['evidence'] = ['No verified model-specific permission; software repository license alone does not verify third-party art provenance']
    asset = record.get('metadata', {}).get('asset', {})
    extras = asset.get('extras', {})
    # Only the exact asset whose creator license was independently corroborated is cleared.
    if isinstance(extras, dict) and extras.get('source') == STARSHIP_SOURCE and extras.get('license', '').startswith('CC-BY-4.0'):
        record.update(classification=CONDITIONAL, creator=extras.get('author'), sourceUrl=STARSHIP_SOURCE, termsUrl=CC_TERMS)
        record['conditions'] = ['Credit clarence365 and supplied model title', 'Link original model and CC BY 4.0 license', 'Identify modifications and retain earlier modification notices', 'No endorsement; no additional legal or technical restrictions']
        record['evidence'] = ['Downloaded GLB asset.extras author/license/source/title', 'Original creator Sketchfab search-index listing matches exact model ID and Creative Commons Attribution license', 'Creative Commons BY 4.0 deed and legal code reviewed']
    elif nasa and isinstance(extras, dict) and any(k in extras for k in ('copyright', 'license', 'author')):
        record['classification'] = UNCLEAR
        record['evidence'].append('Embedded rights metadata requires individual review before any new import')
    record['servedPath'] = served_by_source.get(path)
    record['integration'] = 'Already integrated' if record['servedPath'] else 'Excluded from public application'
    if nasa and not record['servedPath']:
        record['integration'] = 'Permissions compatible for stated use; not imported (unrelated, duplicate, print component or unsupported source format)'
    if record['servedPath'] and 'starship-full.glb' in path:
        record['integration'] = 'Imported with creator credit and license links'


for root in DOWNLOAD_ROOTS:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or any(part in {'node_modules', '.git', '.venv'} for part in path.parts):
            continue
        relative = path.relative_to(root).as_posix()
        if path.name.lower().startswith(('license', 'readme', 'copying', 'notice')) or path.name == 'meta.json':
            license_files.append(str(path))
        repo = next((name for name in REPO_URLS if name in path.parts), None)
        repo_url = REPO_URLS.get(repo)
        is_nasa = path.is_relative_to(NASA)
        if path.suffix.lower() in FORMATS:
            record = {'source': str(path), 'format': path.suffix.lower()[1:], 'bytes': path.stat().st_size}
            if path.suffix.lower() in {'.glb', '.gltf'}:
                try:
                    record['metadata'] = inspect_document(path.read_bytes(), path.suffix.lower())
                except Exception as error:
                    record['inspectionError'] = str(error)
            if is_nasa:
                from urllib.parse import quote
                repo_url = 'https://github.com/nasa/NASA-3D-Resources/blob/master/' + quote(path.relative_to(NASA).as_posix(), safe='/')
            # Standalone duplicate NASA GLBs: verify bytes against official downloaded counterpart.
            if path.name in {'Saturn V.glb', 'Mobile Launcher (assembled).glb'} and path.parent == root:
                candidates = list(NASA.rglob(path.name))
                match = next((p for p in candidates if hashlib.sha256(p.read_bytes()).digest() == hashlib.sha256(path.read_bytes()).digest()), None)
                if match:
                    is_nasa = True
                    repo_url = 'https://github.com/nasa/NASA-3D-Resources'
                    record['verifiedDuplicateOf'] = str(match)
            classify(record, is_nasa, repo_url)
            if 'Block 1 (GNC markings scanline)' in relative and not is_nasa:
                record['evidence'].append('Filename corresponds to NASA SLS source archive, but raw MAX/DWF metadata and creator identity not independently verified')
            records.append(record)
        elif path.suffix.lower() == '.zip':
            with zipfile.ZipFile(path) as archive:
                text_entries = [i.filename for i in archive.infolist() if re.search(r'(?i)(license|copying|copyright|readme|notice)', i.filename)]
                archives.append({'source': str(path), 'type': 'zip', 'entries': len(archive.infolist()), 'rightsDocuments': text_entries, 'inspection': 'ZIP entry list and embedded GLB metadata inspected'})
                for info in archive.infolist():
                    extension = Path(info.filename).suffix.lower()
                    if extension not in FORMATS:
                        continue
                    record = {'source': str(path) + '!' + info.filename, 'format': extension[1:], 'bytes': info.file_size}
                    if extension in {'.glb', '.gltf'}:
                        try:
                            record['metadata'] = inspect_document(archive.read(info), extension)
                        except Exception as error:
                            record['inspectionError'] = str(error)
                    source_url = 'https://github.com/4M4Z3/starship-sim' if path.name == 'starship-sim-main.zip' else 'https://github.com/astrogeekdk/Starship-Simulator' if path.name == 'Starship-Simulator-main.zip' else repo_url
                    classify(record, False, source_url)
                    if record['servedPath']:
                        record['sourceSha256'] = hashlib.sha256(archive.read(info)).hexdigest()
                        served = PROJECT / 'frontend/public' / record['servedPath'].lstrip('/')
                        record['servedSha256'] = hashlib.sha256(served.read_bytes()).hexdigest()
                        if record['sourceSha256'] != record['servedSha256']:
                            raise ValueError(f'Imported asset differs from licensed source: {served}')
                    records.append(record)
        elif re.search(r'(?i)\.7z(?:\.\d+)?$|\.rar$', path.name):
            container = {'source': str(path), 'type': '7z / split archive' if '.7z' in path.name else 'rar', 'bytes': path.stat().st_size, 'classification': CONDITIONAL if is_nasa else UNCLEAR, 'termsUrl': NASA_TERMS if is_nasa else None}
            if path.suffix.lower() == '.7z' and rocket_pattern.search(str(path)):
                listing = subprocess.run(['tar', '-tf', str(path)], capture_output=True, timeout=60)
                container['entries'] = listing.stdout.decode('utf-8', errors='replace').splitlines()
                container['inspection'] = 'Embedded entry names inspected; source formats not converted or imported' if listing.returncode == 0 else listing.stderr.decode('utf-8', errors='replace').strip()
                if listing.returncode == 0:
                    for name in container['entries']:
                        if Path(name).suffix.lower() not in FORMATS:
                            continue
                        record = {'source': str(path) + '!' + name, 'format': Path(name).suffix.lower()[1:], 'metadataInspection': 'Archive entry name only; full author metadata not inspected'}
                        classify(record, is_nasa, 'https://github.com/nasa/NASA-3D-Resources' if is_nasa else None)
                        record['integration'] = 'Excluded: archival source / alternate printing model; not converted or added as duplicate SLS vehicle'
                        records.append(record)
            else:
                container['inspection'] = 'Container indexed only; unrelated archives not expanded. Split SLS archive reassembled in project temp directory; tar reported unsupported LZMA codec, so raw MAX/DWF attribution was not independently verified.'
            archives.append(container)

audit = {
    'checkedDate': '2026-10-14',
    'scope': [str(root) for root in DOWNLOAD_ROOTS],
    'classificationScope': 'Compatibility for this educational/informational simulation; not blanket approval for merchandising, endorsement or third-party branding',
    'classificationCounts': dict(Counter(r['classification'] for r in records)),
    'rocketClassificationCounts': dict(Counter(r['classification'] for r in records if r['rocketRelated'])),
    'models': records,
    'archives': archives,
    'rightsDocuments': license_files,
    'sourcesReviewed': [NASA_TERMS, 'https://github.com/nasa/NASA-3D-Resources', STARSHIP_SOURCE, CC_TERMS, 'https://creativecommons.org/licenses/by/4.0/legalcode.en', 'https://github.com/4M4Z3/starship-sim', 'https://github.com/astrogeekdk/Starship-Simulator'],
    'limitations': ['Sketchfab direct page and API requests returned 403; original exact-model creator and attribution license corroborated using search-indexed original listing and embedded downloaded metadata', 'NASA meta.json labels repository NOSA 1.3; assets are evaluated under explicit README and official media usage terms rather than assuming a software license replaces those terms', '7z container contents require separate inspection; no assets imported from them', 'Permission unclear is not a determination that an asset is forbidden'],
}
for label in ('Permitted for integration', CONDITIONAL, UNCLEAR, 'Not permitted'):
    audit['classificationCounts'].setdefault(label, 0)
    audit['rocketClassificationCounts'].setdefault(label, 0)
(PROJECT / 'docs/model-permissions-audit.json').write_text(json.dumps(audit, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({k: audit[k] for k in ('classificationCounts', 'rocketClassificationCounts')}, indent=2))
print(f'Model files/ZIP entries: {len(records)}; archive containers: {len(archives)}')

notices = [
    '# Third-party notices and asset provenance',
    '',
    'Permission review date: 2026-10-14. The following terms apply to the educational/informational rocket simulation. Model appearance does not establish verified vehicle physics. Existing software and model identifiers are preserved.',
    '',
    '## NASA models and applicable media terms',
    '',
    f'[Official NASA media usage guidelines]({NASA_TERMS}) explicitly cover 3D polygon data and texture maps for educational/informational simulations and web pages. NASA source acknowledgment is required; use must not imply endorsement. Separate NASA identifier, promotional, likeness and marked third-party rights restrictions remain applicable. This is media permission, not an MIT software license or a blanket merchandising authorization.',
    '',
    '[NASA 3D Resources repository](https://github.com/nasa/NASA-3D-Resources) README expressly grants use of its collection and directs users to those guidelines. Its contributors include NASA centers and named outside contributors. An individual author is not supplied for the imported NASA files in their inspected GLB metadata or adjacent text; do not invent one. The repository meta.json also labels the repository NOSA 1.3; the explicit media grant and official usage guidelines are the basis of this asset decision rather than an assumption that NOSA is a model-specific software license.',
    '',
    '| Model | Public asset path | Creator / source credit | Source URL | Applicable terms | Attribution / changes |',
    '| --- | --- | --- | --- | --- | --- |',
]
for asset in registry:
    if asset['id'] == 'starship-s24-b7':
        continue
    changes = 'Runtime orientation, centering and presentation scaling; NASA source thumbnail retained.'
    if asset['id'] == 'sls-block-1':
        changes = 'Original printing STL preserved separately; pre-existing flight mesh is a presentation derivative. Runtime orientation, centering and scaling.'
    notices.append(f"| {asset['name']} | `{asset['url']}`; `{asset['thumbnail']}` | {asset['creator']} | [Original model]({asset['sourceUrl']}) | [NASA media terms]({NASA_TERMS}) | Credit NASA 3D Resources; no endorsement. {changes} |")
notices += [
    f'| Mobile Launcher (assembled) | `/models/launchpad/launcher.glb` | NASA 3D Resources contributors; individual author not identified | [Original model](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Mobile%20Launcher) | [NASA media terms]({NASA_TERMS}) | Credit NASA; runtime scaling/centering; no endorsement. |',
    f'| SLS Block 1 original printing mesh | `/models/sls-block-1/sls-block-1.stl` | NASA 3D Resources contributors; individual author not identified | [Original printing file](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Printing/Space%20Launch%20System%20%28SLS%29%20Block%201) | [NASA media terms]({NASA_TERMS}) | Credit NASA; original preserved alongside flight derivative. |',
    '',
    'All 14 existing NASA preview images are copies of the corresponding downloaded source PNGs and receive the same NASA source credit and media conditions. Standalone Saturn V and Mobile Launcher downloads match the corresponding NASA repository GLBs by SHA-256.',
    '',
    '## Imported third-party model: Starship S24 / Super Heavy B7',
    '',
    '- Supplied title: **Spacex Starship Ship 24 & Booster 7 V4**.',
    '- Creator: **clarence365** ([creator profile](https://sketchfab.com/clarence365)). SpaceX is the depicted vehicle manufacturer, not the asserted mesh creator.',
    f'- Original source: [creator model listing]({STARSHIP_SOURCE}).',
    '- Download provenance: `F:/telementry_project/assets/starship-sim-main.zip!starship-sim-main/public/models/starship-full.glb`, obtained from [4M4Z3/starship-sim](https://github.com/4M4Z3/starship-sim). No simulator application code, physics, unrelated tower or other repository content was imported.',
    '- Served assets: `/models/rockets/starship-s24-b7/rocket.glb` and `/models/rockets/starship-s24-b7/preview.jpg`.',
    f'- License: [Creative Commons Attribution 4.0 International]({CC_TERMS}); [legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en).',
    '- Evidence: the downloaded GLB `asset.extras` contains the creator, exact original model URL, title and CC-BY-4.0 declaration. The search-indexed original Sketchfab listing independently identifies the same creator/model ID and Creative Commons Attribution license. Direct page/API requests returned 403; no claim is made that those live requests succeeded.',
    '- Conditions: retain supplied creator/title credit, link source and license, identify modifications, avoid implying endorsement, and do not impose additional restrictions on the licensed material. This applies to the mesh, materials, embedded images and the rendered thumbnail; no verified permission is inferred for other models in the repository.',
    '- Changes: downloaded derivative reports glTF-Transform v4.3.0 processing / compression. Its GLB bytes and embedded creator metadata were copied unchanged (SHA-256 equality verified); runtime centering, orientation and presentation scaling are applied, and a preview image was rendered in this application. No geometry was split or physics specifications invented.',
    '',
    'Attribution displayed in the hangar: “Spacex Starship Ship 24 & Booster 7 V4 by clarence365” with original source and CC BY 4.0 links, plus modification disclosure. Attribution also accompanies the distributed asset in `/models/rockets/starship-s24-b7/ATTRIBUTION.md` and this served notices file.',
    '',
    '## Excluded rocket-related models — downloads retained',
    '',
    '| File | Creator / source | Classification | Reason |',
    '| --- | --- | --- | --- |',
]
for record in records:
    if record['rocketRelated'] and record['classification'] == UNCLEAR:
        notices.append(f"| `{record['source']}` | {record['creator']}; {record.get('sourceUrl') or 'Original creator not verified'} | Permission unclear | {'; '.join(record['evidence'])} |")
notices += [
    '',
    'No reviewed rocket file was definitively classified Not permitted. Permission unclear is not a claim of prohibition. Such files are excluded until compatible model-specific terms or rights-holder permission are established. No downloaded file was deleted or modified.',
    '',
    '## Other rendering resources already in the application',
    '',
    f'- `/textures/earth/nasa-earth.jpg`: existing JPEG derivative of NASA 3D Resources `Images and Textures/Earth (A)/Earth (A).tif`. NASA source credit and [media terms]({NASA_TERMS}) apply.',
    '- `/textures/earth/earth-daymap-4k.jpg`, `earth-nightmap-4k.jpg`, `earth-clouds-4k.jpg`, `earth-bump-4k.jpg`: existing copies from the downloaded Bobby Roe Earth tutorial. Its README credits Planet Pixel Emporium; texture creator / copyright holder **James Hastings-Trew**. [Original texture collection and usage terms](https://planetpixelemporium.com/planets.html) and [Earth map page](https://planetpixelemporium.com/earth.html). The creator explicitly allows use as a resource for real-time rendering in a simulator/game; redistribution as a standalone texture collection, bundled authoring content library, or resale of texture-wrapped models requires separate permission. Classified Requires attribution or additional conditions for this rendering use. No blanket MIT license is asserted for these maps. Direct page retrieval failed; the original creator terms were inspected through the search-indexed source page. Preserve creator credit and these use boundaries when distributing the app.',
    '- Procedural satellite and schematic rocket geometry: generated by the existing application; not imported from third-party model archives.',
    '',
    '## Runtime software notices retained',
    '',
    '- React Three Fiber: MIT, Poimandres; https://github.com/pmndrs/react-three-fiber. Full notice in `licenses/FIBER-LICENSE.txt` and installed dependency.',
    '- Drei: MIT, react-spring / Poimandres; https://github.com/pmndrs/drei. Full notice in `licenses/DREI-LICENSE.txt` and installed dependency.',
    '- Three.js: MIT, Three.js authors; https://github.com/mrdoob/three.js. Full notice in `licenses/THREE-LICENSE.txt` and installed dependency.',
    '- Local Draco decoder: Apache-2.0, Google; full notice in `licenses/DRACO-APACHE-2.0.txt`.',
    '- Reference source repositories: drei MIT (react-spring); gltfjsx MIT (Paul Henschel); react-three-fiber MIT (Poimandres); three-globe MIT (Vasco Asturiano); Bobby Roe Earth tutorial MIT. These software licenses do not automatically establish permissions for every demonstration model or referenced texture. Unverified demo assets remain excluded.',
    '- The downloaded Rocket Mission Live Control prototype has no discovered application-level license. No new rights are asserted over its pre-existing code; no new prototype model or application code was imported during this audit.',
    '',
    '## Audit and classification record',
    '',
    f"The exhaustive downloaded model-file/ZIP-entry index contains {len(records)} records and {len(archives)} archive containers, including unrelated spacecraft and software demonstrations. `docs/model-permissions-audit.json` records each file, permission class, evidence and integration decision. `docs/model-permissions.md` summarizes the rocket-related entries and inspection limits. The broad NASA media classification is conditional on the stated use and absence of marked third-party restrictions; it is not a claim that every unrelated mesh has been visually inspected or imported.",
]
notices_text = '\n'.join(notices) + '\n'
(PROJECT / 'THIRD_PARTY_NOTICES.md').write_text(notices_text, encoding='utf-8')
(PROJECT / 'frontend/public/THIRD_PARTY_NOTICES.md').write_text(notices_text, encoding='utf-8')
starship_notice = notices_text.split('## Imported third-party model: Starship S24 / Super Heavy B7', 1)[1].split('## Excluded rocket-related models', 1)[0]
(PROJECT / 'frontend/public/models/rockets/starship-s24-b7/ATTRIBUTION.md').write_text('# Starship model attribution\n' + starship_notice, encoding='utf-8')

summary = [
    '# Downloaded model permissions audit', '',
    'Checked 2026-10-14. Compatibility is assessed for the existing educational/informational rocket simulation. All downloaded originals and ZIPs remain intact.', '',
    '| Classification | All indexed model files / archive entries | Rocket-related entries |',
    '| --- | ---: | ---: |',
]
for label in ('Permitted for integration', CONDITIONAL, UNCLEAR, 'Not permitted'):
    summary.append(f"| {label} | {audit['classificationCounts'][label]} | {audit['rocketClassificationCounts'][label]} |")
summary += [
    '', '## Decision and evidence', '',
    f'NASA: reviewed [official media guidelines]({NASA_TERMS}), collection README, repository meta.json, relevant adjacent text, and available GLB rights metadata. No MIT license is required to apply NASA’s explicit media permission. Credit NASA; no endorsement; separate identifier and marked third-party rights remain protected. Generic contributor credit is used where an individual creator is not identified.', '',
    f'Starship full stack: embedded creator/license/source metadata was independently corroborated by the search-indexed [exact original creator listing]({STARSHIP_SOURCE}). CC BY 4.0 supports the integration with creator credit, source/license links and changes disclosure. Direct Sketchfab requests returned 403; this limitation is recorded.', '',
    'Other Starship files have neither verified creator attribution nor model-specific license. The two repositories lack a repository license; the older README states model credits pending. These files are excluded, without deleting their archives.', '',
    'NASA archival sources/printing parts are not automatically converted into new selectable vehicles. Existing complete NASA models remain available; extra parts, alternate print models, and unsupported MAX/DWF/BLEND sources are indexed without replacing SLS or fabricating vehicle assemblies.', '',
    '## Rocket-related file decisions', '',
    '| Downloaded file / archive entry | Classification | Integration decision |',
    '| --- | --- | --- |',
]
for record in records:
    if record['rocketRelated']:
        summary.append(f"| `{record['source']}` | {record['classification']} | {record['integration']} |")
summary += ['', '## Inspection limits', ''] + ['- ' + item for item in audit['limitations']]
summary += ['', 'The SLS complete `.7z` archives expose a BLEND source and an alternate printing STL; filenames were inspected with the installed archive reader. The split scanline archive was copied into a temporary combined container, but the reader reported an unsupported LZMA codec. Its internal file metadata was not claimed verified. Unrelated 7z containers remain indexed without expansion.', '', '## Integration and validation', '', 'Imported `/models/rockets/starship-s24-b7/rocket.glb` without changing its bytes or embedded rights metadata. Existing 14 registry IDs and original model files retained. New model uses the shared loader, gallery confirmation, launch scene and scientific telemetry playback. No backend equations, verified presets or stage separation mappings were changed.', '', 'Validation results are recorded after running the frontend build, lint, focused asset/preservation tests and browser inspection. See `THIRD_PARTY_NOTICES.md` for distributed model credits.']
(PROJECT / 'docs/model-permissions.md').write_text('\n'.join(summary) + '\n', encoding='utf-8')

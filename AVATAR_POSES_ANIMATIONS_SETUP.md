# Avatars, Poses & Animations — New Project Setup Guide

This guide explains how to bring the avatar/pose/animation system into a **new**
project (without dragging in the full chat/server stack from this repo).

---

## 1. Minimum files needed to show avatars with poses

### Babylon.js (CDN, in `<head>`, before your own scripts)
```html
<script src="https://preview.babylonjs.com/ammo.js"></script>
<script src="https://preview.babylonjs.com/earcut.min.js"></script>
<script src="https://preview.babylonjs.com/babylon.js"></script>
<script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.js"></script>
```
Only `babylon.js` (core) and `loaders/babylonjs.loaders.js` (GLB import) are
required for avatars + poses. Materials/GUI/inspector libs are optional extras.

### Project scripts (load in this order, after Babylon.js)
| File | Why it's needed |
|---|---|
| [avatar.js](avatar.js) | `Avatar` class: `createAvatarMesh()` (loads the GLB), `placeAvatar()`, applies the `neutral` pose on load if one exists. Also contains self-contained `lego*` helpers used only if you ever use `avatarType === "A"` (lego-block avatars) — skip those if you only load GLB avatars. |
| [avatarRegistry.js](avatarRegistry.js) | `AVATARS` data + `getAvatarDefinition()` / `getAllAvatarDefinitions()` / `getAvatarNodes()`. Defines each avatar's GLB URL(s), world position, and rig node-name mapping. |
| [avatarPoses.js](avatarPoses.js) | `AVATAR_POSES` data — the actual pose definitions (bone rotations) per avatar. |
| [poseManager.js](poseManager.js) | `getAvatarPose()`, `findAvatarTransformNode()`, `applyPose()` — reads a pose from `AVATAR_POSES` and applies it to the loaded GLB's rig nodes. |

### Assets
- `Avatars/weman/*.glb` and `Avatars/Mans/*.glb` — the Ready Player Me GLB models referenced by `avatarURL`/`avatarURLBoy` in `avatarRegistry.js`.

### What you do NOT need for a plain "show avatars with poses" project
- `world.js`, `message.js`, `students.js`, `messages.js`, `lego1.js`, and the `server/` folder — these belong to the chat/networking/lego-menu features of this repo, not to avatar rendering/posing itself.

### Important gotcha
GLB loading via `BABYLON.SceneLoader.ImportMeshAsync` will fail under `file://`.
Serve the folder over HTTP, e.g.:
```
python -m http.server
```
then open `http://localhost:8000/`.

### Minimal HTML skeleton
```html
<canvas id="renderCanvas"></canvas>
<script>
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  new BABYLON.ArcRotateCamera("cam", Math.PI / 2, Math.PI / 3, 6, BABYLON.Vector3.Zero(), scene).attachControl(canvas, true);
  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  (async () => {
      const avatarData = getAvatarDefinition("avatar1");
      const avatar = new Avatar(avatarData, /* world */ null, /* avatarType */ "B");
      await avatar.createAvatarMesh(scene);   // loads the GLB, applies "neutral" pose if defined
      await avatar.placeAvatar();             // positions/orients it using avatarData.x/y/z/target*

      // avatar.importResult is what poseManager/animateAvatar need as `importResult`
  })();

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
</script>
```

---

## 2. Additional files needed for animations

On top of section 1, add:

| File | Why it's needed |
|---|---|
| [motionSequences.js](motionSequences.js) | `MOTION_SEQUENCES` data — ordered lists of poses to animate through (e.g. a "wave"). |
| [animateAvatar.js](animateAvatar.js) | `animateAvatarBetweenNamedPoses()` and `playMotionSequence()` — the animation runner. Also uses `animateToPose()`/`animateBetweenPoses()` which already live in `poseManager.js`. |

Load order (matches `index.html`):
```html
<script src="avatar.js"></script>
<script src="avatarRegistry.js"></script>
<script src="avatarPoses.js"></script>
<script src="poseManager.js"></script>
<script src="motionSequences.js"></script>
<script src="animateAvatar.js"></script>
```
`animateAvatar.js` assumes `poseManager.js` and `motionSequences.js` are already loaded (per its own header comment), and both assume Babylon.js is loaded first.

---

## 3. Where/how to add data

### a) Define an avatar — `avatarRegistry.js`
Add a new entry to the `AVATARS` object:
```js
const AVATARS = {
    avatar30: {
        id: "avatar30",
        num: 30,                                   // even/odd picks woman/man GLB in avatar.js
        avatarURL: "Avatars/weman/<file>.glb",      // used when num is even
        avatarURLBoy: "Avatars/Mans/<file>.glb",    // used when num is odd
        isUsed: false,
        x: 2.0, y: 0.0, z: 3.0,                     // world position
        targetX: 0.0, targetY: 0.0, targetZ: 0.0,   // lookAt point
        // Optional: only if this GLB's rig uses different bone names
        // than the default:
        nodeOverrides: {
            leftArm: "LeftArm",
            leftForeArm: "LeftForeArm",
            rightArm: "RightArm",
            rightForeArm: "RightForeArm"
        }
    }
};
```
`DEFAULT_AVATAR_NODES` at the top of the file already defines the standard
Ready Player Me bone names (`LeftArm`/`LeftForeArm`/`RightArm`/`RightForeArm`);
`nodeOverrides` is only needed for a rig with different names.

### b) Define poses — `avatarPoses.js`
Add/extend an entry in `AVATAR_POSES`, keyed by avatar id, then by pose id:
```js
const AVATAR_POSES = {
    avatar30: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",
            rotations: {
                leftArm:     { quaternion: { x: 0, y: 0, z: 0, w: 1 } },
                leftForeArm: { quaternion: { x: 0, y: 0, z: 0, w: 1 } }
            }
        },
        handRaised: {
            id: "handRaised",
            label: "Left hand raised",
            rotations: {
                leftArm:     { quaternion: { x: 0.51, y: 0.14, z: 0.02, w: 0.85 } },
                leftForeArm: { quaternion: { x: 0.10, y: 0.20, z: 0.05, w: 0.97 } }
            }
        }
    }
};
```
- The keys under `rotations` (`leftArm`, `leftForeArm`, ...) are **logical node
  names** — they must match the keys in `DEFAULT_AVATAR_NODES`/`nodeOverrides`
  for that avatar, not the raw bone name directly.
- If a GLB has an existing `neutral` pose, `avatar.createAvatarMesh()` applies
  it automatically right after loading.
- Tip from repo notes: get exact rotation values by opening the GLB in the
  Babylon Sandbox/Inspector, selecting the bone/node in Scene Explorer, and
  reading its Rotation (X/Y/Z) — these are absolute local rotations, not deltas.

### c) Define a motion sequence — `motionSequences.js`
```js
const MOTION_SEQUENCES = {
    wave: {
        id: "wave",
        steps: [
            { pose: "handRaised", velocity: 70 },
            { pose: "handLeft",   velocity: 100 },
            { pose: "handRight",  velocity: 100, holdMilliseconds: 500 },
            { pose: "neutral",    velocity: 70 }
        ],
        nodes: ["leftArm", "leftForeArm"]   // logical nodes this sequence animates
    }
};
```
Every `pose` value must be a valid pose id already defined for that avatar in
`AVATAR_POSES`. `velocity` is degrees/second; `holdMilliseconds` (optional)
pauses after reaching that step's pose.

---

## 4. Calling the functions

`importResult` below is `avatar.importResult` (set by `avatar.createAvatarMesh(scene)`).
`avatarId` is `avatarData.id` (e.g. `"avatar1"`).

### Apply a single static pose (no animation)
```js
applyPose(avatar.importResult, avatarId, "handRaised");
```

### Animate between two named poses
```js
// Low-level (poseManager.js):
await animateToPose(scene, avatar.importResult, avatarId, "neutral", "handRaised", {
    velocityDegreesPerSecond: 60
});

// Higher-level wrapper (animateAvatar.js) — also stops any imported GLB
// animation groups and snaps to the exact start/end pose values:
await animateAvatarBetweenNamedPoses(scene, avatar.importResult, avatarId, "neutral", "handRaised", {
    velocityDegreesPerSecond: 60,
    nodeNames: ["leftArm", "leftForeArm"]   // optional; defaults to all shared nodes
});
```

### Play a full motion sequence
```js
await playMotionSequence(scene, avatar.importResult, avatarId, "wave", {
    startingPoseId: "neutral",
    onStepStart: (step) => console.log("starting step:", step),
    onStepComplete: (step) => console.log("finished step:", step)
});
```

### Notes
- All three calls are `async` — GLB posing/animation targets rig transform
  nodes found by `findAvatarTransformNode()`, so `createAvatarMesh()` must have
  finished loading the GLB first.
- Posing/animation only applies to rigged GLB avatars (`avatarType` other than
  `"A"`). Lego-block avatars (`avatarType === "A"`) have no skeleton and are
  not affected by `applyPose`/`animateToPose`/`playMotionSequence`.

---

## 5. Walking (walk to the center of the circle)

[walkAvatar.js](walkAvatar.js) walks an avatar in a straight line using a real
Ready Player Me walk clip (`M_Walk_001` for men, `F_Walk_002` for women, picked
by `avatarData.loadedIsMan`). Load it after `poseManager.js`; it has no other
dependencies beyond Babylon.js and the `Avatar` object.

```js
await avatar.walkToCenter();   // turns to the center, walks, stops 1.0 short of it
await avatar.walkHome();       // walks back to avatarData.x/z and faces the center again
avatar.stopWalking();          // cancel; the pending promise resolves false
avatar.isWalking;              // true while walking/turning

// In index.html the avatars live in the World:
myWorld.registryIdToAvatar("avatar8").walkToCenter({ stopDistance: 1.5 });
```

**Chat:** in `index.html` the walk is wired to chat. When a chat starts (you
clicked an avatar's chat button, or an incoming chat opened), the partner avatar
walks from its place on the circle towards the center, where the viewer's camera
stands, stopping `CHAT_WALK_STOP_DISTANCE` (2.5, in `world.js`, so the whole
body stays in view) short of it. When
the chat ends (closed, or ended by the other side) it walks back
(`World.walkPartnerIn()` / `World.walkPartnerHome()`). The walk is local to each
viewer's browser and is not sent to other viewers.

Options (defaults in `WALK_DEFAULTS`): `speedRatio` (clip speed, 0.8),
`blendSeconds` (ease in/out, 0.35), `turnSeconds` (0.4), `stopDistance` (1.0),
`slideSpeed` (m/s for avatars without a rig, 1.2).

How it works:
- The clip GLB is loaded once per gender into an `AssetContainer` (never added
  to the scene) and its tracks are retargeted onto each avatar's bones by name.
- The clip moves the `Hips` bone forward as it walks; that drift is removed
  (the clip walks in place) and the avatar's root mesh is moved instead, at the
  clip's own forward speed times `speedRatio`, so the feet don't slide.
- The clip's weight fades in/out with the speed, and when the walk ends the
  bones are restored exactly to the pose they had before (e.g. `neutral`).
- Lego avatars (`"A"`), or any avatar whose clip fails to load, just slide.
- Several avatars sent to the center stop on a ring of radius `stopDistance`,
  so pick a larger value if many will walk in at once.

The clips are loaded straight from
[readyplayerme/animation-library](https://github.com/readyplayerme/animation-library)
on GitHub at a pinned commit (`WALK_CLIP_BASE_URL`). The Ready Player Me
platform itself shut down on Jan 31 2026, but that repo is still public. Its
license allows free personal/commercial use with Ready Player Me avatars but
forbids redistributing the animations, which is why they are not copied into
this repo. To serve them yourself (e.g. if the repo disappears), copy the two
GLBs keeping the `masculine/glb/locomotion/` and `feminine/glb/locomotion/`
layout and set `WALK_CLIP_BASE_URL = "Avatars/animations/"`.

---

## 6. Testing animations — `animDemo.html`

[animDemo.html](animDemo.html) shows the same scene, camera point (center of
the circle) and avatar circle as `index.html`, with no sign-in, server or chat.
Pick an avatar (or tap it), then press **Walk in** / **Walk home** / **Stop**;
**◀ turn / turn ▶** (or tapping the ground, like the app) turns the camera.

Open it at `http://localhost:5500/animDemo.html` (`npm run dev`), or on GitHub
Pages at `https://nimrodh.github.io/carshare_lego/animDemo.html` once merged.

To try a new animation before adding it to the app, add an entry to
`DEMO_ACTIONS` at the top of the page's script — it becomes a button that runs
`run(avatar)` on the selected avatar (and load any extra scripts it needs).

// walkAvatar.js
//
// Loaded as a plain (non-module) script (after avatar.js / avatarRegistry.js),
// so everything here is exposed as a global.
//
// Walks an avatar across the ground using a Ready Player Me walk clip:
// - the clip only drives the legs/arms/body (its built-in forward movement of
//   the "Hips" bone is removed, so the clip walks "in place"),
// - this file moves the avatar's root mesh along a straight line, at the same
//   speed the clip was authored for, so the feet do not slide.
//
// Walk clips come from https://github.com/readyplayerme/animation-library
// (free for personal and commercial use with Ready Player Me avatars; not to be
// redistributed - see the LICENSE.md there). They are loaded straight from
// GitHub at a pinned commit rather than copied into this repo.
//
// Avatars without a rig (lego "A" avatars) or whose clip fails to load
// just slide to the target.
//
// Usage:
//     await avatar.walkToCenter();   // walk towards the center of the circle
//     await avatar.walkHome();       // walk back to the place on the circle
//     avatar.stopWalking();          // cancel (the pending promise resolves false)


// ============================================================
// SETTINGS
// ============================================================

// Change this to a local folder (e.g. "Avatars/animations/") to serve the
// clips yourself; it must keep the library's masculine/... feminine/... layout.
let WALK_CLIP_BASE_URL =
    "https://raw.githubusercontent.com/readyplayerme/animation-library/c841f8ba6f290b62fa0a3c19dddd0e5e8444f1e5/";

const WALK_CLIP_PATHS = {
    masculine: "masculine/glb/locomotion/M_Walk_001.glb",
    feminine: "feminine/glb/locomotion/F_Walk_002.glb"
};

const WALK_DEFAULTS = {
    speedRatio: 0.8,        // clip playback speed (1 = as authored, ~1.7 m/s)
    blendSeconds: 0.35,     // ease in/out of the walk at start and end
    turnSeconds: 0.4,       // time to turn towards the target before walking
    slideSpeed: 1.2,        // meters/second for avatars without a walk clip
    stopDistance: 1.0       // walkToCenter(): stop this far from the center
};


// ============================================================
// PUBLIC API
// ============================================================

/**
 * Walk an avatar in a straight line to `target` (a Vector3; y is ignored).
 * Resolves true when it arrives, false if it was cancelled
 * (by stopAvatarWalk() or by starting another walk on the same avatar).
 *
 * options: WALK_DEFAULTS fields, plus
 *     faceAfter: Vector3 | null - turn to face this point after arriving
 */
async function walkAvatarTo(avatar, target, options = {}) {
    const mesh = avatar.avatarMesh;
    if (!mesh) {
        throw new Error("walkAvatarTo: avatar has no mesh.");
    }
    const settings = { ...WALK_DEFAULTS, ...options };
    const scene = mesh.getScene();

    stopAvatarWalk(avatar);
    if (typeof stopAvatarClip === "function") stopAvatarClip(avatar); // avatarClips.js, if loaded
    const token = { cancelled: false, cleanup: null };
    avatar._walkToken = token;

    const walker = await getAvatarWalker(avatar);
    if (token.cancelled) return false;

    const start = mesh.position.clone();
    const end = new BABYLON.Vector3(target.x, start.y, target.z);
    const distance = BABYLON.Vector3.Distance(start, end);

    let arrived = true;
    if (distance > 0.001) {
        arrived = await turnAvatarTowards(avatar, end, settings.turnSeconds, token)
            && await moveAvatar(avatar, walker, start, end, settings, token);
    }
    if (arrived && settings.faceAfter) {
        arrived = await turnAvatarTowards(avatar, settings.faceAfter, settings.turnSeconds, token);
    }

    if (avatar._walkToken === token) {
        avatar._walkToken = null;
    }
    return arrived;
}

/// Walk towards the center of the circle (the point the avatar looks at when
/// placed), stopping `stopDistance` short of it so avatars don't overlap.
function walkAvatarToCenter(avatar, options = {}) {
    const { stopDistance } = { ...WALK_DEFAULTS, ...options };
    const center = getAvatarCircleCenter(avatar);
    const position = avatar.avatarMesh.position;

    const fromCenter = new BABYLON.Vector3(position.x - center.x, 0, position.z - center.z);
    const radius = fromCenter.length();
    const stopPoint = radius > stopDistance
        ? center.add(fromCenter.scale(stopDistance / radius))
        : new BABYLON.Vector3(position.x, 0, position.z); // already inside the stop radius

    return walkAvatarTo(avatar, stopPoint, options);
}

/// Walk back to the avatar's place on the circle and face the center again.
function walkAvatarHome(avatar, options = {}) {
    const data = avatar.avatarData;
    return walkAvatarTo(avatar, new BABYLON.Vector3(data.x, data.y, data.z), {
        faceAfter: getAvatarCircleCenter(avatar),
        ...options
    });
}

/// Cancel the avatar's current walk/turn, if any. The avatar stays where it is.
function stopAvatarWalk(avatar) {
    const token = avatar._walkToken;
    if (!token) return;
    token.cancelled = true;
    if (token.cleanup) token.cleanup();
    avatar._walkToken = null;
}

function isAvatarWalking(avatar) {
    return !!avatar._walkToken;
}


// ============================================================
// MOVEMENT
// ============================================================

/// Move the root mesh from start to end with a trapezoid speed profile
/// (ease in, cruise, ease out), fading the walk clip in and out to match.
function moveAvatar(avatar, walker, start, end, settings, token) {
    const mesh = avatar.avatarMesh;
    const direction = end.subtract(start).normalize();
    const distance = BABYLON.Vector3.Distance(start, end);

    const speed = walker
        ? walker.clip.forwardSpeed * settings.speedRatio
        : settings.slideSpeed;
    // Ramp time; shortened for walks too short to reach full speed.
    const ramp = Math.max(Math.min(settings.blendSeconds, distance / speed), 0.001);
    const totalSeconds = distance / speed + ramp;

    const distanceAt = t => {
        if (t < ramp) return speed * t * t / (2 * ramp);
        if (t > totalSeconds - ramp) {
            const left = totalSeconds - t;
            return distance - speed * left * left / (2 * ramp);
        }
        return speed * ramp / 2 + speed * (t - ramp);
    };

    if (walker) {
        startWalkClip(mesh.getScene(), walker, settings.speedRatio);
    }
    token.cleanup = () => {
        if (walker) stopWalkClip(walker);
    };

    return runEachFrame(mesh.getScene(), token, elapsed => {
        const t = Math.min(elapsed, totalSeconds);
        mesh.position = start.add(direction.scale(distanceAt(t)));
        if (walker) {
            // Clip weight follows the speed: 0 when standing, 1 at full speed.
            walker.group.weight = Math.max(0, Math.min(1, t / ramp, (totalSeconds - t) / ramp));
        }
        if (t < totalSeconds) return false;

        token.cleanup();
        token.cleanup = null;
        return true;
    });
}

/// Smoothly turn the avatar to face `point`, using the same lookAt + 180°
/// convention as Avatar.placeAvatar() (the GLB faces away from lookAt()).
function turnAvatarTowards(avatar, point, seconds, token) {
    const mesh = avatar.avatarMesh;
    const from = mesh.rotationQuaternion
        ? mesh.rotationQuaternion.clone()
        : BABYLON.Quaternion.FromEulerVector(mesh.rotation);

    mesh.lookAt(new BABYLON.Vector3(point.x, mesh.position.y, point.z));
    mesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
    const to = mesh.rotationQuaternion.clone();

    const angle = 2 * Math.acos(Math.min(1, Math.abs(BABYLON.Quaternion.Dot(from, to))));
    if (angle < 0.02 || seconds <= 0) {
        return Promise.resolve(true);
    }
    mesh.rotationQuaternion = from.clone();
    const duration = seconds * Math.min(1, angle / (Math.PI / 2)); // small turns are quicker

    return runEachFrame(mesh.getScene(), token, elapsed => {
        const k = Math.min(elapsed / duration, 1);
        const eased = k * k * (3 - 2 * k);
        mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(from, to, eased);
        return k >= 1;
    });
}

/// Call step(elapsedSeconds) before every frame until it returns true (resolves
/// true) or the walk is cancelled (resolves false).
function runEachFrame(scene, token, step) {
    return new Promise(resolve => {
        let elapsed = 0;
        const observer = scene.onBeforeRenderObservable.add(() => {
            if (token.cancelled) {
                scene.onBeforeRenderObservable.remove(observer);
                resolve(false);
                return;
            }
            elapsed += scene.getEngine().getDeltaTime() / 1000;
            if (step(elapsed)) {
                scene.onBeforeRenderObservable.remove(observer);
                resolve(true);
            }
        });
    });
}

function getAvatarCircleCenter(avatar) {
    const data = avatar.avatarData;
    return new BABYLON.Vector3(data.targetX, data.y, data.targetZ);
}


// ============================================================
// WALK CLIP ON THE AVATAR
// ============================================================

/// Returns the avatar's walker ({ group, clip, snapshot }), building it on first
/// use, or null if the avatar has no rig / the clip couldn't be loaded.
async function getAvatarWalker(avatar) {
    if (avatar._walker !== undefined) return avatar._walker;
    if (!avatar.importResult) {
        avatar._walker = null; // lego avatars: slide only
        return null;
    }

    const scene = avatar.avatarMesh.getScene();
    const clipUrl = WALK_CLIP_BASE_URL +
        (avatar.avatarData.loadedIsMan ? WALK_CLIP_PATHS.masculine : WALK_CLIP_PATHS.feminine);

    let clip;
    try {
        clip = await loadWalkClip(scene, clipUrl);
    } catch (error) {
        console.warn(`Walk clip failed to load (${clipUrl}); avatar will slide instead.`, error);
        return null; // not cached, so the next walk retries
    }
    if (avatar._walker !== undefined) return avatar._walker; // built by a concurrent call

    const nodesByName = new Map(
        avatar.importResult.transformNodes.map(node => [node.name, node])
    );
    const group = new BABYLON.AnimationGroup(`walk_${avatar.avatarData.id}`, scene);
    const nodes = [];

    for (const track of clip.tracks) {
        const node = nodesByName.get(track.nodeName);
        if (!node) continue;
        const animation = track.animation.targetProperty === "position"
            ? rebaseRootMotion(track.animation, node.position)
            : track.animation;
        group.addTargetedAnimation(animation, node);
        nodes.push(node);
    }
    avatar._walker = { group, clip, nodes: [...new Set(nodes)], snapshot: null };
    return avatar._walker;
}

function startWalkClip(scene, walker, speedRatio) {
    // Stop any pose tweens (poseManager) on the same bones, then remember the
    // current pose so it can be restored exactly when the walk ends.
    walker.nodes.forEach(node => scene.stopAnimation(node));
    walker.snapshot = walker.nodes.map(node => ({
        node,
        position: node.position.clone(),
        rotationQuaternion: node.rotationQuaternion ? node.rotationQuaternion.clone() : null
    }));

    walker.group.weight = 0; // blends with the pose above until weight reaches 1
    walker.group.speedRatio = speedRatio;
    walker.group.play(true);
}

function stopWalkClip(walker) {
    walker.group.stop();
    for (const { node, position, rotationQuaternion } of walker.snapshot || []) {
        node.position.copyFrom(position);
        if (rotationQuaternion) node.rotationQuaternion = rotationQuaternion.clone();
    }
    walker.snapshot = null;
}


// ============================================================
// WALK CLIP LOADING
// ============================================================

const walkClipCache = {}; // url -> Promise<clip>

/// Loads a walk clip GLB once (without adding it to the scene) and extracts its
/// animation tracks by bone name, so they can be retargeted onto any avatar.
function loadWalkClip(scene, url) {
    if (!walkClipCache[url]) {
        walkClipCache[url] = BABYLON.SceneLoader.LoadAssetContainerAsync(url, "", scene)
            .then(container => {
                const clip = extractWalkClip(container, url);
                container.dispose();
                return clip;
            })
            .catch(error => {
                delete walkClipCache[url];
                throw error;
            });
    }
    return walkClipCache[url];
}

function extractWalkClip(container, url) {
    const group = container.animationGroups[0];
    if (!group) {
        throw new Error(`No animation found in walk clip ${url}`);
    }
    group.stop();

    const tracks = group.targetedAnimations.map(targeted => ({
        nodeName: targeted.target.name,
        animation: targeted.animation
    }));

    // The clip moves the Hips forward as it walks; measure that so the avatar's
    // root can be moved at the same speed (and so it can be removed from the clip).
    let forwardSpeed = 1.5;
    const rootTrack = tracks.find(t => t.nodeName === "Hips" && t.animation.targetProperty === "position");
    if (rootTrack) {
        const keys = rootTrack.animation.getKeys();
        const first = keys[0];
        const last = keys[keys.length - 1];
        const drift = last.value.subtract(first.value);
        const seconds = (last.frame - first.frame) / rootTrack.animation.framePerSecond;
        forwardSpeed = Math.hypot(drift.x, drift.z) / seconds;
    }

    return { tracks, forwardSpeed };
}

/// Returns a copy of the clip's Hips position track that stays in place:
/// the overall drift over the cycle is removed and the motion (bob/sway) is
/// applied on top of this avatar's own rest Hips position.
function rebaseRootMotion(animation, restPosition) {
    const keys = animation.getKeys();
    const first = keys[0];
    const last = keys[keys.length - 1];
    const drift = last.value.subtract(first.value);
    const span = (last.frame - first.frame) || 1;

    const rebased = new BABYLON.Animation(
        `${animation.name}_inPlace`,
        "position",
        animation.framePerSecond,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    rebased.setKeys(keys.map(key => ({
        frame: key.frame,
        value: restPosition
            .add(key.value.subtract(first.value))
            .subtract(drift.scale((key.frame - first.frame) / span))
    })));
    return rebased;
}

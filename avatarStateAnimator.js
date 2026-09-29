// avatarStateAnimator.js
//
// Loaded as a plain (non-module) script after walkAvatar.js, avatarClips.js and
// avatarStateClips.js, so everything here is a global.
//
// Runs the clips of AVATAR_STATE_CLIPS (avatarStateClips.js) for each avatar's
// state. Animation is local to this session: it follows what this session knows
// about each avatar and is never sent to the server.
//
// Usage:
//     setAvatarAnimState(avatar, "waiting");  // does nothing if already in that state
//     getAvatarAnimState(avatar);             // "waiting"
//     stopAvatarAnimState(avatar);
//
// Per avatar: avatar._anim = { state, generation, uiState, uiTimer }.
// Every state change bumps `generation`; the steps of an older state stop at their
// next await when they see it changed, so a clip that finishes loading late never
// overrides a newer state.


// ============================================================
// SETTINGS
// ============================================================

const STATE_ANIM_SETTINGS = {
    blendSeconds: 0.4,       // fade from one clip to the next
    turnSeconds: 1.0,        // time for a 90° turn (smaller turns are quicker)
    preloadConcurrency: 3    // clips downloaded at the same time
};

// States of the chat with me: they end by themselves (with `next`), so the
// server status of that avatar is ignored while they run.
const CHAT_ANIM_STATES = new Set(["accepted", "talking", "endAgree", "endNoAgree"]);
// States that already mean "waiting for a call".
const WAITING_ANIM_STATES = new Set(["created", "waiting", "lookedAt", "busyEnd"]);


// ============================================================
// PUBLIC API
// ============================================================

function setAvatarAnimState(avatar, stateName) {
    if (!canAnimateAvatar(avatar)) return;
    const definition = AVATAR_STATE_CLIPS[stateName];
    if (!definition) {
        console.warn(`[ANIM] Unknown avatar state "${stateName}"`);
        return;
    }
    const anim = getAvatarAnim(avatar);
    if (anim.state === stateName) return;

    anim.state = stateName;
    const generation = ++anim.generation;
    runAvatarAnimState(avatar, definition, generation)
        .catch(err => console.warn(`[ANIM] ${stateName} failed:`, err));
}

function getAvatarAnimState(avatar) {
    return avatar && avatar._anim ? avatar._anim.state : null;
}

function stopAvatarAnimState(avatar) {
    if (!avatar || !avatar._anim) return;
    avatar._anim.state = null;
    avatar._anim.generation++;
    stopAvatarWalk(avatar);
    stopAvatarClip(avatar);
}

/// Only rigged avatars that this session shows can be animated
/// (lego "A" avatars have no skeleton; a "C" viewer sees no avatar bodies).
function canAnimateAvatar(avatar) {
    return !!(avatar && avatar.avatarMesh && avatar.importResult && avatar.avatarType !== "C");
}

/// Called by Avatar.setState() with the avatar's sign state (noChat, inChat,
/// alreadyTalked, done, loading, me, myChat, refuseChat). The periodic update sets
/// states several times in a row (an avatar in a call goes noChat, then inChat), so
/// only the last state set before the page gets back to the event loop is used.
function onAvatarUiState(avatar, uiState) {
    if (!canAnimateAvatar(avatar)) return;
    const anim = getAvatarAnim(avatar);
    anim.uiState = uiState;
    if (anim.uiTimer) return;
    anim.uiTimer = setTimeout(() => {
        anim.uiTimer = null;
        applyAvatarUiState(avatar, anim.uiState);
    }, 0);
}

/// Download the clips of the given states (all states if omitted) for masculine
/// (true) and/or feminine (false) skeletons, a few at a time. Each file is
/// downloaded once and shared by every avatar of that gender.
async function preloadStateClips(scene, isManValues, stateNames = Object.keys(AVATAR_STATE_CLIPS)) {
    const urls = [];
    for (const stateName of stateNames) {
        const definition = AVATAR_STATE_CLIPS[stateName];
        if (!definition || !definition.clips) continue;
        for (const isMan of isManValues) {
            for (const clip of resolveStateClips(isMan, definition.clips)) {
                const url = getRpmClipUrlFor(isMan, clip.category, clip.name);
                if (!urls.includes(url)) urls.push(url);
            }
        }
    }

    let next = 0;
    const worker = async () => {
        while (next < urls.length) {
            const url = urls[next++];
            try {
                await loadWalkClip(scene, url);
            } catch (err) {
                console.warn(`[ANIM] Clip failed to preload: ${url}`, err);
            }
        }
    };
    const workers = [];
    for (let i = 0; i < STATE_ANIM_SETTINGS.preloadConcurrency; i++) workers.push(worker());
    await Promise.all(workers);
}


// ============================================================
// SIGN STATE -> ANIMATION STATE
// ============================================================

function applyAvatarUiState(avatar, uiState) {
    const world = avatar.myWorld;
    if (world && world.myAvatar === avatar) return;    // my own avatar
    if (world && world.chatPartner === avatar) return; // in a chat with me: the world drives it
    const current = getAvatarAnimState(avatar);
    if (CHAT_ANIM_STATES.has(current)) return;          // ends by itself, then waits

    switch (uiState) {
        case "inChat":
            setAvatarAnimState(avatar, "busy");
            break;
        case "noChat":
        case "alreadyTalked":
        case "done":
            if (current === "busy") {
                setAvatarAnimState(avatar, "busyEnd");
            } else if (!WAITING_ANIM_STATES.has(current)) {
                setAvatarAnimState(avatar, "created");
            }
            break;
        // loading, me, myChat, refuseChat: keep what is playing
    }
}


// ============================================================
// RUNNING A STATE
// ============================================================

async function runAvatarAnimState(avatar, definition, generation) {
    const isCurrent = () => avatar._anim.generation === generation;
    const isMan = !!avatar.avatarData.loadedIsMan;
    const clips = definition.clips ? resolveStateClips(isMan, definition.clips) : [];

    if (definition.turnBefore && !await turnAvatarForState(avatar, definition.turnBefore, isCurrent)) return;

    if (definition.play === "one") {
        const clip = pickRandom(clips);
        if (clip) await playStateClip(avatar, clip);
        if (!isCurrent()) return;
    } else if (definition.play === "hold") {
        const clip = pickRandom(clips);
        if (clip) {
            try {
                await applyAvatarClipPose(avatar, clip.category, clip.name);
            } catch (err) {
                console.warn(`[ANIM] Clip failed to load: ${clip.name}`, err);
            }
        }
        if (!isCurrent()) return;
    }

    if (definition.then && !await runAvatarStep(avatar, definition.then, isCurrent)) return;
    if (definition.turnAfter && !await turnAvatarForState(avatar, definition.turnAfter, isCurrent)) return;

    if (definition.play === "loop") {
        await loopStateClips(avatar, clips, isCurrent);
        return;
    }
    if (definition.next && isCurrent()) {
        setAvatarAnimState(avatar, definition.next);
    }
}

/// Play `clips` one after the other in random order until the state changes.
async function loopStateClips(avatar, clips, isCurrent) {
    let choices = [...clips];
    let previous = null;
    while (isCurrent() && choices.length > 0) {
        const clip = pickRandom(choices.length > 1 ? choices.filter(c => c !== previous) : choices);
        const result = await playStateClip(avatar, clip);
        if (result === "error") {
            choices = choices.filter(c => c !== clip); // don't retry a clip that failed to load
            continue;
        }
        if (!result) return; // stopped or replaced
        previous = clip;
    }
}

/// Resolves true when the clip finished, false when it was stopped or replaced,
/// "error" when it couldn't be loaded.
async function playStateClip(avatar, clip) {
    try {
        return await playAvatarClip(avatar, clip.category, clip.name, {
            loop: false,
            restoreOnEnd: false, // keep the last frame; the next clip blends in from it
            blendSeconds: STATE_ANIM_SETTINGS.blendSeconds
        });
    } catch (err) {
        console.warn(`[ANIM] Clip failed to load: ${clip.name}`, err);
        return "error";
    }
}

async function runAvatarStep(avatar, step, isCurrent) {
    switch (step) {
        case "walkIn": {
            // The world decides where to (towards the center, or half the way to
            // a camera that was walked out towards the avatars).
            const world = avatar.myWorld;
            const arrived = world && world.walkPartnerToViewer
                ? await world.walkPartnerToViewer(avatar)
                : await walkAvatarToCenter(avatar);
            return arrived && isCurrent();
        }
        case "walkHome":
            return await walkAvatarHome(avatar) && isCurrent();
        default:
            console.warn(`[ANIM] Unknown step "${step}"`);
            return true;
    }
}

/// turn: "center", or { degrees, randomSide } to turn away from the center.
async function turnAvatarForState(avatar, turn, isCurrent) {
    const mesh = avatar.avatarMesh;
    const center = getAvatarCircleCenter(avatar);
    let point = center;
    if (turn !== "center") {
        const side = turn.randomSide && Math.random() < 0.5 ? -1 : 1;
        const angle = BABYLON.Tools.ToRadians(turn.degrees || 0) * side;
        const toCenter = new BABYLON.Vector3(center.x - mesh.position.x, 0, center.z - mesh.position.z);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        point = new BABYLON.Vector3(
            mesh.position.x + toCenter.x * cos - toCenter.z * sin,
            mesh.position.y,
            mesh.position.z + toCenter.x * sin + toCenter.z * cos
        );
    }

    // Registered as a walk, so a walk or a new clip cancels the turn.
    stopAvatarWalk(avatar);
    const token = { cancelled: false, cleanup: null };
    avatar._walkToken = token;
    const turned = await turnAvatarTowards(avatar, point, STATE_ANIM_SETTINGS.turnSeconds, token);
    if (avatar._walkToken === token) avatar._walkToken = null;
    return turned && isCurrent();
}


// ============================================================
// CLIP NAMES
// ============================================================

let rpmClipList = null; // [{ key: "m_dances_001", category, name }]
const resolvedStateClips = new Map();

/// The catalog clips matching `patterns` (names without the F/M prefix, see
/// avatarStateClips.js) for a masculine (isMan) or feminine skeleton.
function resolveStateClips(isMan, patterns) {
    const cacheKey = `${isMan}|${patterns.join("|")}`;
    if (resolvedStateClips.has(cacheKey)) return resolvedStateClips.get(cacheKey);

    if (!rpmClipList) {
        rpmClipList = [];
        for (const [category, names] of Object.entries(RPM_CLIP_CATALOG)) {
            for (const name of names) rpmClipList.push({ key: name.toLowerCase(), category, name });
        }
    }
    const find = fullName => {
        const escaped = fullName.split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
        const pattern = new RegExp(`^${escaped.join(".*")}$`);
        return rpmClipList.filter(clip => pattern.test(clip.key));
    };

    const own = isMan ? "m" : "f";
    const other = isMan ? "f" : "m";
    const result = [];
    for (const pattern of patterns) {
        const lower = pattern.toLowerCase();
        let found;
        if (lower.startsWith("_")) {
            found = find(own + lower);
            if (found.length === 0) found = find(other + lower);
        } else {
            found = find(lower);
        }
        if (found.length === 0) console.warn(`[ANIM] No clip matches "${pattern}"`);
        for (const clip of found) {
            if (!result.includes(clip)) result.push(clip);
        }
    }
    resolvedStateClips.set(cacheKey, result);
    return result;
}


// ============================================================
// HELPERS
// ============================================================

function getAvatarAnim(avatar) {
    if (!avatar._anim) {
        avatar._anim = { state: null, generation: 0, uiState: null, uiTimer: null };
    }
    return avatar._anim;
}

function pickRandom(items) {
    return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

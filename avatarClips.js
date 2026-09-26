// avatarClips.js
//
// Loaded as a plain (non-module) script after walkAvatar.js (it reuses its clip
// loading, WALK_CLIP_BASE_URL and runEachFrame), so everything here is a global.
//
// Plays any clip from the Ready Player Me animation library
// (https://github.com/readyplayerme/animation-library) on an avatar, as it was
// authored: the Hips bone keeps all of the clip's movement (up/down, and the
// forward movement of walk/run clips, which snaps back each time a loop restarts).
// Only the starting point is moved to the avatar's own rest Hips position.
// Used by animDemo.html to try clips before building them into the app.
//
// Usage:
//     await playAvatarClip(avatar, "dance", "M_Dances_001", { loop: false });
//     stopAvatarClip(avatar);


// ============================================================
// CLIP CATALOG - file names in <masculine|feminine>/glb/<category>/
// (both folders hold the same names, each fitted to its own skeleton)
// ============================================================

const RPM_CLIP_CATALOG = {
    idle: [
        "F_Standing_Idle_001",
        "F_Standing_Idle_Variations_001",
        "F_Standing_Idle_Variations_002",
        "F_Standing_Idle_Variations_003",
        "F_Standing_Idle_Variations_004",
        "F_Standing_Idle_Variations_005",
        "F_Standing_Idle_Variations_006",
        "F_Standing_Idle_Variations_007",
        "F_Standing_Idle_Variations_008",
        "F_Standing_Idle_Variations_009",
        "M_Standing_Idle_001",
        "M_Standing_Idle_002",
        "M_Standing_Idle_Variations_001",
        "M_Standing_Idle_Variations_002",
        "M_Standing_Idle_Variations_003",
        "M_Standing_Idle_Variations_004",
        "M_Standing_Idle_Variations_005",
        "M_Standing_Idle_Variations_006",
        "M_Standing_Idle_Variations_007",
        "M_Standing_Idle_Variations_008",
        "M_Standing_Idle_Variations_009",
        "M_Standing_Idle_Variations_010"
    ],
    expression: [
        "F_Talking_Variations_001",
        "F_Talking_Variations_002",
        "F_Talking_Variations_003",
        "F_Talking_Variations_004",
        "F_Talking_Variations_005",
        "F_Talking_Variations_006",
        "M_Standing_Expressions_001",
        "M_Standing_Expressions_002",
        "M_Standing_Expressions_004",
        "M_Standing_Expressions_005",
        "M_Standing_Expressions_006",
        "M_Standing_Expressions_007",
        "M_Standing_Expressions_008",
        "M_Standing_Expressions_009",
        "M_Standing_Expressions_010",
        "M_Standing_Expressions_011",
        "M_Standing_Expressions_012",
        "M_Standing_Expressions_013",
        "M_Standing_Expressions_014",
        "M_Standing_Expressions_015",
        "M_Standing_Expressions_016",
        "M_Standing_Expressions_017",
        "M_Standing_Expressions_018",
        "M_Talking_Variations_001",
        "M_Talking_Variations_002",
        "M_Talking_Variations_003",
        "M_Talking_Variations_004",
        "M_Talking_Variations_005",
        "M_Talking_Variations_006",
        "M_Talking_Variations_007",
        "M_Talking_Variations_008",
        "M_Talking_Variations_009",
        "M_Talking_Variations_010"
    ],
    dance: [
        "F_Dances_001",
        "F_Dances_004",
        "F_Dances_005",
        "F_Dances_006",
        "F_Dances_007",
        "M_Dances_001",
        "M_Dances_002",
        "M_Dances_003",
        "M_Dances_004",
        "M_Dances_005",
        "M_Dances_006",
        "M_Dances_007",
        "M_Dances_008",
        "M_Dances_009",
        "M_Dances_011"
    ],
    locomotion: [
        "F_Crouch_Strafe_Left",
        "F_Crouch_Strafe_Right",
        "F_Crouch_Walk_001",
        "F_CrouchedWalk_Backwards_001",
        "F_Falling_Idle_000",
        "F_Falling_Idle_001",
        "F_Jog_001",
        "F_Jog_Backwards_001",
        "F_Jog_Jump_Small_001",
        "F_Jog_Strafe_Left_002",
        "F_Jog_Strafe_Right_002",
        "F_Run_001",
        "F_Run_Backwards_001",
        "F_Run_Jump_001",
        "F_Run_Strafe_Left_001",
        "F_Run_Strafe_Right_001",
        "F_Walk_002",
        "F_Walk_003",
        "F_Walk_Backwards_001",
        "F_Walk_Jump_001",
        "F_Walk_Jump_002",
        "F_Walk_Strafe_Left_001",
        "F_Walk_Strafe_Right_001",
        "M_Crouch_Strafe_Left_002",
        "M_Crouch_Strafe_Right_002",
        "M_Crouch_Walk_003",
        "M_CrouchedWalk_Backwards_002",
        "M_Falling_Idle_002",
        "M_Jog_001",
        "M_Jog_003",
        "M_Jog_Backwards_001",
        "M_Jog_Jump_001",
        "M_Jog_Jump_002",
        "M_Jog_Strafe_Left_001",
        "M_Jog_Strafe_Right_001",
        "M_Run_001",
        "M_Run_Backwards_002",
        "M_Run_Jump_001",
        "M_Run_Jump_002",
        "M_Run_Strafe_Left_002",
        "M_Run_Strafe_Right_002",
        "M_Walk_001",
        "M_Walk_002",
        "M_Walk_Backwards_001",
        "M_Walk_Jump_001",
        "M_Walk_Jump_002",
        "M_Walk_Jump_003",
        "M_Walk_Strafe_Left_002",
        "M_Walk_Strafe_Right_002"
    ]
};


// ============================================================
// PLAY / STOP
// ============================================================

/**
 * Play a library clip on the avatar. Resolves true when a non-looping clip
 * finishes, false when the clip is stopped (stopAvatarClip, another clip or a walk).
 *
 * options:
 *     loop: true            - repeat until stopped
 *     blendSeconds: 0.3     - fade in from the current pose
 *     speedRatio: 1
 */
async function playAvatarClip(avatar, category, name, options = {}) {
    const { loop = true, blendSeconds = 0.3, speedRatio = 1 } = options;
    if (!avatar.importResult) {
        throw new Error("This avatar has no skeleton to animate.");
    }

    stopAvatarClip(avatar);
    stopAvatarWalk(avatar);

    const scene = avatar.avatarMesh.getScene();
    const clip = await loadWalkClip(scene, getRpmClipUrl(avatar, category, name));
    if (avatar._clipPlayer) stopAvatarClip(avatar); // another clip started while loading

    const nodesByName = new Map(
        avatar.importResult.transformNodes.map(node => [node.name, node])
    );
    const group = new BABYLON.AnimationGroup(`clip_${avatar.avatarData.id}_${name}`, scene);
    const nodes = [];
    for (const track of clip.tracks) {
        const node = nodesByName.get(track.nodeName);
        if (!node) continue;
        const animation = track.animation.targetProperty === "position"
            ? offsetPositionTrack(track.animation, node.position)
            : track.animation;
        group.addTargetedAnimation(animation, node);
        nodes.push(node);
    }

    // Same start/stop as the walk: remember the pose, blend in, restore on stop.
    const player = { group, nodes: [...new Set(nodes)], snapshot: null, resolve: null };
    startWalkClip(scene, player, speedRatio);
    if (!loop) {
        group.loopAnimation = false;
        group.animatables.forEach(animatable => { animatable.loopAnimation = false; });
    }
    const token = { cancelled: false };
    player.token = token;
    avatar._clipPlayer = player;

    runEachFrame(scene, token, elapsed => {
        group.weight = Math.min(1, elapsed / Math.max(blendSeconds, 0.001));
        return group.weight >= 1;
    });

    return new Promise(resolve => {
        player.resolve = resolve;
        // The end event fires mid-frame, before that frame's animation values are
        // written, so restore the pose on the next frame or it gets overwritten.
        group.onAnimationGroupEndObservable.addOnce(() => {
            scene.onBeforeRenderObservable.addOnce(() => {
                if (avatar._clipPlayer === player) finishAvatarClip(avatar, true);
            });
        });
    });
}

/// Stop the avatar's clip (if any) and return it to the pose it had before.
function stopAvatarClip(avatar) {
    if (avatar._clipPlayer) finishAvatarClip(avatar, false);
}

function isAvatarClipPlaying(avatar) {
    return !!avatar._clipPlayer;
}

/// Seconds one play of the clip takes (loads it if needed).
async function getRpmClipDuration(avatar, category, name) {
    const clip = await loadWalkClip(avatar.avatarMesh.getScene(), getRpmClipUrl(avatar, category, name));
    let seconds = 0;
    for (const { animation } of clip.tracks) {
        const keys = animation.getKeys();
        seconds = Math.max(seconds, (keys[keys.length - 1].frame - keys[0].frame) / animation.framePerSecond);
    }
    return seconds;
}

function getRpmClipUrl(avatar, category, name) {
    const folder = avatar.avatarData.loadedIsMan ? "masculine" : "feminine";
    return `${WALK_CLIP_BASE_URL}${folder}/glb/${category}/${name}.glb`;
}


// ============================================================
// HELPERS
// ============================================================

function finishAvatarClip(avatar, completed) {
    const player = avatar._clipPlayer;
    avatar._clipPlayer = null;
    player.token.cancelled = true;
    stopWalkClip(player);
    player.group.dispose();
    if (player.resolve) player.resolve(completed);
}

/// Copy of the clip's Hips position track moved so that it starts at this
/// avatar's rest Hips position; all of the clip's movement is kept as is.
function offsetPositionTrack(animation, restPosition) {
    const keys = animation.getKeys();
    const first = keys[0].value;
    const moved = new BABYLON.Animation(
        `${animation.name}_offset`,
        "position",
        animation.framePerSecond,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    moved.setKeys(keys.map(key => ({
        frame: key.frame,
        value: restPosition.add(key.value.subtract(first))
    })));
    return moved;
}

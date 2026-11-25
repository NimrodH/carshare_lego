// Loaded as a plain (non-module) script, like avatarRegistry.js/avatar.js,
// so AVATARS/getAvatarDefinition/AVATAR_POSES are consumed as globals.

// ============================================================
// GET POSE
// ============================================================

function getAvatarPose(
    avatarId,
    poseId
) {
    const avatarPoses =
        AVATAR_POSES[avatarId] || {};

    const pose =
        avatarPoses[poseId] ||
        (AVATAR_POSES.default &&
            AVATAR_POSES.default[poseId]);

    if (!pose) {
        throw new Error(
            `Pose "${poseId}" was not found for avatar "${avatarId}".`
        );
    }

    return pose;
}


// ============================================================
// HAS POSE (checks avatar-specific poses, falling back to default)
// ============================================================

function hasAvatarPose(
    avatarId,
    poseId
) {
    const avatarPoses =
        AVATAR_POSES[avatarId] || {};

    return !!(
        avatarPoses[poseId] ||
        (AVATAR_POSES.default &&
            AVATAR_POSES.default[poseId])
    );
}


// ============================================================
// FIND AVATAR TRANSFORM NODE
// ============================================================

function findAvatarTransformNode(
    importResult,
    avatarDefinition,
    logicalNodeName
) {
    const actualNodeName =
        avatarDefinition.nodes[
            logicalNodeName
        ];

    if (!actualNodeName) {
        console.warn(
            `No node mapping for "${logicalNodeName}".`
        );

        return null;
    }

    const normalizedName =
        actualNodeName
            .trim()
            .toLowerCase();

    return (
        importResult.transformNodes.find(
            node =>
                node.name
                    .trim()
                    .toLowerCase() ===
                normalizedName
        ) || null
    );
}


// ============================================================
// APPLY NAMED POSE
// ============================================================

function applyPose(
    importResult,
    avatarId,
    poseId,
    includedNodes = null
) {
    const avatar =
        getAvatarDefinition(avatarId);

    const pose =
        getAvatarPose(
            avatarId,
            poseId
        );

    const logicalNodeNames =
        Array.isArray(includedNodes)
            ? includedNodes
            : Object.keys(
                pose.rotations
            );

    const appliedNodes = [];
    const missingNodes = [];

    for (
        const logicalNodeName
        of logicalNodeNames
    ) {
        const rotation =
            pose.rotations[
                logicalNodeName
            ];

        if (!rotation) {
            missingNodes.push(
                logicalNodeName
            );

            continue;
        }

        const node =
            findAvatarTransformNode(
                importResult,
                avatar,
                logicalNodeName
            );

        if (!node) {
            missingNodes.push(
                logicalNodeName
            );

            continue;
        }

        const q =
            rotation.quaternion;

        node.rotationQuaternion =
            new BABYLON.Quaternion(
                q.x,
                q.y,
                q.z,
                q.w
            ).normalize();

        appliedNodes.push(
            logicalNodeName
        );
    }

    return {
        avatarId,
        poseId,
        appliedNodes,
        missingNodes
    };
}


// ============================================================
// ANIMATE BETWEEN NAMED POSES
// ============================================================

async function animateToPose(
    scene,
    importResult,
    avatarId,
    fromPoseId,
    toPoseId,
    options = {}
) {
    const avatar =
        getAvatarDefinition(
            avatarId
        );

    const fromPose =
        getAvatarPose(
            avatarId,
            fromPoseId
        );

    const toPose =
        getAvatarPose(
            avatarId,
            toPoseId
        );

    return animateBetweenPoses(
        scene,
        importResult,
        avatar,
        fromPose,
        toPose,
        options
    );
}


// ============================================================
// LOW-LEVEL POSE ANIMATION
// ============================================================

async function animateBetweenPoses(
    scene,
    importResult,
    avatar,
    fromPose,
    toPose,
    options = {}
) {
    const {
        nodeNames = null,
        velocityDegreesPerSecond = 60,
        fps = 60,
        minimumDurationSeconds = 0.1
    } = options;

    const logicalNodeNames =
        Array.isArray(nodeNames)
            ? nodeNames
            : Object.keys(
                fromPose.rotations
            ).filter(
                name =>
                    toPose.rotations[
                        name
                    ]
            );

    const entries = [];

    for (
        const logicalNodeName
        of logicalNodeNames
    ) {
        const fromRotation =
            fromPose.rotations[
                logicalNodeName
            ];

        const toRotation =
            toPose.rotations[
                logicalNodeName
            ];

        if (
            !fromRotation ||
            !toRotation
        ) {
            continue;
        }

        const node =
            findAvatarTransformNode(
                importResult,
                avatar,
                logicalNodeName
            );

        if (!node) {
            continue;
        }

        const startQuaternion =
            quaternionFromRotation(
                fromRotation
            );

        const endQuaternion =
            quaternionFromRotation(
                toRotation
            );

        ensureShortestPath(
            startQuaternion,
            endQuaternion
        );

        const angle =
            quaternionAngleDegrees(
                startQuaternion,
                endQuaternion
            );

        entries.push({
            logicalNodeName,
            node,
            startQuaternion,
            endQuaternion,
            angle
        });
    }

    if (
        entries.length === 0
    ) {
        return {
            animatedNodes: [],
            durationSeconds: 0
        };
    }

    const largestAngle =
        Math.max(
            ...entries.map(
                entry =>
                    entry.angle
            )
        );

    const durationSeconds =
        Math.max(
            largestAngle /
                velocityDegreesPerSecond,
            minimumDurationSeconds
        );

    const endFrame =
        Math.max(
            1,
            Math.round(
                durationSeconds * fps
            )
        );

    const animations =
        entries.map(
            entry =>
                animateNode(
                    scene,
                    entry.node,
                    entry.startQuaternion,
                    entry.endQuaternion,
                    fps,
                    endFrame
                )
        );

    await Promise.all(
        animations
    );

    return {
        animatedNodes:
            entries.map(
                entry =>
                    entry.logicalNodeName
            ),

        durationSeconds
    };
}


// ============================================================
// ANIMATE ONE NODE
// ============================================================

function animateNode(
    scene,
    node,
    startQuaternion,
    endQuaternion,
    fps,
    endFrame
) {
    return new Promise(
        resolve => {
            const animation =
                new BABYLON.Animation(
                    `pose_${node.name}`,
                    "rotationQuaternion",
                    fps,
                    BABYLON.Animation
                        .ANIMATIONTYPE_QUATERNION,
                    BABYLON.Animation
                        .ANIMATIONLOOPMODE_CONSTANT
                );

            animation.setKeys([
                {
                    frame: 0,
                    value:
                        startQuaternion
                            .clone()
                },
                {
                    frame: endFrame,
                    value:
                        endQuaternion
                            .clone()
                }
            ]);

            const easing =
                new BABYLON.SineEase();

            easing.setEasingMode(
                BABYLON.EasingFunction
                    .EASINGMODE_EASEINOUT
            );

            animation.setEasingFunction(
                easing
            );

            scene.beginDirectAnimation(
                node,
                [animation],
                0,
                endFrame,
                false,
                1,
                resolve
            );
        }
    );
}


// ============================================================
// QUATERNION HELPERS
// ============================================================

function quaternionFromRotation(
    rotation
) {
    const q =
        rotation.quaternion;

    return new BABYLON.Quaternion(
        q.x,
        q.y,
        q.z,
        q.w
    ).normalize();
}


function ensureShortestPath(
    startQuaternion,
    endQuaternion
) {
    const dot =
        BABYLON.Quaternion.Dot(
            startQuaternion,
            endQuaternion
        );

    if (dot < 0) {
        endQuaternion.scaleInPlace(
            -1
        );
    }
}


function quaternionAngleDegrees(
    startQuaternion,
    endQuaternion
) {
    let dot =
        Math.abs(
            BABYLON.Quaternion.Dot(
                startQuaternion,
                endQuaternion
            )
        );

    dot =
        Math.max(
            -1,
            Math.min(
                1,
                dot
            )
        );

    return BABYLON.Tools.ToDegrees(
        2 * Math.acos(dot)
    );
}
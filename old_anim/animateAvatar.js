// animateAvatar.js
//
// Loaded as a plain (non-module) script for playing pose-to-pose avatar
// animations and named motion sequences.
//
// Assumptions:
// - poseManager.js is already loaded as a plain script and exposes:
//     getAvatarPose()
//     applyPose()
//     animateToPose()
// - motionSequences.js is loaded before this file and exposes MOTION_SEQUENCES
// - Babylon.js is already loaded


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_FPS = 60;

const DEFAULT_VELOCITY_DEGREES_PER_SECOND = 60;

const DEFAULT_MINIMUM_DURATION_SECONDS = 0.1;

const DEFAULT_STARTING_POSE_ID = "neutral";


// ============================================================
// ANIMATE BETWEEN TWO NAMED POSES
// ============================================================

/**
 * Animate one loaded avatar from one named pose to another.
 *
 * Example:
 *
 * await animateAvatarBetweenNamedPoses(
 *     scene,
 *     avatarImportResult,
 *     "avatar1",
 *     "neutral",
 *     "handRaised",
 *     {
 *         velocityDegreesPerSecond: 60,
 *         nodeNames: [
 *             "leftArm",
 *             "leftForeArm"
 *         ]
 *     }
 * );
 *
 *
 * options:
 *
 * {
 *     nodeNames: null | string[],
 *
 *     velocityDegreesPerSecond: number,
 *
 *     fps: number,
 *
 *     minimumDurationSeconds: number,
 *
 *     applyStartPose: boolean,
 *
 *     stopImportedAnimationGroups: boolean
 * }
 *
 *
 * nodeNames:
 *
 * null =
 * animate all logical nodes that exist in both poses.
 *
 */
async function animateAvatarBetweenNamedPoses(
    scene,
    importResult,
    avatarId,
    fromPoseId,
    toPoseId,
    options = {}
) {
    validateRuntimeDependencies();

    validateRequiredString(
        avatarId,
        "avatarId"
    );

    validateRequiredString(
        fromPoseId,
        "fromPoseId"
    );

    validateRequiredString(
        toPoseId,
        "toPoseId"
    );

    if (!scene) {
        throw new Error(
            "animateAvatarBetweenNamedPoses: scene is required."
        );
    }

    if (!importResult) {
        throw new Error(
            "animateAvatarBetweenNamedPoses: importResult is required."
        );
    }


    const {
        nodeNames = null,

        velocityDegreesPerSecond =
            DEFAULT_VELOCITY_DEGREES_PER_SECOND,

        fps =
            DEFAULT_FPS,

        minimumDurationSeconds =
            DEFAULT_MINIMUM_DURATION_SECONDS,

        applyStartPose = true,

        stopImportedAnimationGroups = true
    } = options;


    validatePositiveNumber(
        velocityDegreesPerSecond,
        "velocityDegreesPerSecond"
    );

    validatePositiveNumber(
        fps,
        "fps"
    );

    validateNonNegativeNumber(
        minimumDurationSeconds,
        "minimumDurationSeconds"
    );

    validateNodeNames(
        nodeNames
    );


    // ------------------------------------------------------------
    // Validate both poses before changing the avatar
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // Stop imported GLB animations
    // ------------------------------------------------------------

    if (stopImportedAnimationGroups) {
        stopAvatarAnimationGroups(
            importResult
        );
    }


    // ------------------------------------------------------------
    // Apply the starting pose
    // ------------------------------------------------------------

    if (applyStartPose) {
        applyPose(
            importResult,
            avatarId,
            fromPoseId,
            nodeNames
        );
    }


    // ------------------------------------------------------------
    // Animate using the existing poseManager function
    // ------------------------------------------------------------

    const result =
        await animateToPose(
            scene,
            importResult,
            avatarId,
            fromPoseId,
            toPoseId,
            {
                nodeNames,

                velocityDegreesPerSecond,

                fps,

                minimumDurationSeconds
            }
        );


    // ------------------------------------------------------------
    // Apply exact final pose
    //
    // This makes sure the avatar ends with exactly the quaternion
    // values stored in the target pose.
    // ------------------------------------------------------------

    const finalPoseResult =
        applyPose(
            importResult,
            avatarId,
            toPoseId,
            nodeNames
        );


    return {
        avatarId,

        fromPoseId:
            fromPose.id || fromPoseId,

        toPoseId:
            toPose.id || toPoseId,

        animatedNodes:
            result.animatedNodes || [],

        durationSeconds:
            result.durationSeconds || 0,

        finalAppliedNodes:
            finalPoseResult.appliedNodes || [],

        missingNodes:
            uniqueStrings([
                ...(result.missingNodes || []),

                ...(finalPoseResult.missingNodes || [])
            ])
    };
}


// ============================================================
// PLAY MOTION SEQUENCE
// ============================================================

/**
 * Play one sequence from MOTION_SEQUENCES.
 *
 *
 * Expected sequence format:
 *
 * wave: {
 *     id: "wave",
 *
 *     steps: [
 *         {
 *             pose: "handRaised",
 *             velocity: 70
 *         },
 *         {
 *             pose: "handLeft",
 *             velocity: 100
 *         },
 *         {
 *             pose: "handRight",
 *             velocity: 100,
 *             holdMilliseconds: 500
 *         }
 *     ],
 *
 *     nodes: [
 *         "leftArm",
 *         "leftForeArm"
 *     ]
 * }
 *
 *
 * Example:
 *
 * await playMotionSequence(
 *     scene,
 *     avatarImportResult,
 *     "avatar1",
 *     "wave",
 *     {
 *         startingPoseId: "neutral"
 *     }
 * );
 *
 *
 * options:
 *
 * {
 *     startingPoseId: "neutral",
 *
 *     nodeNames: null | string[],
 *
 *     defaultVelocityDegreesPerSecond: 60,
 *
 *     fps: 60,
 *
 *     minimumDurationSeconds: 0.1,
 *
 *     applyStartingPose: true,
 *
 *     stopImportedAnimationGroups: true,
 *
 *     onStepStart: function | null,
 *
 *     onStepComplete: function | null
 * }
 *
 *
 * nodeNames:
 *
 * If supplied here, it overrides sequence.nodes.
 *
 */
async function playMotionSequence(
    scene,
    importResult,
    avatarId,
    sequenceId,
    options = {}
) {
    validateRuntimeDependencies();


    validateRequiredString(
        avatarId,
        "avatarId"
    );

    validateRequiredString(
        sequenceId,
        "sequenceId"
    );


    if (!scene) {
        throw new Error(
            "playMotionSequence: scene is required."
        );
    }

    if (!importResult) {
        throw new Error(
            "playMotionSequence: importResult is required."
        );
    }


    // ------------------------------------------------------------
    // Get sequence
    // ------------------------------------------------------------

    const sequence =
        getMotionSequence(
            sequenceId
        );


    validateMotionSequence(
        sequence,
        sequenceId
    );


    const {
        startingPoseId =
            DEFAULT_STARTING_POSE_ID,

        nodeNames = undefined,

        defaultVelocityDegreesPerSecond =
            DEFAULT_VELOCITY_DEGREES_PER_SECOND,

        fps =
            DEFAULT_FPS,

        minimumDurationSeconds =
            DEFAULT_MINIMUM_DURATION_SECONDS,

        applyStartingPose = true,

        stopImportedAnimationGroups = true,

        onStepStart = null,

        onStepComplete = null
    } = options;


    validateRequiredString(
        startingPoseId,
        "startingPoseId"
    );


    validatePositiveNumber(
        defaultVelocityDegreesPerSecond,
        "defaultVelocityDegreesPerSecond"
    );


    validatePositiveNumber(
        fps,
        "fps"
    );


    validateNonNegativeNumber(
        minimumDurationSeconds,
        "minimumDurationSeconds"
    );


    validateOptionalCallback(
        onStepStart,
        "onStepStart"
    );


    validateOptionalCallback(
        onStepComplete,
        "onStepComplete"
    );


    // ------------------------------------------------------------
    // Which nodes should participate?
    //
    // Explicit option overrides sequence.nodes.
    // ------------------------------------------------------------

    const sequenceNodeNames =
        nodeNames !== undefined
            ? nodeNames
            : (
                sequence.nodes ||
                null
            );


    validateNodeNames(
        sequenceNodeNames
    );


    // ------------------------------------------------------------
    // Validate the starting pose
    // ------------------------------------------------------------

    getAvatarPose(
        avatarId,
        startingPoseId
    );


    // ------------------------------------------------------------
    // Validate all target poses BEFORE animation starts
    //
    // This prevents a typo in step 5 from stopping the sequence
    // halfway through.
    // ------------------------------------------------------------

    for (
        const step
        of sequence.steps
    ) {
        getAvatarPose(
            avatarId,
            step.pose
        );
    }


    // ------------------------------------------------------------
    // Stop GLB animations once
    // ------------------------------------------------------------

    if (
        stopImportedAnimationGroups
    ) {
        stopAvatarAnimationGroups(
            importResult
        );
    }


    // ------------------------------------------------------------
    // Apply initial pose
    // ------------------------------------------------------------

    if (applyStartingPose) {
        applyPose(
            importResult,
            avatarId,
            startingPoseId,
            sequenceNodeNames
        );
    }


    let currentPoseId =
        startingPoseId;


    const completedSteps = [];


    // ============================================================
    // RUN EACH STEP
    // ============================================================

    for (
        let stepIndex = 0;
        stepIndex <
            sequence.steps.length;
        stepIndex++
    ) {
        const step =
            sequence.steps[
                stepIndex
            ];


        // --------------------------------------------------------
        // Velocity
        // --------------------------------------------------------

        const velocityDegreesPerSecond =
            Number.isFinite(
                step.velocity
            )
                ? step.velocity
                : defaultVelocityDegreesPerSecond;


        validatePositiveNumber(
            velocityDegreesPerSecond,
            `velocity for step ${stepIndex + 1}`
        );


        // --------------------------------------------------------
        // Optional pause after pose
        // --------------------------------------------------------

        const holdMilliseconds =
            Number.isFinite(
                step.holdMilliseconds
            )
                ? step.holdMilliseconds
                : 0;


        validateNonNegativeNumber(
            holdMilliseconds,
            `holdMilliseconds for step ${stepIndex + 1}`
        );


        // --------------------------------------------------------
        // Step information
        // --------------------------------------------------------

        const stepContext = {
            avatarId,

            sequenceId,

            sequence,

            stepIndex,

            stepNumber:
                stepIndex + 1,

            totalSteps:
                sequence.steps.length,

            fromPoseId:
                currentPoseId,

            toPoseId:
                step.pose,

            velocityDegreesPerSecond,

            holdMilliseconds,

            nodeNames:
                sequenceNodeNames
        };


        // --------------------------------------------------------
        // Optional callback before animation
        // --------------------------------------------------------

        if (onStepStart) {
            await onStepStart(
                stepContext
            );
        }


        // --------------------------------------------------------
        // Animate current pose -> next pose
        // --------------------------------------------------------

        const animationResult =
            await animateAvatarBetweenNamedPoses(
                scene,

                importResult,

                avatarId,

                currentPoseId,

                step.pose,

                {
                    nodeNames:
                        sequenceNodeNames,

                    velocityDegreesPerSecond,

                    fps,

                    minimumDurationSeconds,

                    /*
                     * Current pose was already applied:
                     *
                     * - before the first step, or
                     * - by the previous completed step.
                     */
                    applyStartPose:
                        false,

                    /*
                     * GLB animation groups were already stopped
                     * once before the sequence.
                     */
                    stopImportedAnimationGroups:
                        false
                }
            );


        // --------------------------------------------------------
        // Current pose is now the completed pose
        // --------------------------------------------------------

        currentPoseId =
            step.pose;


        const completedStep = {
            ...stepContext,

            animationResult
        };


        completedSteps.push(
            completedStep
        );


        // --------------------------------------------------------
        // Optional callback after step
        // --------------------------------------------------------

        if (onStepComplete) {
            await onStepComplete(
                completedStep
            );
        }


        // --------------------------------------------------------
        // Optional pause
        // --------------------------------------------------------

        if (
            holdMilliseconds > 0
        ) {
            await delay(
                holdMilliseconds
            );
        }
    }


    // ============================================================
    // SEQUENCE COMPLETED
    // ============================================================

    return {
        avatarId,

        sequenceId,

        startingPoseId,

        finalPoseId:
            currentPoseId,

        nodes:
            sequenceNodeNames,

        completedSteps
    };
}


// ============================================================
// GET MOTION SEQUENCE
// ============================================================

/**
 * Get sequence from MOTION_SEQUENCES by ID.
 */
function getMotionSequence(
    sequenceId
) {
    const sequence =
        MOTION_SEQUENCES[
            sequenceId
        ];


    if (!sequence) {
        throw new Error(
            `Motion sequence "${sequenceId}" was not found.`
        );
    }


    return sequence;
}


// ============================================================
// APPLY FIRST POSE OF SEQUENCE
// ============================================================

/**
 * Utility function mainly useful for testing/debugging.
 *
 * Applies the first target pose in a sequence immediately,
 * without animation.
 */
function applyFirstSequencePose(
    importResult,
    avatarId,
    sequenceId,
    options = {}
) {
    validateRuntimeDependencies();


    const sequence =
        getMotionSequence(
            sequenceId
        );


    validateMotionSequence(
        sequence,
        sequenceId
    );


    const {
        nodeNames = undefined
    } = options;


    const includedNodes =
        nodeNames !== undefined
            ? nodeNames
            : (
                sequence.nodes ||
                null
            );


    return applyPose(
        importResult,
        avatarId,
        sequence.steps[0].pose,
        includedNodes
    );
}


// ============================================================
// STOP IMPORTED GLB ANIMATIONS
// ============================================================

/**
 * Stop animation groups imported with the GLB.
 *
 * Important because a GLB animation can otherwise keep writing
 * rotations to the same arm/leg nodes while our custom pose
 * animation is running.
 */
function stopAvatarAnimationGroups(
    importResult
) {
    for (
        const animationGroup
        of importResult?.animationGroups || []
    ) {
        animationGroup.stop();
    }
}


// ============================================================
// DELAY
// ============================================================

function delay(
    milliseconds
) {
    return new Promise(
        resolve => {
            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}


// ============================================================
// VALIDATE RUNTIME DEPENDENCIES
// ============================================================

function validateRuntimeDependencies() {
    if (
        typeof BABYLON ===
        "undefined"
    ) {
        throw new Error(
            "Babylon.js is not loaded."
        );
    }


    if (
        typeof getAvatarPose !==
        "function"
    ) {
        throw new Error(
            "getAvatarPose() was not found. " +
            "Load poseManager.js before animateAvatar.js."
        );
    }


    if (
        typeof applyPose !==
        "function"
    ) {
        throw new Error(
            "applyPose() was not found. " +
            "Load poseManager.js before animateAvatar.js."
        );
    }


    if (
        typeof animateToPose !==
        "function"
    ) {
        throw new Error(
            "animateToPose() was not found. " +
            "Load poseManager.js before animateAvatar.js."
        );
    }
}


// ============================================================
// VALIDATE MOTION SEQUENCE
// ============================================================

function validateMotionSequence(
    sequence,
    sequenceId
) {
    if (
        !sequence ||
        typeof sequence !==
            "object"
    ) {
        throw new Error(
            `Invalid motion sequence "${sequenceId}".`
        );
    }


    if (
        !Array.isArray(
            sequence.steps
        ) ||
        sequence.steps.length === 0
    ) {
        throw new Error(
            `Motion sequence "${sequenceId}" ` +
            "must contain at least one step."
        );
    }


    for (
        let i = 0;
        i <
            sequence.steps.length;
        i++
    ) {
        const step =
            sequence.steps[i];


        if (
            !step ||
            typeof step !==
                "object"
        ) {
            throw new Error(
                `Step ${i + 1} in motion sequence ` +
                `"${sequenceId}" is invalid.`
            );
        }


        validateRequiredString(
            step.pose,
            `pose in step ${i + 1}`
        );


        if (
            step.velocity !==
            undefined
        ) {
            validatePositiveNumber(
                step.velocity,
                `velocity in step ${i + 1}`
            );
        }


        if (
            step.holdMilliseconds !==
            undefined
        ) {
            validateNonNegativeNumber(
                step.holdMilliseconds,
                `holdMilliseconds in step ${i + 1}`
            );
        }
    }


    validateNodeNames(
        sequence.nodes ||
        null
    );
}


// ============================================================
// VALIDATE NODE NAMES
// ============================================================

function validateNodeNames(
    nodeNames
) {
    if (
        nodeNames === null
    ) {
        return;
    }


    if (
        !Array.isArray(
            nodeNames
        )
    ) {
        throw new Error(
            "nodeNames must be null or an array of logical node names."
        );
    }


    for (
        const nodeName
        of nodeNames
    ) {
        validateRequiredString(
            nodeName,
            "node name"
        );
    }
}


// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateRequiredString(
    value,
    name
) {
    if (
        typeof value !==
            "string" ||
        value.trim() === ""
    ) {
        throw new Error(
            `${name} must be a non-empty string.`
        );
    }
}


function validatePositiveNumber(
    value,
    name
) {
    if (
        !Number.isFinite(
            value
        ) ||
        value <= 0
    ) {
        throw new Error(
            `${name} must be a number greater than 0.`
        );
    }
}


function validateNonNegativeNumber(
    value,
    name
) {
    if (
        !Number.isFinite(
            value
        ) ||
        value < 0
    ) {
        throw new Error(
            `${name} must be a number greater than or equal to 0.`
        );
    }
}


function validateOptionalCallback(
    callback,
    name
) {
    if (
        callback !== null &&
        typeof callback !==
            "function"
    ) {
        throw new Error(
            `${name} must be null or a function.`
        );
    }
}


// ============================================================
// UNIQUE STRING LIST
// ============================================================

function uniqueStrings(
    values
) {
    return [
        ...new Set(
            values.filter(
                value =>
                    typeof value ===
                    "string"
            )
        )
    ];
}
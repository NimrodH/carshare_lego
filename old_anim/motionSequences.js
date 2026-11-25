// Loaded as a plain (non-module) script, so MOTION_SEQUENCES is exposed as a global.
const MOTION_SEQUENCES = {
    wave: {
        id: "wave",

        steps: [
            {
                pose: "handRaised",
                velocity: 70
            },
            {
                pose: "handLeft",
                velocity: 100
            },
            {
                pose: "handRight",
                velocity: 100
            },
            {
                pose: "handLeft",
                velocity: 100
            },
            {
                pose: "handRight",
                velocity: 100
            },
            {
                pose: "neutral",
                velocity: 70
            }
        ],

        nodes: [
            "leftArm",
            "leftForeArm"
        ]
    },

    pointThenRest: {
        id: "pointThenRest",

        steps: [
            {
                pose: "pointing",
                velocity: 60,
                holdMilliseconds: 1000
            },
            {
                pose: "neutral",
                velocity: 45
            }
        ],

        nodes: [
            "leftArm",
            "leftForeArm"
        ]
    }
};
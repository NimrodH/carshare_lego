// avatarStateClips.js
//
// Loaded as a plain (non-module) script, so AVATAR_STATE_CLIPS is a global.
// Which Ready Player Me clips (see RPM_CLIP_CATALOG in avatarClips.js) each
// avatar state plays; avatarStateAnimator.js runs them.
//
// Clip names are written WITHOUT the gender prefix: "_Dances_001" plays
// F_Dances_001 on a woman and M_Dances_001 on a man. If the gender has no clip
// with that name, the other prefix is used from the same gender's folder (the
// library has only M_Standing_Expressions_*, fitted to both skeletons).
// Case does not matter, and "*" matches anything ("_Talking_Variations_*").
//
// Each state runs these steps, in this order, skipping the ones it doesn't have:
//     turnBefore: "center"                          - turn to face the center of the circle
//                 { degrees: 45, randomSide: true } - turn this far away from the center,
//                                                     to the left or right at random
//     play: "one"  - pick ONE of `clips` at random and play it once
//           "hold" - freeze the avatar in the first frame of one of `clips`
//           "loop" - keep playing `clips` one after the other in random order
//                    (never the same clip twice in a row) until the state changes
//     then: "walkIn"   - walk towards the viewer: to the center when the camera is
//                        there, otherwise half the way to the camera
//           "walkHome" - walk back to the avatar's place and face the center
//     turnAfter: same values as turnBefore
//     holdSign: true  - before anything else, take the sign off the avatar so it keeps
//                       facing the center while the avatar turns; it goes back on the
//                       avatar the next time the avatar turns to face the center
//     next: "<state>"  - continue with this state

const AVATAR_STATE_CLIPS = {
    // Every avatar, until it gets a user (and so avatars never show the bind pose)
    standing: { play: "hold", clips: ["_Standing_Idle_001"] },

    // Ready and waiting to get a call (also right after the avatar gets its user)
    waiting: { play: "loop", clips: ["_Standing_Idle_*"] },

    // The camera points at the avatar while it waits
    lookedAt: {
        play: "one",
        clips: ["_Standing_Expressions_001", "_Standing_Expressions_010"],
        next: "waiting"
    },

    // Clicked, going to start the call with me: walks in right away (no clip first)
    accepted: {
        then: "walkIn",
        next: "talking"
    },

    // During the call with me
    talking: { play: "loop", clips: ["_Talking_Variations_*"] },

    // End of the talk when we both agreed
    endAgree: {
        play: "one",
        clips: ["_Dances_001"],
        then: "walkHome",
        next: "waiting"
    },

    // End of the talk when we didn't agree
    endNoAgree: {
        play: "one",
        clips: ["_Standing_Expressions_005", "_Standing_Expressions_011"],
        then: "walkHome",
        next: "waiting"
    },

    // Busy in a call with someone else
    busy: {
        turnBefore: { degrees: 45, randomSide: true },
        play: "loop",
        clips: ["_Talking_Variations_*"]
    },

    // The call with someone else finished
    busyEnd: { turnBefore: "center", next: "waiting" },

    // The user left (status "done"): turn the back to the center
    // (the sign stays facing the center until the avatar turns back to it)
    left: { holdSign: true, turnBefore: { degrees: 180 }, play: "loop", clips: ["_Standing_Idle_*"] },

    // The user came back with the same ID: face the center again
    returned: { turnBefore: "center", next: "waiting" }
};

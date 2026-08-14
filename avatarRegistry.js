// avatarRegistry.js
// Loaded as a plain (non-module) script, like avatar.js/message.js/world.js,
// so everything here is exposed as a global.

// ============================================================
// DEFAULT NODE NAMES
// ============================================================
// Rig node names used for arm posing (wired up in a later change).

const DEFAULT_AVATAR_NODES = {
    leftArm: "LeftArm",
    leftForeArm: "LeftForeArm",
    rightArm: "RightArm",
    rightForeArm: "RightForeArm"
};


// ============================================================
// AVATAR REGISTRY
// ============================================================
// Migrated from index.html's avatarsDataArray. "num" is kept as-is since
// avatar.js uses it (num % 2) to pick the man/woman GLB for a given slot.

const AVATARS = {
    avatar8: {
        id: "avatar8",
        num: 8,
        avatarURL: "Avatars/weman/67ff3e3113b3fb7e8ab511f1.glb",
        avatarURLBoy: "Avatars/Mans/6800943a31f1c6f08b68bf21.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -0.627905,
        y: 0.0,
        z: 5.97153
    },

    avatar9: {
        id: "avatar9",
        num: 9,
        avatarURL: "Avatars/weman/67ff3f4564ce38bc90b4529c.glb",
        avatarURLBoy: "Avatars/Mans/6800a94a679b181682ce3dd0.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -1.854102,
        y: 0.0,
        z: 5.707107
    },

    avatar6: {
        id: "avatar6",
        num: 6,
        avatarURL: "Avatars/weman/67ff3cdb31f1c6f08b4b7ba1.glb",
        avatarURLBoy: "Avatars/Mans/67ff3fa56026f5144da78008.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 1.854102,
        y: 0.0,
        z: 5.707107
    },

    avatar5: {
        id: "avatar5",
        num: 5,
        avatarURL: "Avatars/weman/67ff3c7356f46e3036a894b7.glb",
        avatarURLBoy: "Avatars/Mans/67ff3e9c31f1c6f08b4b9823.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 3.0,
        y: 0.0,
        z: 5.196153
    },

    avatar4: {
        id: "avatar4",
        num: 4,
        avatarURL: "Avatars/weman/67ff3c0613b3fb7e8ab4e847.glb",
        avatarURLBoy: "Avatars/Mans/67ff3db06026f5144da76157.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 4.014784,
        y: 0.0,
        z: 4.458869
    },

    avatar7: {
        id: "avatar7",
        num: 7,
        avatarURL: "Avatars/weman/67ff3d5e6026f5144da75c16.glb",
        avatarURLBoy: "Avatars/Mans/67ff408770502e5738dbd130.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 0.627905,
        y: 0.0,
        z: 5.97153
    },

    avatar22: {
        id: "avatar22",
        num: 22,
        avatarURL: "Avatars/weman/67ffb72c56f46e3036ae5ba4.glb",
        avatarURLBoy: "Avatars/Mans/6800ad6613b3fb7e8ad30ba2.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -0.627905,
        y: 0.0,
        z: -5.97153
    },

    avatar18: {
        id: "avatar18",
        num: 18,
        avatarURL: "Avatars/weman/6800e47031f1c6f08b6b594e.glb",
        avatarURLBoy: "Avatars/Mans/6800b08cca0bde41411e412b.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -4.854102,
        y: 0.0,
        z: -3.526712
    },

    avatar16: {
        id: "avatar16",
        num: 16,
        avatarURL: "Avatars/weman/6800e37231f1c6f08b6b4cfb.glb",
        avatarURLBoy: "Avatars/Mans/6800af64d620f895205e7416.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -5.868886,
        y: 0.0,
        z: -1.24747
    },

    avatar2: {
        id: "avatar2",
        num: 2,
        avatarURL: "Avatars/weman/67ff38df13b3fb7e8ab49874.glb",
        avatarURLBoy: "Avatars/Mans/67ff3bc270502e5738db802b.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 5.481273,
        y: 0.0,
        z: 2.44042
    },

    avatar13: {
        id: "avatar13",
        num: 13,
        avatarURL: "Avatars/weman/6800a816d620f895205e32fe.glb",
        avatarURLBoy: "Avatars/Mans/6800ade66026f5144dc56e9f.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -5.481273,
        y: 0.0,
        z: 2.44042
    },

    avatar1: {
        id: "avatar1",
        num: 1,
        avatarURL: "Avatars/weman/67ff35cc679b181682af9337.glb",
        avatarURLBoy: "Avatars/Mans/67ff3b6df84012b508258a62.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 5.868886,
        y: 0.0,
        z: 1.24747
    },

    avatar28: {
        id: "avatar28",
        num: 28,
        avatarURL: "Avatars/weman/6800e47031f1c6f08b6b594e.glb",
        avatarURLBoy: "Avatars/Mans/6800b08cca0bde41411e412b.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 5.481273,
        y: 0.0,
        z: -2.44042
    },

    avatar24: {
        id: "avatar24",
        num: 24,
        avatarURL: "Avatars/weman/6800e2b5679b181682d01664.glb",
        avatarURLBoy: "Avatars/Mans/6800ae66647a08a2e396ced2.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 1.854102,
        y: 0.0,
        z: -5.707107
    },

    avatar27: {
        id: "avatar27",
        num: 27,
        avatarURL: "Avatars/weman/6800e3e5679b181682d023fb.glb",
        avatarURLBoy: "Avatars/Mans/6800afff647a08a2e396dacc.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 4.854102,
        y: 0.0,
        z: -3.526712
    },

    avatar0: {
        id: "avatar0",
        num: 0,
        avatarURL: "Avatars/weman/67ff2fec30c4def57986509d.glb",
        avatarURLBoy: "Avatars/Mans/67ff3aab70502e5738db65bc.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 6.0,
        y: 0.0,
        z: 0.0
    },

    avatar23: {
        id: "avatar23",
        num: 23,
        avatarURL: "Avatars/weman/6800a816d620f895205e32fe.glb",
        avatarURLBoy: "Avatars/Mans/6800ade66026f5144dc56e9f.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 0.627905,
        y: 0.0,
        z: -5.97153
    },

    avatar19: {
        id: "avatar19",
        num: 19,
        avatarURL: "Avatars/weman/67ff3e3113b3fb7e8ab511f1.glb",
        avatarURLBoy: "Avatars/Mans/6800b12fca0bde41411e45cf.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -4.014784,
        y: 0.0,
        z: -4.458869
    },

    avatar26: {
        id: "avatar26",
        num: 26,
        avatarURL: "Avatars/weman/6800e37231f1c6f08b6b4cfb.glb",
        avatarURLBoy: "Avatars/Mans/6800af64d620f895205e7416.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 4.014784,
        y: 0.0,
        z: -4.458869
    },

    avatar11: {
        id: "avatar11",
        num: 11,
        avatarURL: "Avatars/weman/67ffb6a070502e5738e148e4.glb",
        avatarURLBoy: "Avatars/Mans/6800acf031f1c6f08b698e9c.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -4.014784,
        y: 0.0,
        z: 4.458869
    },

    avatar3: {
        id: "avatar3",
        num: 3,
        avatarURL: "Avatars/weman/67ff39f4679b181682b011df.glb",
        avatarURLBoy: "Avatars/Mans/67ff3d1579474b7a6c733b4a.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 4.854102,
        y: 0.0,
        z: 3.526712
    },

    avatar20: {
        id: "avatar20",
        num: 20,
        avatarURL: "Avatars/weman/67ff40e86026f5144da79084.glb",
        avatarURLBoy: "Avatars/Mans/6800ac856026f5144dc56345.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -3.0,
        y: 0.0,
        z: -5.196153
    },

    avatar29: {
        id: "avatar29",
        num: 29,
        avatarURL: "Avatars/weman/67ff3e3113b3fb7e8ab511f1.glb",
        avatarURLBoy: "Avatars/Mans/6800b12fca0bde41411e45cf.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 5.868886,
        y: 0.0,
        z: -1.24747
    },

    avatar21: {
        id: "avatar21",
        num: 21,
        avatarURL: "Avatars/weman/67ffb6a070502e5738e148e4.glb",
        avatarURLBoy: "Avatars/Mans/6800acf031f1c6f08b698e9c.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -1.854102,
        y: 0.0,
        z: -5.707107
    },

    avatar25: {
        id: "avatar25",
        num: 25,
        avatarURL: "Avatars/weman/6800e2fa79474b7a6c9303c1.glb",
        avatarURLBoy: "Avatars/Mans/6800aedb679b181682ce70f0.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: 3.0,
        y: 0.0,
        z: -5.196153
    },

    avatar12: {
        id: "avatar12",
        num: 12,
        avatarURL: "Avatars/weman/67ffb72c56f46e3036ae5ba4.glb",
        avatarURLBoy: "Avatars/Mans/6800ad6613b3fb7e8ad30ba2.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -4.854102,
        y: 0.0,
        z: 3.526712
    },

    avatar17: {
        id: "avatar17",
        num: 17,
        avatarURL: "Avatars/weman/6800e3e5679b181682d023fb.glb",
        avatarURLBoy: "Avatars/Mans/6800afff647a08a2e396dacc.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -5.481273,
        y: 0.0,
        z: -2.44042
    },

    avatar10: {
        id: "avatar10",
        num: 10,
        avatarURL: "Avatars/weman/67ff40e86026f5144da79084.glb",
        avatarURLBoy: "Avatars/Mans/6800ac856026f5144dc56345.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -3.0,
        y: 0.0,
        z: 5.196153
    },

    avatar15: {
        id: "avatar15",
        num: 15,
        avatarURL: "Avatars/weman/6800e2fa79474b7a6c9303c1.glb",
        avatarURLBoy: "Avatars/Mans/6800aedb679b181682ce70f0.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -6.0,
        y: 0.0,
        z: 0.0
    },

    avatar14: {
        id: "avatar14",
        num: 14,
        avatarURL: "Avatars/weman/6800e2b5679b181682d01664.glb",
        avatarURLBoy: "Avatars/Mans/6800ae66647a08a2e396ced2.glb",
        isUsed: false,
        targetX: 0.0,
        targetY: 0.0,
        targetZ: 0.0,
        x: -5.868886,
        y: 0.0,
        z: 1.24747
    }
};


// ============================================================
// GET FINAL NODE NAMES
// ============================================================

function getAvatarNodes(avatarId) {
    const avatar = AVATARS[avatarId];

    if (!avatar) {
        throw new Error(`Unknown avatar ID: "${avatarId}".`);
    }

    return {
        ...DEFAULT_AVATAR_NODES,
        ...(avatar.nodeOverrides || {})
    };
}


// ============================================================
// GET COMPLETE AVATAR DEFINITION
// ============================================================

function getAvatarDefinition(avatarId) {
    const avatar = AVATARS[avatarId];

    if (!avatar) {
        throw new Error(`Unknown avatar ID: "${avatarId}".`);
    }

    return {
        ...avatar,
        nodes: getAvatarNodes(avatarId)
    };
}


// ============================================================
// GET ALL AVATAR DEFINITIONS (replaces index.html's avatarsDataArray)
// ============================================================

function getAllAvatarDefinitions() {
    return Object.keys(AVATARS).map(avatarId => getAvatarDefinition(avatarId));
}
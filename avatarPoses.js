// Loaded as a plain (non-module) script, so AVATAR_POSES is exposed as a global.
const AVATAR_POSES = {
    // Fallback poses used when a specific avatar doesn't define a given pose id.
    default: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.610244,
                        y: -0.209134,
                        z: 0.21451,
                        w: 0.733383
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -15,
                        z: 20
                    }
                },
                leftForeArm: {
                    quaternion: {
                        x: 0.63682,
                        y: -0.094633,
                        z: 0.089257,
                        w: 0.759959
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -10,
                        z: 5
                    }
                }
            }
        },
        handRaised: {
            id: "handRaised",
            label: "Left hand raised",

            rotations: {

            }
        },
        pointing: {
            id: "pointing",
            label: "Pointing pose",

            rotations: {

            }
        },
        poseName1: {
            id: "poseName1",
            label: "pose description",

            rotations: {

            }
        },
        poseName2: {
            id: "poseName2",
            label: "pose description",

            rotations: {

            }
        },
        poseName3: {
            id: "poseName3",
            label: "pose description",

            rotations: {

            }
        },
        poseName4: {
            id: "poseName",
            label: "pose description",

            rotations: {

            }
        },
    },

    avatar1: {
        handRaised: {
            id: "handRaised",
            label: "Left hand raised",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 1
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 1
                    }
                }
            }
        },

        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.51455,
                        y: 0.136873,
                        z: 0.017816,
                        w: 0.846279
                    },

                    eulerDegrees: {
                        x: 60,
                        y: 30,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.1,
                        y: 0.2,
                        z: 0.05,
                        w: 0.973
                    },

                    eulerDegrees: {
                        x: 13.122,
                        y: 22.393,
                        z: 8.278
                    }
                }
            }
        },

        pointing: {
            id: "pointing",
            label: "Pointing pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.3,
                        y: 0.25,
                        z: 0.1,
                        w: 0.914
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.2,
                        y: 0.35,
                        z: 0.08,
                        w: 0.912
                    }
                }
            }
        }
    },

    avatar2: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",
            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0,
                        y: 0,
                        z: 0,
                        w: 1
                    }
                }
            }
        }
    }
};
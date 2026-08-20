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
        pointing: {
            id: "pointing",
            label: "Pointing pose",

            rotations: {

            }
        },
        handOnBally: {
            id: "handOnBally",
            label: "Hand on bally",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },
                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        },
        handOnBack: {
            id: "handOnBack",
            label: "Hand on back",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        },
        raiseHand: {
            id: "raiseHand",
            label: "Raise hand",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },
                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        },

    },

    avatar1: {
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
        }
    },

    avatar3: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar4: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar5: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        }
    },

    avatar6: {
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
        }
    },

    avatar7: {
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
        }
    },

    avatar9: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar10: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar11: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        }
    },

    avatar12: {
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
        }
    },

    avatar13: {
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
        }
    },

    avatar15: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar16: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar17: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        }
    },

    avatar18: {
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
        }
    },

    avatar19: {
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
        }
    },

    avatar21: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar22: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar23: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        }
    },

    avatar24: {
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
        }
    },

    avatar25: {
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
        }
    },


    avatar27: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.600306,
                        y: -0.240924,
                        z: 0.240924,
                        w: 0.723563
                    },

                    eulerDegrees: {
                        x: 80,
                        y: -20,
                        z: 20
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar28: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.514548,
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
                        x: 0.610164,
                        y: -0.016027,
                        z: -0.016027,
                        w: 0.791951
                    },

                    eulerDegrees: {
                        x: 75,
                        y: -10,
                        z: -10
                    }
                }
            }
        }
    },

    avatar29: {
        neutral: {
            id: "neutral",
            label: "Neutral pose",

            rotations: {
                leftArm: {
                    quaternion: {
                        x: 0.538986,
                        y: -0.280166,
                        z: 0.196175,
                        w: 0.769751
                    },

                    eulerDegrees: {
                        x: 70,
                        y: -40,
                        z: 0
                    }
                },

                leftForeArm: {
                    quaternion: {
                        x: 0.173648,
                        y: 0,
                        z: 0,
                        w: 0.984808
                    },

                    eulerDegrees: {
                        x: 20,
                        y: 0,
                        z: 0
                    }
                }
            }
        }
    },

    avatar30: {
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
        }
    }
};
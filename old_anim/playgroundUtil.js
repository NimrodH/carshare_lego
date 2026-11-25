export const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.5,
        3,
        BABYLON.Vector3.Zero(),
        scene
    );

    camera.attachControl(canvas, true);

    new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );

    // ============================================================
    // POSE EXPORT CONFIGURATION
    // ============================================================

    /*
     * logicalName:
     * The property name used in the pose library.
     *
     * transformNodeName:
     * The actual transform-node name inside the loaded GLB.
     *
     * Add any number of nodes here.
     */
    const POSE_NODES_TO_PRINT = [
        {
            logicalName: "leftArm",
            transformNodeName: "LeftArm"
        },
        {
            logicalName: "leftForeArm",
            transformNodeName: "LeftForeArm"
        }
    ];

    /*
     * Placeholder values used in the printed pose object.
     *
     * You can replace them here before printing, or change them
     * after copying the generated object into your pose store.
     */
    const EXPORTED_POSE_ID = "replacePoseId";
    const EXPORTED_POSE_LABEL = "Replace pose label";

    // ============================================================
    // RUNTIME STATE
    // ============================================================

    let loadedAvatarResult = null;
    let loadedAvatarFileName = null;

    // ============================================================
    // HIDDEN HTML FILE INPUT
    // ============================================================

    const fileInput = document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = ".glb";
    fileInput.style.display = "none";

    document.body.appendChild(fileInput);

    // ============================================================
    // BABYLON GUI
    // ============================================================

    const advancedTexture =
        BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "UI",
            true,
            scene
        );

    const buttonPanel = new BABYLON.GUI.StackPanel(
        "buttonPanel"
    );

    buttonPanel.width = "280px";
    buttonPanel.isVertical = true;

    buttonPanel.horizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    buttonPanel.verticalAlignment =
        BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    buttonPanel.left = "20px";
    buttonPanel.top = "20px";

    advancedTexture.addControl(buttonPanel);

    const loadButton = createGuiButton(
        "loadGlbButton",
        "Select GLB Avatar",
        "#2474d2"
    );

    buttonPanel.addControl(loadButton);

    const printPoseButton = createGuiButton(
        "printPoseButton",
        "Print Current Pose",
        "#278447"
    );

    printPoseButton.paddingTop = "10px";
    setButtonEnabled(printPoseButton, false);

    buttonPanel.addControl(printPoseButton);

    const statusText = new BABYLON.GUI.TextBlock(
        "statusText",
        "No avatar loaded"
    );

    statusText.width = "270px";
    statusText.height = "100px";
    statusText.paddingTop = "12px";
    statusText.color = "white";
    statusText.fontSize = 14;
    statusText.textWrapping = true;

    statusText.textHorizontalAlignment =
        BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    buttonPanel.addControl(statusText);

    // ============================================================
    // GUI HELPERS
    // ============================================================

    function createGuiButton(
        name,
        text,
        background
    ) {
        const button =
            BABYLON.GUI.Button.CreateSimpleButton(
                name,
                text
            );

        button.width = "260px";
        button.height = "50px";
        button.color = "white";
        button.background = background;
        button.cornerRadius = 8;
        button.thickness = 1;
        button.fontSize = 18;

        return button;
    }

    function setButtonEnabled(
        button,
        enabled
    ) {
        button.isEnabled = enabled;
        button.alpha = enabled ? 1 : 0.5;
    }

    // ============================================================
    // LOAD GLB
    // ============================================================

    loadButton.onPointerClickObservable.add(
        function () {
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        "change",
        async function () {
            const file = fileInput.files?.[0];

            if (!file) {
                return;
            }

            try {
                loadButton.isEnabled = false;
                loadButton.alpha = 0.7;
                loadButton.textBlock.text = "Loading...";

                setButtonEnabled(
                    printPoseButton,
                    false
                );

                statusText.text =
                    "Loading avatar...";

                const result =
                    await BABYLON.SceneLoader.ImportMeshAsync(
                        "",
                        "",
                        file,
                        scene,
                        undefined,
                        ".glb"
                    );

                loadedAvatarResult = result;
                loadedAvatarFileName = file.name;

                /*
                 * Frame only the newly loaded avatar.
                 */
                camera.zoomOn(result.meshes);

                loadButton.textBlock.text =
                    "Select Another GLB";

                setButtonEnabled(
                    printPoseButton,
                    true
                );

                statusText.text =
                    `Loaded: ${file.name}\n` +
                    `${result.transformNodes.length} transform nodes`;

                console.log(
                    "Loaded GLB:",
                    file.name
                );

                console.log(
                    "Import result:",
                    result
                );

                console.log(
                    "Meshes:",
                    result.meshes
                );

                console.log(
                    "Transform nodes:",
                    result.transformNodes
                );

                console.log(
                    "Skeletons:",
                    result.skeletons
                );

                console.log(
                    "Animation groups:",
                    result.animationGroups
                );

                printAvailableTransformNodeNames(
                    result
                );
            } catch (error) {
                console.error(
                    "GLB loading failed:",
                    error
                );

                loadedAvatarResult = null;
                loadedAvatarFileName = null;

                loadButton.textBlock.text =
                    "Select GLB Avatar";

                setButtonEnabled(
                    printPoseButton,
                    false
                );

                statusText.text =
                    "GLB loading failed";

                alert(
                    "The GLB file could not be loaded."
                );
            } finally {
                loadButton.isEnabled = true;
                loadButton.alpha = 1;

                /*
                 * Allows selecting the same file again.
                 */
                fileInput.value = "";
            }
        }
    );

    // ============================================================
    // PRINT CURRENT POSE
    // ============================================================

    printPoseButton.onPointerClickObservable.add(
        function () {
            if (!loadedAvatarResult) {
                console.warn(
                    "Load an avatar before printing its pose."
                );

                return;
            }

            const exportedPose =
                createPoseStoreObject(
                    loadedAvatarResult,
                    POSE_NODES_TO_PRINT,
                    EXPORTED_POSE_ID,
                    EXPORTED_POSE_LABEL
                );

            console.log(
                "Generated pose object:"
            );

            console.log(exportedPose);

            /*
             * JSON output is easy to copy, although property names
             * will appear inside quotation marks.
             */
            console.log(
                "Copyable JSON pose object:\n" +
                JSON.stringify(
                    exportedPose,
                    null,
                    4
                )
            );

            /*
             * JavaScript-style output can be pasted more naturally
             * inside a JavaScript pose-library object.
             */
            console.log(
                "Copyable JavaScript pose object:\n" +
                formatPoseAsJavaScript(
                    exportedPose,
                    EXPORTED_POSE_ID
                )
            );

            const generatedPose =
                exportedPose[EXPORTED_POSE_ID];

            const foundCount =
                Object.keys(
                    generatedPose.rotations
                ).length;

            statusText.text =
                `Printed ${foundCount}/` +
                `${POSE_NODES_TO_PRINT.length} nodes.\n` +
                `Source: ${loadedAvatarFileName}\n` +
                "Open the browser console to copy the pose.";
        }
    );

    // ============================================================
    // CREATE POSE-STORE OBJECT
    // ============================================================

    /**
     * Creates an object that can be copied directly into the
     * poses section of the pose library.
     *
     * Example result:
     *
     * {
     *     replacePoseId: {
     *         id: "replacePoseId",
     *         label: "Replace pose label",
     *         rotations: {
     *             leftArm: {
     *                 quaternion: { ... },
     *                 eulerDegrees: { ... }
     *             }
     *         }
     *     }
     * }
     */
    function createPoseStoreObject(
        importResult,
        poseNodeDefinitions,
        poseId,
        poseLabel
    ) {
        validatePoseExportConfiguration(
            poseNodeDefinitions,
            poseId,
            poseLabel
        );

        const rotations = {};
        const missingNodes = [];

        for (
            const definition
            of poseNodeDefinitions
        ) {
            const logicalName =
                definition.logicalName.trim();

            const transformNodeName =
                definition.transformNodeName.trim();

            const node = findTransformNode(
                importResult.transformNodes,
                transformNodeName
            );

            if (!node) {
                const missingNode = {
                    logicalName,
                    transformNodeName
                };

                missingNodes.push(
                    missingNode
                );

                console.warn(
                    `Transform node "${transformNodeName}" ` +
                    `for logical node "${logicalName}" was not found.`
                );

                continue;
            }

            const quaternion =
                getNodeLocalQuaternion(node);

            /*
             * Babylon returns Euler angles in radians.
             */
            const eulerRadians =
                quaternion.toEulerAngles();

            rotations[logicalName] = {
                quaternion: {
                    x: roundNumber(
                        quaternion.x
                    ),
                    y: roundNumber(
                        quaternion.y
                    ),
                    z: roundNumber(
                        quaternion.z
                    ),
                    w: roundNumber(
                        quaternion.w
                    )
                },

                eulerDegrees: {
                    x: roundNumber(
                        BABYLON.Tools.ToDegrees(
                            eulerRadians.x
                        )
                    ),

                    y: roundNumber(
                        BABYLON.Tools.ToDegrees(
                            eulerRadians.y
                        )
                    ),

                    z: roundNumber(
                        BABYLON.Tools.ToDegrees(
                            eulerRadians.z
                        )
                    )
                }
            };
        }

        if (missingNodes.length > 0) {
            console.warn(
                "Pose nodes that were not exported:",
                missingNodes
            );
        }

        return {
            [poseId]: {
                id: poseId,
                label: poseLabel,
                rotations
            }
        };
    }

    // ============================================================
    // EXPORT VALIDATION
    // ============================================================

    function validatePoseExportConfiguration(
        poseNodeDefinitions,
        poseId,
        poseLabel
    ) {
        if (
            typeof poseId !== "string" ||
            poseId.trim() === ""
        ) {
            throw new Error(
                "EXPORTED_POSE_ID must be a non-empty string."
            );
        }

        if (
            typeof poseLabel !== "string" ||
            poseLabel.trim() === ""
        ) {
            throw new Error(
                "EXPORTED_POSE_LABEL must be a non-empty string."
            );
        }

        if (
            !Array.isArray(
                poseNodeDefinitions
            ) ||
            poseNodeDefinitions.length === 0
        ) {
            throw new Error(
                "POSE_NODES_TO_PRINT must contain at least one node definition."
            );
        }

        const logicalNames =
            new Set();

        for (
            const definition
            of poseNodeDefinitions
        ) {
            if (
                typeof definition?.logicalName !==
                    "string" ||
                definition.logicalName.trim() === ""
            ) {
                throw new Error(
                    "Every pose-node definition must have a non-empty logicalName."
                );
            }

            if (
                typeof definition?.transformNodeName !==
                    "string" ||
                definition.transformNodeName.trim() === ""
            ) {
                throw new Error(
                    `The pose-node definition "${definition.logicalName}" ` +
                    "must have a non-empty transformNodeName."
                );
            }

            const normalizedLogicalName =
                definition.logicalName
                    .trim()
                    .toLowerCase();

            if (
                logicalNames.has(
                    normalizedLogicalName
                )
            ) {
                throw new Error(
                    `Duplicate logical node name: ` +
                    `"${definition.logicalName}".`
                );
            }

            logicalNames.add(
                normalizedLogicalName
            );
        }
    }

    // ============================================================
    // NODE HELPERS
    // ============================================================

    /**
     * Finds a transform node first by exact name and then by a
     * case-insensitive comparison.
     */
    function findTransformNode(
        transformNodes,
        requestedName
    ) {
        const exactMatch =
            transformNodes.find(
                node =>
                    node.name ===
                    requestedName
            );

        if (exactMatch) {
            return exactMatch;
        }

        const normalizedName =
            requestedName
                .trim()
                .toLowerCase();

        return (
            transformNodes.find(
                node =>
                    node.name
                        .trim()
                        .toLowerCase() ===
                    normalizedName
            ) || null
        );
    }

    /**
     * Gets the node's local rotation as a normalized quaternion.
     *
     * GLB transform nodes normally use rotationQuaternion.
     * The Euler fallback handles nodes that use node.rotation.
     */
    function getNodeLocalQuaternion(node) {
        if (node.rotationQuaternion) {
            return node
                .rotationQuaternion
                .clone()
                .normalize();
        }

        return BABYLON.Quaternion
            .FromEulerVector(
                node.rotation
            )
            .normalize();
    }

    function printAvailableTransformNodeNames(
        importResult
    ) {
        const names =
            importResult.transformNodes.map(
                node => node.name
            );

        console.log(
            "Available transform-node names:\n" +
            names.join("\n")
        );
    }

    // ============================================================
    // OUTPUT FORMATTING
    // ============================================================

    /**
     * Produces JavaScript-style output with unquoted property keys
     * when the key is a valid JavaScript identifier.
     */
    function formatPoseAsJavaScript(
        exportedPose,
        poseId
    ) {
        const pose =
            exportedPose[poseId];

        const lines = [];

        lines.push(
            `${formatPropertyKey(poseId)}: {`
        );

        lines.push(
            `    id: ${JSON.stringify(pose.id)},`
        );

        lines.push(
            `    label: ${JSON.stringify(pose.label)},`
        );

        lines.push("");
        lines.push("    rotations: {");

        const rotationEntries =
            Object.entries(
                pose.rotations
            );

        rotationEntries.forEach(
            (
                [
                    logicalName,
                    rotation
                ],
                index
            ) => {
                lines.push(
                    `        ${formatPropertyKey(logicalName)}: {`
                );

                lines.push(
                    "            quaternion: {"
                );

                lines.push(
                    `                x: ${rotation.quaternion.x},`
                );

                lines.push(
                    `                y: ${rotation.quaternion.y},`
                );

                lines.push(
                    `                z: ${rotation.quaternion.z},`
                );

                lines.push(
                    `                w: ${rotation.quaternion.w}`
                );

                lines.push(
                    "            },"
                );

                lines.push("");

                lines.push(
                    "            eulerDegrees: {"
                );

                lines.push(
                    `                x: ${rotation.eulerDegrees.x},`
                );

                lines.push(
                    `                y: ${rotation.eulerDegrees.y},`
                );

                lines.push(
                    `                z: ${rotation.eulerDegrees.z}`
                );

                lines.push(
                    "            }"
                );

                const isLastEntry =
                    index ===
                    rotationEntries.length - 1;

                lines.push(
                    isLastEntry
                        ? "        }"
                        : "        },"
                );
            }
        );

        lines.push("    }");
        lines.push("},");

        return lines.join("\n");
    }

    function formatPropertyKey(key) {
        const validIdentifier =
            /^[A-Za-z_$][A-Za-z0-9_$]*$/;

        return validIdentifier.test(key)
            ? key
            : JSON.stringify(key);
    }

    // ============================================================
    // GENERAL HELPERS
    // ============================================================

    function roundNumber(
        value,
        decimalPlaces = 6
    ) {
        const rounded = Number(
            value.toFixed(
                decimalPlaces
            )
        );

        /*
         * Prevent values such as -0 from being printed.
         */
        return Object.is(
            rounded,
            -0
        )
            ? 0
            : rounded;
    }

    // ============================================================
    // CLEANUP
    // ============================================================

    scene.onDisposeObservable.add(
        function () {
            fileInput.remove();
        }
    );

    return scene;
};

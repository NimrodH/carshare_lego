

///////////////// SELF-CONTAINED LEGO BUILDING HELPERS (for avatarType A) /////////////////
/// index.html does not load lego1.js, so avatar.js cannot rely on its global
/// functions/variables (meshBlock, elementsMenu, menuY, colorName2Vector, ...).
/// These local equivalents mirror the geometry/colors/rotations from lego1.js
/// so avatars built from stored model data (created in the lego app) match exactly.

const legoBaseColor = new BABYLON.Color3(0.54, 0.13, 0.54);
const legoNotSelectedColor = new BABYLON.Color3(1, 0, 1);
const legoBlueColor = new BABYLON.Color3(0, 0, 1);
const legoRedColor = new BABYLON.Color3(1, 0, 0);
const legoBlackColor = new BABYLON.Color3(0, 0, 0);
const legoGreenColor = new BABYLON.Color3(0, 1, 0);
const legoRotationO = new BABYLON.Vector3(0, 0, 0);
const legoRotationX = new BABYLON.Vector3(1.5708, 0, 0);
const legoRotationY = new BABYLON.Vector3(0, 1.5708, 0);
const legoRotationZ = new BABYLON.Vector3(0, 0, 1.5708);

const legoColorsObj = [
    { colorName: "blue", colorVector: legoBlueColor },
    { colorName: "base", colorVector: legoBaseColor },
    { colorName: "red", colorVector: legoRedColor },
    { colorName: "green", colorVector: legoGreenColor },
    { colorName: "black", colorVector: legoBlackColor },
    { colorName: "notSelected", colorVector: legoNotSelectedColor }
];

function legoColorName2Vector(theColorName) {
    const found = legoColorsObj.filter(c => c.colorName == theColorName)[0];
    return found ? found.colorVector : legoBaseColor;
}

function legoRotationName2Vector(theName) {
    switch (theName) {
        case "X": return legoRotationX;
        case "Y": return legoRotationY;
        case "Z": return legoRotationZ;
        default: return legoRotationO;
    }
}

/// Add a connection sphere to a block/wheel, matching lego1.js naming ("p" + position)
function legoAddContactSphere(meshParent, meshPosition, scene) {
    let tempSphere = BABYLON.MeshBuilder.CreateSphere("p" + meshPosition, { diameter: 1.2 }, scene);
    tempSphere.parent = meshParent;
    tempSphere.position.x = meshPosition;
    const myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    myMaterial.diffuseColor = legoNotSelectedColor;
    tempSphere.material = myMaterial;
    return tempSphere;
}

/// Create a rectangular block, matching lego1.js meshBlock() geometry/connection points
function legoMeshBlock(scene, blockWidth) {
    const box = BABYLON.MeshBuilder.CreateBox("b" + blockWidth, { width: blockWidth, height: 1 }, scene);
    const myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    myMaterial.diffuseColor = legoBaseColor;
    box.material = myMaterial;
    const blockWidthFloor = Math.floor(blockWidth / 2);
    if (blockWidthFloor == blockWidth / 2) {
        for (let index = 0; index < blockWidthFloor; index++) {
            legoAddContactSphere(box, index - 0.5, scene);
            legoAddContactSphere(box, index + 0.5, scene);
        }
    } else {
        for (let index = 0; index < blockWidthFloor + 1; index++) {
            legoAddContactSphere(box, index, scene);
            if (index !== 0) {
                legoAddContactSphere(box, -index, scene);
            }
        }
    }
    return box;
}

/// Create a round element (wheel), matching lego1.js meshWheel() geometry
function legoMeshWheel(scene, wheelWidth) {
    const wheel = BABYLON.MeshBuilder.CreateCylinder("c" + wheelWidth, { height: 1, diameter: 2 }, scene);
    const myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    myMaterial.diffuseColor = legoBaseColor;
    wheel.material = myMaterial;
    wheel.rotation = legoRotationX;
    legoAddContactSphere(wheel, 0, scene);
    wheel.position.y = 1;
    return wheel;
}

/// Raise the whole hierarchy so its lowest point sits on y = 0
function legoSetOnGround(element) {
    element.refreshBoundingInfo();
    element.computeWorldMatrix(true);
    const boundingInfo = element.getHierarchyBoundingVectors();
    const lowerEdgePosition = boundingInfo.min.y;
    if (lowerEdgePosition != 0) {
        element.position.y = element.position.y - lowerEdgePosition;
    }
}

class Avatar {
    constructor(avatarData, world, avatarType) {
        this.myWorld = world;
        this.avatarData = avatarData; ///The data related to the avatar (differ then the user own it) see avatarsDataArray
        this.userData = {};///will be filled with data from signdata including name and avatarID (see debugUsersArray)
        this.statusData = {}; ///will be updated with the status of the avatar (noChat, myChat, inChat...)
        this.avatarMesh = null; ///the mesh of the avatar
        this.frontSign = null; ///the sign in front of the avatar (AvatarMessage)
        this.alreadyTalked = false;
        this.avatarType = avatarType; ///the type of the avatar (A for unSeen avatar)

        //console.log("Avatar ID: " + this.ID);
    }
    ///getters for the avatar data for old code compatibility
    get ID() {
        console.log("get avatar ID used")
        return this.userData.avatarID;
    }
    get userName() {
        return this.userData.userName;
    }
    get avatarID() {
        return this.userData.avatarID;
    }

    async matchUser(signData) {
        const planeSize = 0.85;
        const signX = 0;
        const signY = 0.55;
        const signZ = 0.18;
        this.userData = signData; ///The data related to the user (the one who own the avatar)
        //console.log("avatarMesh:", this.avatarMesh);
        
        // Create the avatar message sign in front of avatar
        this.frontSign = new AvatarMessage(planeSize, signX, signY, signZ, signData, this)
    }

    /// Helper function to fetch data directly (using lego_index.html pattern, not the gateway)
    async getModelData(url, data = {}) {
        try {
            const fullURL = url + '?' + new URLSearchParams(data);
            console.log("Fetching from:", fullURL);
            const response = await fetch(fullURL);
            return await response.json();
        } catch (error) {
            console.error("Error fetching model data:", error);
            return null;
        }
    }

    /// Create a lego avatar from the "man" model data
    async createLegoAvatar(scene) {
        try {
            // Use direct fetch to model database (same pattern as lego1.js)
            // Do NOT use the gateway - call the API directly
            const modelURL = 'https://9ewp86ps3e.execute-api.us-east-1.amazonaws.com/development/model';
            
            // Call direct getData with URL and data object
            let modelDataObj = await this.getModelData(modelURL, { 'myStep': 'ALL' });
            
            // Handle error if getData returns empty object
            if (!modelDataObj || !modelDataObj.Items) {
                console.warn("No model data returned from database");
                return null;
            }
            
            let allModelData = modelDataObj.Items;
            
            // Filter data for the "man" model
            let manModelData = allModelData.filter(x => x.modelName === "man");
            
            if (!manModelData || manModelData.length === 0) {
                console.warn("No 'man' model data found in database for creating lego avatar");
                return null;
            }
            
            // Create a base model for the avatar using self-contained lego helpers
            // (index.html does not load lego1.js, so we cannot rely on its globals)
            let avatarContainer = legoMeshBlock(scene, 1);
            avatarContainer.metadata = {
                inModel: true,
                blockNum: 0,
                numOfBlocks: 0,
                modelName: "man",
                modelTitle: "AvatarLego",
                isAvatarModel: true
            };
            
            // Rebuild the avatar model from stored data.
            // Build ALL stored steps so the avatar shows the complete "man" model
            // (matches reBuildModel() in lego1.js: for index = 1 to modelData.length).
            const maxBlocks = manModelData.length + 1;
            
            for (let index = 1; index < maxBlocks; index++) {
                const element = manModelData.filter(el => el.step == index)[0];
                if (!element) continue;
                
                let srcBlockName = element.type;
                let srcConnectionName = this.fullName2Private(element.srcPoint);
                
                // Create new block directly using self-contained lego helpers
                // Parse the block name to get the width (e.g., "b5" -> 5, "c1" -> wheel)
                let newElement;
                if (srcBlockName.startsWith('c')) {
                    // It's a wheel/cylinder
                    newElement = legoMeshWheel(scene, 1);
                } else {
                    // It's a block - extract the width from the name (e.g., "b5" -> 5)
                    let blockWidth = parseInt(srcBlockName.substring(1)) || 1;
                    newElement = legoMeshBlock(scene, blockWidth);
                }
                
                if (!newElement) continue;
                
                // Set orientation
                let newRotation = legoRotationName2Vector(element.rotation);
                newElement.rotation = newRotation;
                
                // Set color
                let newColor = legoColorName2Vector(element.color);
                
                // Connect to avatar model
                // destPoint is stored with a block-name prefix (e.g. "b5.p2"),
                // but the sphere itself is just named "p2" - strip the prefix
                // the same way srcPoint is handled, otherwise every step except
                // the one connecting to the base block (destBlock 0) fails to match.
                const destBlockNum = element.destBlock;
                const destPointName = this.fullName2Private(element.destPoint);
                
                let destSphere = this.getDestinationSphere(avatarContainer, destBlockNum, destPointName);
                if (!destSphere) continue;
                
                // Calculate connection position
                const matrix_sc = srcConnectionName;
                let newElementChildren = newElement.getChildren();
                let newElementConnection = newElementChildren.find(child => 
                    this.fullName2Private(child.name) === srcConnectionName
                );
                
                if (!newElementConnection) continue;
                
                const matrix_newElem = newElementConnection.parent.computeWorldMatrix(true);
                var global_pos_newElem = BABYLON.Vector3.TransformCoordinates(newElementConnection.position, matrix_newElem);
                const matrix_dest = destSphere.parent.computeWorldMatrix(true);
                var global_pos_dest = BABYLON.Vector3.TransformCoordinates(destSphere.position, matrix_dest);
                var global_delta = global_pos_dest.subtract(global_pos_newElem);
                
                // Move element to correct position
                newElement.setParent(null);
                let oldPos = newElement.position;
                let newPos = oldPos.add(global_delta);
                newElement.position = newPos;
                
                // Set material color
                newElement.material = new BABYLON.StandardMaterial("avatarMaterial", scene);
                newElement.material.diffuseColor = newColor;
                
                // Add to avatar container
                newElement.setParent(avatarContainer);
                
                // Update metadata
                newElement.metadata = {
                    inModel: true,
                    blockNum: index,
                    connection: newElementConnection.name,
                    connectedTo: destSphere.name,
                    destBlock: destSphere.parent.metadata.blockNum
                };
            }
            
            // Position avatar at ground level - use self-contained helper
            legoSetOnGround(avatarContainer);
            
            this.avatarMesh = avatarContainer;
            return avatarContainer;
            
        } catch (error) {
            console.error("Failed to create lego avatar:", error);
            return null;
        }
    }
    
    /// Helper function to get destination sphere by block number and point name
    getDestinationSphere(model, blockNumber, destPointName) {
        try {
            if (blockNumber === "0" || blockNumber === 0) {
                let children = model.getChildMeshes(false);
                if (children.length > 0) {
                    return children[0];
                }
                return null;
            }
            
            let modelBlocks = model.getChildMeshes(false);
            let destBlock = modelBlocks.find(b => 
                b.metadata && b.metadata.blockNum == blockNumber
            );
            
            if (!destBlock) return null;
            
            let spheres = destBlock.getChildMeshes(false);
            let selectedSphere = spheres.find(s => s.name === destPointName);
            
            return selectedSphere || null;
        } catch (e) {
            console.error("Error getting destination sphere:", e);
            return null;
        }
    }
    
    /// Helper function to convert full sphere name to private name (e.g., "b2.p-0.5" to "p-0.5")
    fullName2Private(theFullName) {
        if (!theFullName || typeof theFullName !== 'string') return "";
        let firstDot = theFullName.indexOf(".") + 1;
        return theFullName.substr(firstDot);
    }

    async createAvatarMesh(scene) {
        //console.log("avatarURL: " + avatarURL)
        /*        
       await BABYLON.SceneLoader.AppendAsync("", avatarURL, scene);
        let beforeavatarMesh = scene.meshes[scene.meshes.length - 1];
        let avatarMesh = beforeavatarMesh.parent;
        return avatarMesh.parent;
        */
        
        // Create lego avatar for avatarType A
        if (this.avatarType === "A") {
            console.log("Creating lego avatar for type A");
            await this.createLegoAvatar(scene);
            // Avatars remain visible - no hiding
            return;
        }
        
        /// Load the GLB model from the URL
        ///select gender by even or odd num
        /// if we know how mwny boys and have way to set it we can replace it with a better way
        let avatarURL
        if (this.avatarType === "C") {
            avatarURL = "Avatars/weman/67ff3e3113b3fb7e8ab511f1.glb";
            this.avatarData.loadedIsMan = null; //not relevant
        } else {
            if (this.avatarData.num % 2 === 0) {
                avatarURL = this.avatarData.avatarURL;
                this.avatarData.loadedIsMan = false;
            } else {
                avatarURL = this.avatarData.avatarURLBoy;
                this.avatarData.loadedIsMan = true;
            }
        }
        let result;
        try {
            result = await BABYLON.SceneLoader.ImportMeshAsync(
                null,
                "",
                avatarURL,
                scene
            );
        } catch (error) {
            if (window.location.protocol === "file:") {
                console.error("Failed to load avatar model while running from file://. Serve the project via http://localhost (for example: python -m http.server) and open index.html through that server.");
            }
            console.error(`Failed to import GLB: ${avatarURL}`, error);
            return null;
        }
        /*
                // Find the top-level node among them (those with no parent)
                result.meshes.forEach(m => {
                    console.log(`Mesh: ${m.name} | Vertices: ${m.getTotalVertices()} | Visible: ${m.isVisible}`);
                });
                */
        const root = result.meshes.find(m => !m.parent);
        if (!root) {
            console.warn("No root mesh found in imported GLB!");
            return null;
        }
        this.avatarMesh = root;
        //this.avatarMesh.scaling = new BABYLON.Vector3(1, 1, 1);
        ///return root;
        ///moved to allow implement on all avatars
        console.log("avatarType:", this.avatarType);

    }
    ///place the avatar in the world
    placeAvatar() {
        // Use this.avatarData instead of avatarDetails
        const data = this.avatarData;
        if (this.avatarMesh) {
            //this.avatarMesh.scaling = new BABYLON.Vector3(-1, 1, -1);
            this.avatarMesh.position = new BABYLON.Vector3(data.x, data.y, data.z);
            
            // Scale lego avatars down to more reasonable avatar size
            if (this.avatarType === "A") {
                this.avatarMesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
            }
            
            this.avatarMesh.lookAt(new BABYLON.Vector3(data.targetX, data.targetY, data.targetZ));
            this.avatarMesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
            
            // Ensure lego avatars are visible
            if (this.avatarType === "A") {
                this.avatarMesh.isVisible = true;
                const childMeshes = this.avatarMesh.getChildMeshes();
                childMeshes.forEach(child => {
                    child.isVisible = true;
                    child.visibility = 1;
                });
            }
        }
    }

    chatRequest() {
        this.myWorld.chatRequest(this.ID);
        //console.log("chatRequest on avatar: " + this.ID);
    }

    ///usage: const deltaRotation = { x: 0, y: 45, z: 0 }; // Rotate 45 degrees around the Y axis 
    rotateMeshByDegrees(deltaRotation) {
        // Convert degrees to radians
        //console.log("deltaRotation: " + deltaRotation);
        const deltaRotationRadians = {
            x: BABYLON.Tools.ToRadians(deltaRotation.x),
            y: BABYLON.Tools.ToRadians(deltaRotation.y),
            z: BABYLON.Tools.ToRadians(deltaRotation.z)
        };
        //console.log("deltaRotationRadians: " + deltaRotationRadians);
        // Apply the rotation relative to the current rotation
        this.avatarMesh.rotation.x += deltaRotationRadians.x;
        this.avatarMesh.rotation.y += deltaRotationRadians.y;
        this.avatarMesh.rotation.z += deltaRotationRadians.z;
    }

    calculateTargetPosition(mesh, deltaRotationDegrees) {
        // Convert degrees to radians
        const deltaRotationRadians = {
            x: BABYLON.Tools.ToRadians(deltaRotationDegrees.x),
            y: BABYLON.Tools.ToRadians(deltaRotationDegrees.y),
            z: BABYLON.Tools.ToRadians(deltaRotationDegrees.z)
        };

        // Get the current position of the mesh
        const currentPosition = mesh.position;

        // Calculate the direction vector based on the current rotation and the desired delta rotation
        const direction = new BABYLON.Vector3(
            Math.sin(deltaRotationRadians.y),
            0,
            Math.cos(deltaRotationRadians.y)
        );

        // Calculate the target position by adding the direction vector to the current position
        const targetPosition = currentPosition.add(direction);

        return targetPosition;
    }
    ///noChat, myChat, inChat
    hideButtons() {
        //this.statusData = { status: "noChat" };
        if (this.frontSign) {
            this.frontSign.hideButtons();
        }

    }

    setState(state) {
        this.frontSign.setState(state);
    }
    setDone() {
        this.frontSign.setState("done");
    }
}


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
            
            // Create a base model for the avatar
            // Use a unique container mesh that won't be added to modelsArray
            let avatarContainer = window.meshBlock(scene, 1);
            avatarContainer.metadata = {
                inModel: true,
                blockNum: 0,
                numOfBlocks: 0,
                modelName: "man",
                modelTitle: "AvatarLego",
                isAvatarModel: true
            };
            
            // Rebuild the avatar model from stored data
            // Build blocks up to a reasonable maximum for the avatar
            const maxBlocks = Math.min(manModelData.length, 12); // Limit avatar complexity
            
            for (let index = 1; index < maxBlocks; index++) {
                const element = manModelData.filter(el => el.step == index)[0];
                if (!element) continue;
                
                let srcBlockName = element.type;
                let srcConnectionName = this.fullName2Private(element.srcPoint);
                
                // Create new block from menu
                let menuBlock = window.elementsMenu.getChildMeshes(false, node => node.name == srcBlockName)[0];
                if (!menuBlock) continue;
                
                let newElement = menuBlock.clone(menuBlock.name);
                
                // Set orientation
                let newRotation = window.rotationName2Vector(element.rotation);
                newElement.rotation = newRotation;
                
                // Set color
                let newColor = window.colorName2Vector(element.color);
                
                // Connect to avatar model
                const destBlockNum = element.destBlock;
                const destPointName = element.destPoint;
                
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
            
            // Position avatar at ground level
            window.setOnGround(avatarContainer, 1);
            
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
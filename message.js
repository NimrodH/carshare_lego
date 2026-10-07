"use strict"

// The green sign above each avatar. The texture keeps 1024 pixels per sign
// height; the sign is SIGN_WIDTH_RATIO times wider than it is tall, and the
// extra width goes to the text. The button keeps its old size and place.
const SIGN_TEXTURE_SIZE = 1024;
const SIGN_WIDTH_RATIO = 1.3;
const SIGN_FONT_SIZE = 48;        // largest text size; long signs shrink to fit
const SIGN_TEXT_BOTTOM_PX = 715;  // text stays above this line (the button starts at 727)

class AvatarMessage {
    //nextButton;///also sent as parameter in new session and called from there
    constructor(planeSize, x, y, z, signData, avatar) {
        console.log("in AvatarMessage")
        this.myAvatar = avatar;
        this.plane = BABYLON.MeshBuilder.CreatePlane("plane", { height: planeSize, width: -planeSize * SIGN_WIDTH_RATIO });
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
            this.plane, Math.round(SIGN_TEXTURE_SIZE * SIGN_WIDTH_RATIO), SIGN_TEXTURE_SIZE);
        // Keeps the text sharp when the sign is seen at an angle (from the center).
        this.advancedTexture.anisotropicFilteringLevel = 16;
        //this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;///without it its mirror
        //this.plane.position = new BABYLON.Vector3(x, y, z);
        ///this.plane.position = new BABYLON.Vector3(0, 0, 0);///////////////
        //this.plane.setParent(this.myAvatar.avatarMesh);
        //////////////////////////////
        //this.avatarMesh.scaling = new BABYLON.Vector3(1, 1, 1);
        const anchor = new BABYLON.TransformNode("anchor", scene);
        anchor.scaling = new BABYLON.Vector3(-1, 1, -1);
        //anchor.scaling = new BABYLON.Vector3(1, 1, 1);
        anchor.parent = this.myAvatar.avatarMesh;
        anchor.position = new BABYLON.Vector3(x, y, z); // try different Y/Z to move above chest
        this.plane.parent = anchor;
        //this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

        ////////////////////

        this.plane.setParent(this.myAvatar.avatarMesh);

        // The plane is now parented directly to the avatar mesh, so it inherits
        // the avatar's own scaling (e.g. 0.1 for lego-built type "A" avatars).
        // Counteract that here so the sign always renders at the same physical
        // size, regardless of how small/large the avatar itself is scaled.
        const avatarScaling = this.myAvatar.avatarMesh && this.myAvatar.avatarMesh.scaling;
        if (avatarScaling) {
            this.plane.scaling = new BABYLON.Vector3(
                1 / (avatarScaling.x || 1),
                1 / (avatarScaling.y || 1),
                1 / (avatarScaling.z || 1)
            );
        }

        this.advancedTexture.background = 'green'


        //this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;///without it its mirror

        this.textField = new BABYLON.GUI.TextBlock("upperText");

        //this.advancedTexture.background = 'green'


        this.nextButton = BABYLON.GUI.Button.CreateSimpleButton("but1", "לחץ להתחת שיחה");
        this.nextButton.width = `${SIGN_TEXTURE_SIZE}px`; // same size as before the sign got wider
        this.nextButton.height = 0.4;
        this.nextButton.color = "white";
        this.nextButton.fontSize = 50;
        this.nextButton.background = "green";
        this.nextButton.onPointerUpObservable.add(this.chatRequest.bind(this));
        this.nextButton.top = "250px";//90
        this.nextButton.left = "10px";
        this.nextButton.height = "70px";
        this.advancedTexture.addControl(this.nextButton);
        if (signData.isLoading) {
            this.setState("loading");
        } else {
            this.setState("noChat");
        }

        let text1 = this.textField;
        text1.color = "white"
        text1.fontSize = SIGN_FONT_SIZE;
        text1.textWrapping = true;
        text1.width = "96%";
        // From the top of the sign down to just above the button, and never
        // catches clicks, so the button stays clickable.
        text1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text1.top = "0px";
        text1.height = `${SIGN_TEXT_BOTTOM_PX}px`;
        text1.isHitTestVisible = false;
        this.advancedTexture.addControl(text1);
        this.updateText(this.createMessage(signData));

        // Hovering the sign shows its text in a readable popup (every group)
        this.plane.actionManager = new BABYLON.ActionManager(scene);
        this.plane.actionManager.hoverCursor = "default";
        this.plane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger, () => SignPopup.show(this)));
        this.plane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger, () => SignPopup.hide(this)));
    }

    updateText(theText) {
        this.textField.text = theText;
        // Shrink the font for long signs so every line fits above the button.
        const lines = String(theText).split("\n").length;
        const fitting = Math.floor(SIGN_TEXT_BOTTOM_PX / (lines * 1.2));
        this.textField.fontSize = Math.max(24, Math.min(SIGN_FONT_SIZE, fitting));
    }

    createMessage(signData) {
        const sheTravel = "נוסעת";
        const heTravel = "נוסע";
        const sheTravelBack = "חוזרת";
        const heTravelBack = "חוזר";
        const hePassenger = "מצטרף כנוסע";
        const shePassenger = "מצטרפת כנוסעת";
        const heDriver = "מסיע ברכבי";
        const sheDriver = "מסיעה ברכבי";
        const andOr = "  ו/או  ";
        let travel;
        let travelBack;
        let forMessage1;
        let forMessage2;
        let forMessage3;

        let message = signData.userName + "\n\n";
        if (signData.isPassenger) {
            if (signData.isMan) {
                forMessage1 = hePassenger;
            } else {
                forMessage1 = shePassenger;
            }
        } else {
            forMessage1 = "";
        }
        if (signData.isDriver) {
            if (signData.isMan) {
                forMessage2 = heDriver;
            } else {
                forMessage2 = sheDriver;;
            }
        } else {
            forMessage2 = "";
        }
        if (signData.isPassenger && signData.isDriver) {
            forMessage3 = andOr;
        } else {
            forMessage3 = "";
        }
        message += forMessage1 + forMessage3 + forMessage2 + "\n";

        if (signData.isMan) {
            travelBack = heTravelBack; //חוזר
            travel = heTravel; //נוסע
        } else {
            travelBack = sheTravelBack; //חוזרת
            travel = sheTravel; //נוסעת
        }

        if (signData.day1to != "") {
            message += travel + " ביום א' בשעה " + signData.day1to + "\n";
        }
        if (signData.day1back != "") {
            message += travelBack + " ביום א' בשעה " + signData.day1back + "\n";
        }
        if (signData.day2to != "") {
            message += travel + " ביום ב' בשעה " + signData.day2to + "\n";
        }
        if (signData.day2back != "") {
            message += travelBack + " ביום ב' בשעה " + signData.day2back + "\n";
        }
        if (signData.day3to != "") {
            message += travel + " ביום ג' בשעה " + signData.day3to + "\n";
        }
        if (signData.day3back != "") {
            message += travelBack + " ביום ג' בשעה " + signData.day3back + "\n";
        }
        if (signData.day4to != "") {
            message += travel + " ביום ד' בשעה " + signData.day4to + "\n";
        }
        if (signData.day4back != "") {
            message += travelBack + " ביום ד' בשעה " + signData.day4back + "\n";
        }
        if (signData.day5to != "") {
            message += travel + " ביום ה' בשעה " + signData.day5to + "\n";
        }
        if (signData.day5back != "") {
            message += travelBack + " ביום ה' בשעה " + signData.day5back + "\n";
        }
        message += "מהכתובת: " + signData.address + "\n";

        return message;
    }

    chatRequest() {
        this.myAvatar.chatRequest();
    }

    ///noChat, myChat, inChat
    setState(state) {
        switch (state) {
            case "noChat":
                this.nextButton.isEnabled = true;
                this.nextButton.textBlock.text = "לחץ להתחלת שיחה";
                this.nextButton.color = "white";
                break;
            case "myChat":
                this.nextButton.isEnabled = false;
                this.nextButton.textBlock.text = "בשיחה איתך";
                this.nextButton.color = "blue";
                break;
            case "inChat":
                this.nextButton.isEnabled = false;
                this.nextButton.color = "red";
                this.nextButton.textBlock.text = "עסוק בשיחה";
                break;
            case "done":
                this.nextButton.isEnabled = false;
                this.nextButton.color = "red";
                this.nextButton.textBlock.text = "סיימתי - לא זמין לשיחה נוספת";
                break;
            case "loading":
                this.nextButton.isEnabled = false;
                this.nextButton.color = "red";
                this.nextButton.textBlock.text = "טוען נתונים, נא להמתין";
                break;
            case "me":
                this.nextButton.isEnabled = false;
                this.nextButton.isVisible = false; //hide the button
                //this.nextButton.color = "red";
                break;
            case "refuseChat":
                this.nextButton.isEnabled = false;
                this.nextButton.color = "red";
                this.nextButton.textBlock.text = "סליחה, בנתיים התחלתי שיחה אחרת";
                break;
            case "alreadyTalked":
                this.nextButton.isEnabled = false;
                this.nextButton.color = "red";
                this.nextButton.textBlock.text = "כבר דיברנו";
                break;

        }
    }
}


/// A popup with the text of the sign under the mouse, drawn as page text (sharp at
/// any distance). Only while the camera is at the center of the circle. Placed
/// next to the sign, in the empty band above or below the avatars, so it doesn't
/// hide them.
class SignPopup {
    static show(sign) {
        const world = sign.myAvatar.myWorld;
        const atCenter = typeof window.isCameraAtCenter === "function" && window.isCameraAtCenter();
        if (!atCenter || (world && world.currChat)) return;
        const text = sign.textField && sign.textField.text;
        if (!text) return;

        const box = SignPopup.getBox();
        box.textContent = text;
        box.style.display = "block";
        SignPopup.current = sign;
        SignPopup.place(sign, box);

        // Hide it when the camera leaves the center or a chat opens
        if (!SignPopup.watcher) {
            SignPopup.watcher = scene.onBeforeRenderObservable.add(() => {
                const current = SignPopup.current;
                const w = current && current.myAvatar.myWorld;
                if (!current || !window.isCameraAtCenter() || (w && w.currChat) || current.plane.isDisposed()) {
                    SignPopup.hide();
                }
            });
        }
    }

    /// Hide the popup (only if it shows `sign`, when given).
    static hide(sign) {
        if (sign && SignPopup.current !== sign) return;
        SignPopup.current = null;
        if (SignPopup.box) SignPopup.box.style.display = "none";
        if (SignPopup.watcher) {
            scene.onBeforeRenderObservable.remove(SignPopup.watcher);
            SignPopup.watcher = null;
        }
    }

    static getBox() {
        if (!SignPopup.box) {
            const box = document.createElement("div");
            box.style.cssText = [
                "position:fixed", "display:none", "z-index:20", "pointer-events:none",
                "direction:rtl", "text-align:center", "white-space:pre-line",
                "background:rgba(0,90,0,0.92)", "color:white", "border:2px solid white",
                "border-radius:10px", "padding:10px 16px", "box-shadow:0 4px 14px rgba(0,0,0,0.5)",
                "font-family:Arial, sans-serif", "line-height:1.3"
            ].join(";");
            document.body.appendChild(box);
            SignPopup.box = box;
        }
        return SignPopup.box;
    }

    /// Put the box over the sign horizontally, in the taller of the two empty
    /// bands of the screen: above the highest avatar or sign, or below the lowest.
    static place(sign, box) {
        const canvas = scene.getEngine().getRenderingCanvas();
        const rect = canvas.getBoundingClientRect();
        const margin = 10;

        let top = rect.bottom;
        let bottom = rect.top;
        const world = sign.myAvatar.myWorld;
        for (const avatar of (world && world._avatarsArr) || []) {
            const r = SignPopup.screenRect(avatar.avatarMesh, rect);
            if (!r) continue;
            top = Math.min(top, r.top);
            bottom = Math.max(bottom, r.bottom);
        }
        if (top > bottom) { // no avatar on screen
            top = rect.top + rect.height / 2;
            bottom = top;
        }
        const above = { top: rect.top, height: Math.max(0, top - rect.top) };
        const below = { top: bottom, height: Math.max(0, rect.bottom - bottom) };
        const band = above.height >= below.height ? above : below;

        // Largest font (24px down to 16px) that fits in the band; if even 16px
        // doesn't fit, the lines go in two columns before the box may cover
        // the edge of the avatars.
        const room = Math.max(40, band.height - 2 * margin);
        box.style.columnCount = "1";
        box.style.maxWidth = "40vw";
        for (let size = 24; size >= 16; size -= 2) {
            box.style.fontSize = `${size}px`;
            if (box.offsetHeight <= room) break;
        }
        if (box.offsetHeight > room) {
            box.style.columnCount = "2";
            box.style.columnGap = "24px";
            box.style.maxWidth = "80vw";
            for (let size = 24; size >= 16; size -= 2) {
                box.style.fontSize = `${size}px`;
                if (box.offsetHeight <= room) break;
            }
        }

        const signRect = SignPopup.screenRect(sign.plane, rect);
        const centerX = signRect ? (signRect.left + signRect.right) / 2 : rect.left + rect.width / 2;
        const width = box.offsetWidth;
        const height = box.offsetHeight;
        const left = Math.min(Math.max(centerX - width / 2, rect.left + margin), rect.right - width - margin);
        let y = band.top + (band.height - height) / 2;
        if (height > room) {
            // Too tall for the band: keep it against the screen edge of the band
            y = band === above ? rect.top + margin : rect.bottom - height - margin;
        }
        box.style.left = `${left}px`;
        box.style.top = `${Math.max(rect.top + margin, Math.min(y, rect.bottom - height - margin))}px`;
    }

    /// The page rectangle a mesh (with its children) covers, or null when it is
    /// behind the camera or off screen.
    static screenRect(mesh, rect) {
        if (!mesh || mesh.isDisposed()) return null;
        const { min, max } = mesh.getHierarchyBoundingVectors(true);
        const viewport = scene.activeCamera.viewport.toGlobal(rect.width, rect.height);
        const transform = scene.getTransformMatrix();
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        for (let i = 0; i < 8; i++) {
            const corner = new BABYLON.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z);
            const p = BABYLON.Vector3.Project(corner, BABYLON.Matrix.IdentityReadOnly, transform, viewport);
            if (p.z < 0 || p.z > 1) return null; // behind the camera
            left = Math.min(left, p.x); right = Math.max(right, p.x);
            top = Math.min(top, p.y); bottom = Math.max(bottom, p.y);
        }
        if (right < 0 || left > rect.width || bottom < 0 || top > rect.height) return null;
        return { left: rect.left + left, right: rect.left + right, top: rect.top + top, bottom: rect.top + bottom };
    }
}
SignPopup.box = null;
SignPopup.current = null;
SignPopup.watcher = null;

class Chat {
    //constructor(avatarFrom, avatarTo, world) {
    constructor(avatarFrom, avatarTo, world, chatID) {
        this.avatarFromID = avatarFrom.ID;
        this.avatarToID = avatarTo.ID;
        //this.chatID = this.avatarFromID + "_" + this.avatarToID;
        this.chatID = chatID;
        this.myWorld = world;
        this.myWorld?.stopPeriodicUpdate?.();
        if (this.myWorld.myAvatar.ID == this.avatarFromID) {
            this.userNameFrom = avatarFrom.userName;
        } else {
            this.userNameFrom = avatarTo.userName;
        }

        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.rect1 = new BABYLON.GUI.Rectangle();
        this.rect1.width = "35%";
        this.rect1.height = "85%";
        this.rect1.cornerRadius = 20;
        this.rect1.color = "green";
        this.rect1.thickness = 4;
        this.rect1.background = "black";
        // Open on the side away from the partner, so the chat doesn't cover it.
        const partner = avatarFrom.ID === world.myAvatar.ID ? avatarTo : avatarFrom;
        if (Chat.isLeftOfScreenCenter(partner, world.scene)) {
            this.rect1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.rect1.left = "-1%";
        } else {
            this.rect1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.rect1.left = "1%";
        }
        this.advancedTexture.addControl(this.rect1);

        this.grid = new BABYLON.GUI.Grid();
        this.grid.background = "black";
        this.grid.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.grid.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.rect1.addControl(this.grid);
        this.grid.width = 0.95;
        this.grid.height = 0.98;

        this.grid.addRowDefinition(0.76);
        this.grid.addRowDefinition(0.12);
        this.grid.addRowDefinition(0.12);

        this.scrollViewer = new BABYLON.GUI.ScrollViewer(null, true);
        this.scrollViewer.width = "100%";
        this.scrollViewer.height = 1;
        this.scrollViewer.background = "#CCCCCC";
        this.scrollViewer.color = "black";
        this.scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_STRETCH;
        this.grid.addControl(this.scrollViewer, 0, 0);

        this.sendButton = BABYLON.GUI.Button.CreateSimpleButton("sendButton", "שלח ההודעה");
        this.sendButton.width = 0.2;
        this.sendButton.height = 0.8;
        this.sendButton.color = "white";
        this.sendButton.background = "black";
        this.sendButton.onPointerUpObservable.add(this.sendLine.bind(this));
        this.grid.addControl(this.sendButton, 2, 0);
        this.sendButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.sendButton.fontSize = "25%";

        this.buttonDeal = BABYLON.GUI.Button.CreateSimpleButton("dealButton", "סוכמה נסיעה");
        this.buttonDeal.width = 0.2;
        this.buttonDeal.height = 0.8;
        this.buttonDeal.color = "white";
        this.buttonDeal.background = "green";
        this.buttonDeal.onPointerUpObservable.add(this.dealDoneSelected.bind(this));
        this.buttonDeal.left = "-13%";
        this.grid.addControl(this.buttonDeal, 2, 1);
        this.buttonDeal.fontSize = "25%";

        this.buttonClose = BABYLON.GUI.Button.CreateSimpleButton("closeButton", "סגור");
        this.buttonClose.width = 0.2;
        this.buttonClose.height = 0.8;
        this.buttonClose.color = "white";
        this.buttonClose.background = "green";
        this.buttonClose.onPointerUpObservable.add(this.closeChat.bind(this));
        this.grid.addControl(this.buttonClose, 2, 0);
        this.buttonClose.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.buttonClose.fontSize = "25%";

        this.buttonNoDeal = BABYLON.GUI.Button.CreateSimpleButton("closeNoDealButton", "לא סוכם");
        this.buttonNoDeal.width = 0.2;
        this.buttonNoDeal.height = 0.8;
        this.buttonNoDeal.color = "white";
        this.buttonNoDeal.background = "red";
        this.buttonNoDeal.onPointerUpObservable.add(this.dealNotDoneSelected.bind(this));
        this.buttonNoDeal.fontSize = "25%";
        this.grid.addControl(this.buttonNoDeal, 2, 2);
        this.buttonNoDeal.left = "13%";

        this.textBlock = new BABYLON.GUI.TextBlock();
        this.textBlock.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
        this.textBlock.resizeToFit = true;
        this.textBlock.paddingTop = "5%";
        this.textBlock.paddingLeft = "30px";
        this.textBlock.paddingRight = "20px";
        this.textBlock.paddingBottom = "5%";
        this.textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.color = "red";
        this.textBlock.background = "yellow";
        this.textBlock.fontSize = "5%";
        this.scrollViewer.addControl(this.textBlock);

        this.messageInput = new BABYLON.GUI.InputText('id', "");
        this.messageInput.height = 0.8;
        this.messageInput.color = "white";
        this.messageInput.fontSize = "35%";
        this.messageInput.width = 1;
        this.messageInput.placeholderText = "כתוב כאן את ההודעה ולחץ על כפתור שלח";
        this.messageInput.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;



        this.grid.addControl(this.messageInput, 1, 0);
        ///start loking for new messages
        console.log("chatID: " + this.chatID);
        /*
        this.pollInterval = setInterval(async () => {
            const res = await getData("chat/getText", `?chatID=${this.chatID}`);
            if (res && typeof res.chatText === "string") {
                // Update whenever content changed (not only when line count grows)
                if (res.chatText !== this.textBlock.text) {
                    this.updateText(res.chatText);
                }
            }
        }, 2000);
        */
        // choose your poll interval (ms). If you already have this.pollIntervalMs, use it.
        const POLL_MS = 2000;

        this.pollHandle = startSafePoll(
            async () => {
                const res = await getData("chat/getText", `?chatID=${this.chatID}`);
                if (res && typeof res.chatText === "string") {
                    if (res.chatText !== this.textBlock.text) {
                        this.updateText(res.chatText);
                    }
                }
                // --- detect remote close while world periodic is paused ---
                try {
                    const myID = this.myWorld &&
                        this.myWorld.myAvatar &&
                        this.myWorld.myAvatar.ID
                        ? this.myWorld.myAvatar.ID
                        : null;

                    const query = myID ? `?avatarID=${encodeURIComponent(myID)}` : "";

                    // chat poll tick + heartbeat
                    const st = (await getData("getAllStatuses", query)) || {};
                    const meSrv = (st.avatars || []).find(v => v.avatarID === myID);
                    if (!meSrv) return;
                    const ended =
                        meSrv.status !== "inChat" ||
                        !meSrv.chatID ||
                        meSrv.chatID !== this.chatID;

                    if (ended) {
                        const agreed = this.myWorld.chatAgreed?.(this);
                        const partnerID =
                            (this.myWorld.myAvatar.ID === this.avatarFromID) ? this.avatarToID : this.avatarFromID;

                        const me = this.myWorld.myAvatar;
                        const partner = this.myWorld.idToAvatar?.(partnerID);

                        partner?.frontSign?.setState?.("alreadyTalked") || partner?.setState?.("alreadyTalked");
                        me?.frontSign?.setState?.("noChat") || me?.setState?.("noChat");

                        this.myWorld.stickyUntilDone?.add?.(partnerID);
                        if (partner) partner.alreadyTalked = true;

                        this.dispose();
                        if (this.myWorld.currChat === this) this.myWorld.currChat = null;
                        this.myWorld.walkPartnerHome?.(agreed);
                        this.myWorld.allowPointer = true;
                        this.myWorld.startPeriodicUpdate();
                        return;
                    }

                } catch (e) {
                    // Don’t kill the poller on transient errors
                    console.warn("[CHAT] remote-close check failed:", e);
                }

            },
            POLL_MS,
            `chatPoll:${this.chatID}`
        );


        this.setChatState("start")
    }

    /// True when the avatar is in the left half of the screen (camera view space x < 0).
    /// Unknown avatar or camera counts as left, which keeps the chat on the right as before.
    static isLeftOfScreenCenter(avatar, scene) {
        const camera = scene && scene.activeCamera;
        if (!avatar || !avatar.avatarMesh || !camera) return true;
        const inView = BABYLON.Vector3.TransformCoordinates(
            avatar.avatarMesh.getAbsolutePosition(),
            camera.getViewMatrix()
        );
        return inView.x < 0;
    }

    updateText(theText) {
        this.textBlock.text = theText;
    }
    getText() {
        return this.textBlock.text;
    }

    async sendLine() {
        const payload = {
            chatID: this.chatID,
            fromAvatarID: this.avatarFromID,
            toAvatarID: this.avatarToID,
            newLine: `${this.userNameFrom}: ${this.messageInput.text}`
        };

        const res = await postData("chat/sendLine", payload);

        // index.html defines isErrorResponse(res)
        if (typeof isErrorResponse === "function" && isErrorResponse(res)) {
            console.error("[CHAT] sendLine rejected:", res);
            return; // keep textbox text so user can retry/edit
        }

        if (res && res.chatText) {
            this.updateText(res.chatText);   // immediate local refresh
            this.messageInput.text = "";     // clear only on success
        } else {
            console.warn("[CHAT] sendLine ok but no chatText in response:", res);
        }

        this.messageInput.focus();
    }

    dealDoneSelected() {
        this.buttonClose.isEnabled = true;
        this.dealResult = "dealDone";
        this.myDealDoneLines = (this.myDealDoneLines || 0) + 1; // see World.chatAgreed()
        this.myWorld.dealDoneSelected(this.chatID, this.avatarFromID, this.avatarToID);
    }

    dealNotDoneSelected() {
        this.buttonClose.isEnabled = true;
        this.dealResult = "notDone";
        this.myNoDealLines = (this.myNoDealLines || 0) + 1; // see World.chatAgreed()
        this.myWorld.dealNotDoneSelected(this.chatID, this.avatarFromID, this.avatarToID);
    }

    closeChat() {
        if (this.myWorld.currChat.chatID == this.chatID) {
            this.myWorld.closeChat(this.avatarFromID, this.avatarToID, this.dealResult);
        } else {
            this.dispose();
            if (this.myWorld.currChat) {
                this.myWorld.currChat = null;
            }
        }
        /*
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        */
        if (this.pollHandle) {
            this.pollHandle.stop();
            this.pollHandle = null;
        }

    }

    dispose() {
        /*
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        */
        if (this.pollHandle) {
            this.pollHandle.stop();
            this.pollHandle = null;
        }
        this.advancedTexture.dispose();
        this.rect1.dispose();
        this.grid.dispose();
        this.scrollViewer.dispose();
        this.sendButton.dispose();
        this.buttonDeal.dispose();
        this.buttonNoDeal.dispose();
        this.textBlock.dispose();
        this.messageInput.dispose();
    }

    setChatState(state) {
        switch (state) {
            case "start":
                this.sendButton.isEnabled = true;
                this.buttonDeal.isEnabled = true;
                this.buttonNoDeal.isEnabled = true;
                this.buttonClose.isEnabled = false;
                break;
            case "refused":
                this.textBlock.text = "המשתתף השני בחר באפשרות [לא סוכם] לכן הנסיעה לא נקבעה. בחר סגור. תוכל לנסות לברר איתו למה בחר כך בשיחה נוספת.";
                this.sendButton.isEnabled = false;
                this.buttonDeal.isEnabled = false;
                this.buttonNoDeal.isEnabled = false;
                this.buttonClose.isEnabled = true;
                break;
            case "wait":
                this.textBlock.text = "המשתתף השני עדיין לא בחר, המתן, והקלק שוב על תשובתך";
                this.sendButton.isEnabled = false;
                this.buttonDeal.isEnabled = true;
                this.buttonNoDeal.isEnabled = true;
                this.buttonClose.isEnabled = true;
                break;
            case "done":
                this.textBlock.text = "סוכם על ביצוע נסיעה משותפת. לחץ [סגור] כדי לסיים את השיחה";
                this.sendButton.isEnabled = false;
                this.buttonDeal.isEnabled = false;
                this.buttonNoDeal.isEnabled = false;
                this.buttonClose.isEnabled = true;
                break;
            case "notDone":
                this.textBlock.text = "לא סוכם על נסיעה. בחר [סגור], ונסה לתאם עם מישהו אחר";
                this.sendButton.isEnabled = false;
                this.buttonDeal.isEnabled = false;
                this.buttonNoDeal.isEnabled = false;
                this.buttonClose.isEnabled = true;
                break;
            case "otherAccepted":
                this.textBlock.text = "רק המשתתף השני בחר באפשרות [סוכם]. הנסיעה לא נקבעה. בחר סגור. תוכל לנסות לברר איתו למה בחר כך בשיחה נוספת.";
                this.sendButton.isEnabled = false;
                this.buttonDeal.isEnabled = false;
                this.buttonNoDeal.isEnabled = false;
                this.buttonClose.isEnabled = true;
                break;
        }
    }
}


class Wellcome {

    //plane = BABYLON.Mesh.CreatePlane("plane2",  { height: 1, width: 1 });
    plane = BABYLON.Mesh.CreatePlane("plane2", 10);
    advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.plane);
    currentScreen = "init";
    nextButton;///also sent as parameter in new session and called from there
    constructor(world) {
        this.world = world;
        //this.keyboard = this._addKeyboard();//needed for headset not pc. If used,  neeed more place & uncomment this.keyboard.connect, too
        this.plane.position.z = 20;///-20
        this.plane.position.y = 4;///
        this.plane.position.x = 0;
        this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;///without iא its mirror

        this.advancedTexture.background = "green";//green - 'orange' for debug color

        this.nextButton = BABYLON.GUI.Button.CreateSimpleButton("but1", "המשך");
        this.nextButton.width = 1;
        this.nextButton.height = 0.4;
        this.nextButton.color = "white";
        this.nextButton.fontSize = 50;
        this.nextButton.background = "green";
        this.nextButton.onPointerUpObservable.add(this.screenDone.bind(this));
        this.nextButton.top = "300";//90
        this.nextButton.left = "10px";
        this.nextButton.height = "70px";
        this.advancedTexture.addControl(this.nextButton);

        const gap = 150;
        const topLines = -450;
        const gapLines = -100
        this._addTextField(":יום", 400, topLines)
        this._addTextField("א", 400 - gap * 1, topLines)
        this._addTextField("ב", 400 - gap * 2, topLines)
        this._addTextField("ג", 400 - gap * 3, topLines)
        this._addTextField("ד", 400 - gap * 4, topLines)
        this._addTextField("ה", 400 - gap * 5, topLines)
        this._addTextField(":שעה הלוך", 400, topLines - gapLines, 140)
        this._addTextField(":שעה חזור", 400, topLines - gapLines * 2, 140)

        this.day1fromHome = this._addInputText(400 - gap * 1, topLines - gapLines);
        this.day2fromHome = this._addInputText(400 - gap * 2, topLines - gapLines);
        this.day3fromHome = this._addInputText(400 - gap * 3, topLines - gapLines);
        this.day4fromHome = this._addInputText(400 - gap * 4, topLines - gapLines);
        this.day5fromHome = this._addInputText(400 - gap * 5, topLines - gapLines);

        this.day1toHome = this._addInputText(400 - gap * 1, topLines - gapLines * 2);
        this.day2toHome = this._addInputText(400 - gap * 2, topLines - gapLines * 2);
        this.day3toHome = this._addInputText(400 - gap * 3, topLines - gapLines * 2);
        this.day4toHome = this._addInputText(400 - gap * 4, topLines - gapLines * 2);
        this.day5toHome = this._addInputText(400 - gap * 5, topLines - gapLines * 2);

        this.address = this._addInputText(400 - gap * 2.5, topLines - gapLines * 5.5, 900, 70);
        this._addTextField(":אזור מגורים", 400, topLines - gapLines * 4.7, 200);

        this.userName = this._addInputText(400 - gap * 2.5, topLines - gapLines * 4, 900, 70);
        this._addTextField(":שם ", 400, topLines - gapLines * 3.3, 200);

        this._addTextField("ID", 400 - gap * 1.25, topLines - gapLines * 3)
        this.ID = this._addInputText(400 - gap * 2, topLines - gapLines * 3);
        this.buttonMan = this._addRadioButtens(400 - gap * 3.75, topLines - gapLines * 3, false, "man");
        this._addTextField("זכר", 400 - gap * 3.25, topLines - gapLines * 3)
        this.buttonWoman = this._addRadioButtens(400 - gap * 5, topLines - gapLines * 3, false, "woman");
        this._addTextField("נקבה", 400 - gap * 4.5, topLines - gapLines * 3)

        this.buttonPassenger = this._addCheckBox(400 - gap * 1.87, topLines - gapLines * 6.5, false, "passenger");
        this._addTextField("מצטרף כנוסע", 400 - gap * 0.9, topLines - gapLines * 6.5, 250)
        this.buttonDriver = this._addCheckBox(400 - gap * 5, topLines - gapLines * 6.5, false, "driver");
        this._addTextField("ו/או          מסיע ברכבי", 400 - gap * 3.7, topLines - gapLines * 6.5, 300)


        ///listen to this event and set the nextButton state
        //addEventListener("reportClick", this.handleReportClick.bind(this))
        //this.advancedTexture.focusedControl = inputTextArea;///create bug
        //plane.isVisible = true;
        //plane.dispose();
    }
    _addTextField(text, left, top, width = 70) {
        //"-450px"
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";
        const widthStr = width.toString() + "px";
        let text1 = new BABYLON.GUI.TextBlock("upperText");
        text1.text = text;//"Hello world";
        text1.color = "white"
        text1.fontSize = 34;

        text1.top = topStr;///"-450px";
        text1.left = leftStr;///"400px"
        text1.height = "100px";///"660px"
        text1.width = widthStr;
        this.advancedTexture.addControl(text1);
        return text1;
    }

    _addInputText(left, top, areaWidth = 120, areaHight = 70) {
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";
        const hightStr = areaHight.toString() + "px";
        const widthStr = areaWidth.toString() + "px";
        let inputTextArea = new BABYLON.GUI.InputText('id', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 34;
        inputTextArea.top = topStr;
        inputTextArea.height = hightStr;
        inputTextArea.width = widthStr;
        inputTextArea.left = leftStr;
        inputTextArea.onTextChangedObservable.add(() => this.nextButton.isEnabled = true);
        this.advancedTexture.addControl(inputTextArea);
        //this.keyboard.connect(inputTextArea);//needed for headset not pc. If used, neeed more place & uncomment this._addKeyboard();, too

        return inputTextArea;
    }

    _addKeyboard() {
        const keyboard = new BABYLON.GUI.VirtualKeyboard("vkb");
        keyboard.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
        keyboard.addKeysRow(["א", "ב", "ג", "ד"]);

        keyboard.top = "170px";
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        //keyboard.left = "10px";
        this.advancedTexture.addControl(keyboard);
        return keyboard;
    }

    _addRadioButtens(left, top, checked) {
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";

        let radioButton = new BABYLON.GUI.RadioButton("man");
        this.advancedTexture.addControl(radioButton);
        radioButton.top = topStr;///"-450px";
        radioButton.left = leftStr;///"400px"
        radioButton.height = "50px";///"660px"
        radioButton.width = "50px";///"660px"
        radioButton.isChecked = checked;
        radioButton.color = "white";
        radioButton.background = "black";

        radioButton.onIsCheckedChangedObservable.add((state) => this._checkRadioButton());
        return radioButton;
    }

    _addCheckBox(left, top, checked) {
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";

        let checkBox = new BABYLON.GUI.Checkbox();
        this.advancedTexture.addControl(checkBox);

        checkBox.top = topStr;
        checkBox.left = leftStr;
        checkBox.height = "50px";
        checkBox.width = "50px";
        checkBox.isChecked = checked;
        checkBox.color = "white";
        checkBox.background = "black";

        checkBox.onIsCheckedChangedObservable.add((state) => {
            console.log("Checkbox state: ", state);
            //this._checkBoxChanged(state); // Replace with your actual handler
        });

        return checkBox;
    }


    _checkRadioButton() {
        //console.log(this.buttonWoman.isChecked)
    }


    screenDone() {
        //let a = 22;
        //console.log("next clicked: " + this.buttonMan.isChecked)
        ////create object with data from welcome fields to send to World. when no data entered we get: ''
        let wellcomeData = {
            avatarID: this.ID.text,
            isMan: this.buttonMan.isChecked,
            address: this.address.text,
            day1to: this.day1fromHome.text,
            day1back: this.day1toHome.text,
            day2to: this.day2fromHome.text,
            day2back: this.day2toHome.text,
            day3to: this.day3fromHome.text,
            day3back: this.day3toHome.text,
            day4to: this.day4fromHome.text,
            day4back: this.day4toHome.text,
            day5to: this.day5fromHome.text,
            day5back: this.day5toHome.text,
            userName: this.userName.text,
            isDriver: this.buttonDriver.isChecked,
            isPassenger: this.buttonPassenger.isChecked
        }
        //console.log(wellcomeData)
        this.world.wellcomeDone(wellcomeData)
        this.clearInstance();
    }

    clearInstance() {
        this.advancedTexture.dispose();
        this.plane.dispose();

        // Remove reference to the instance itself if needed
        // Assuming `this` is the only reference to the instance
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }
    }

}
////this.nextButton.isEnabled = true;

class MessageScreen {   //plane = BABYLON.Mesh.CreatePlane("plane2",  { height: 1, width: 1 });
    plane = BABYLON.Mesh.CreatePlane("plane2", 10);
    advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.plane);
    currentScreen = "info";
    nextButton;///also sent as parameter in new session and called from there

    constructor(world, msg, screenType = "info") {
        let showButton = false;
        this.world = world;
        this.msg = msg
        this.screenType = screenType;
        if (this.screenType == "info") {
            showButton = false;
        } else {
            showButton = true;
        }

        this.plane.position.z = 20;///-20
        this.plane.position.y = 4;///
        this.plane.position.x = 0;
        this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;///without iא its mirror

        this.advancedTexture.background = "green"
        if (showButton) {
            this.nextButton = BABYLON.GUI.Button.CreateSimpleButton("but1", "המשך");
            this.nextButton.width = 1;
            this.nextButton.height = 0.4;
            this.nextButton.color = "white";
            this.nextButton.fontSize = 50;
            this.nextButton.background = "green";
            this.nextButton.onPointerUpObservable.add(this.okClicked.bind(this));
            this.nextButton.top = "300";//90
            this.nextButton.left = "10px";
            this.nextButton.height = "70px";
            this.advancedTexture.addControl(this.nextButton);
        }
        const gap = 150;
        const topLines = -450;
        const gapLines = -100
        this.iterationField = this._addTextField("0/30", 10, -450, 150, 60)
        this.msgField = this._addTextField(this.msg)

    }
    _addTextField(text, left = -50, top = -200, width = 800, height = 400) {
        //"-450px"
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";
        const widthStr = width.toString() + "px";
        const hight = height.toString() + "px";
        let text1 = new BABYLON.GUI.TextBlock("upperText");
        text1.text = text;//"Hello world";
        text1.color = "white"
        text1.fontSize = 34;

        text1.top = topStr;///"-450px";
        text1.left = leftStr;///"400px"
        text1.height = height;///"660px"
        text1.width = widthStr;
        this.advancedTexture.addControl(text1);
        return text1;
    }

    _addInputText(left, top, areaWidth = 120, areaHight = 70) {
        const leftStr = left.toString() + "px";
        const topStr = top.toString() + "px";
        const hightStr = areaHight.toString() + "px";
        const widthStr = areaWidth.toString() + "px";
        let inputTextArea = new BABYLON.GUI.InputText('id', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 34;
        inputTextArea.top = topStr;
        inputTextArea.height = hightStr;
        inputTextArea.width = widthStr;
        inputTextArea.left = leftStr;
        inputTextArea.onTextChangedObservable.add(() => this.nextButton.isEnabled = true);
        this.advancedTexture.addControl(inputTextArea);


        //this.keyboard.connect(inputTextArea);//needed for headset not pc. If used, neeed more place & uncomment this._addKeyboard();, too

        return inputTextArea;
    }

    updateIterationText(iteration) {
        this.iterationField.text = iteration;
    }

    updateMessageText(message) {
        this.msgField.text = message;
    }

    okClicked() {
        this.world.okClicked(this.screenType)
        this.clearInstance();
    }

    clearInstance() {
        this.advancedTexture.dispose();
        this.plane.dispose();

        // Remove reference to the instance itself if needed
        // Assuming `this` is the only reference to the instance
        for (let prop in this) {
            if (this.hasOwnProperty(prop)) {
                delete this[prop];
            }
        }
    }

}


/* + "\n" + "\n" +
    "מאחוריך מספר לבנים לבניית המודל" + "\n" + "\n" + 
    "[אחרי שראינו את האבנים יש להקליק על כפתור [המשך" + "\n" +
     "הקלקה פרושה להצביע עם הקרן על הכפתור וללחוץ על ההדק";
     */
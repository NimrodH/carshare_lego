// world.js — merged HTTP-only version
// Combines full visual/avatar logic from old version with new HTTP communication

// How far from the center of the circle (where the viewer's camera stands)
// the chat partner stops after walking in.
const CHAT_WALK_STOP_DISTANCE = 2.5;

// Camera checks (walk-in and look-at reactions, see startCameraWatch()).
const CAMERA_WATCH_MS = 200;          // how often the camera is checked
const LOOK_AT_MAX_DEGREES = 10;       // how close to the middle of the view the avatar must be
const LOOK_AT_DWELL_SECONDS = 0.5;    // how long the camera must stay on it
const LOOK_AT_COOLDOWN_SECONDS = 8;   // before the same avatar reacts again

class World {
    constructor(scene) {
        this.PERIODIC_UPDATE_MS = 10000; // 20000 ->20s (safe minimum)
        this.scene = scene;
        this._avatarsArr = []; // all avatar objects
        this._wellcome = new Wellcome(this);
        this.myAvatar = {};
        this.allowPointer = false;
        this.msg = null;
        this.currChat = null;
        this.periodicUpdateInterval = null;
        this.stickyUntilDone = new Set();
        this.chatPartner = null; // avatar in a chat with me (local only, not synced)
        this.cameraWatch = null;
        this.gaze = null; // { avatar, seconds, reacted } - the avatar the camera points at
    }

    // 1) Helper: read current status of a specific avatar (no writes)
    async isCalleeBusy(toID) {
        try {
            const res = await getData("getAllStatuses"); // returns { signs: [...], avatars: [...] }
            const avatars = res?.avatars || [];
            const callee = avatars.find(a => a.avatarID === toID);
            if (!callee) return false;                 // if unknown, don’t block
            return callee.status && callee.status !== "noChat";
        } catch (err) {
            console.warn("[CHAT] availability check failed; proceeding optimistically", err);
            return false; // on read error, let /chat/start be the source of truth
        }
    }

    // 2) Helper: quick UI nudge to show the callee looks busy (no server changes)
    showBusyHint(toAvatar) {
        if (!toAvatar) return;
        // reuse an existing visual state; brief flash and revert
        const prev = toAvatar.currState || "noChat";
        toAvatar.setState("refuseChat");
        setTimeout(() => {
            // don’t override if a chat actually started meanwhile
            if (!this.currChat) toAvatar.setState(prev);
        }, 1200);
    }

    // ---------- WELCOME FLOW ----------
    async wellcomeDone(signData) {
        console.log("[WORLD] Welcome started");
        this.viewerAvatarID = signData.avatarID;
        const avatarType = signData.avatarID[0].toUpperCase();
        let loadingMessage;
        if (avatarType !== "A") { //can be C
            loadingMessage = `המתן - טוען אווטרים
כאשר שלט זה ייסגר חלק מהאווטרים יציגו 
שלט עם פרטי הנסיעה המעניינים אותם
ניתן יהיה ללחוץ על הכפתור בשלט
 כדי לקיים שיחת צ'אט עם אווטר רלוונטי
אווטרים נוספים יתווספו בהמשך`;
        } else {
            loadingMessage = `המתן - טוען 
כאשר שלט זה ייסגר חלק מהמשתתפים יציגו 
שלט עם פרטי הנסיעה המעניינים אותם
ניתן יהיה ללחוץ על הכפתור בשלט
 כדי לקיים שיחת צ'אט עם משתתף רלוונטי
משתתפים נוספים יתווספו בהמשך`;
        }

        this.msg = new MessageScreen(this, loadingMessage, "info");
        signData.isLoading = true;

        await postData("addAvatar", signData);

        // Create avatars (meshes)
        let i = 1;
        const avatarDefinitions = getAllAvatarDefinitions();
        for (const avatarData of avatarDefinitions) {
            this.msg.updateIterationText(`${i++} / ${avatarDefinitions.length}`);
            const avatar = new Avatar(avatarData, this, avatarType);
            await avatar.createAvatarMesh(this.scene);
            await avatar.placeAvatar();
            this._avatarsArr.push(avatar);
        }
        await this.startAvatarAnimations();

        this.msg.updateMessageText("ממתין לאחרים");
        this.allowPointer = true;

        let result = (await getData("getAllStatuses")) || {};
        console.log("wellcomeDone: getAllStatuses result:", result);
        if ((!result.signs || !Array.isArray(result.signs)) && navigator.onLine) {
            // quick retry after short backoff if we’re online
            await new Promise(r => setTimeout(r, 400));
            result = (await getData("getAllStatuses")) || {};
        }
        const signs = result.signs || [];
        const avatars = result.avatars || [];
        console.log("wellcomeDone: signs:", signs);
        for (const sign of signs) {
            let currAvatar = this.getFreeAvatar(sign.isMan);
            if (!currAvatar) continue;
            if (sign.avatarID === signData.avatarID) this.myAvatar = currAvatar;
            await currAvatar.matchUser(sign);
        }
        this.showTestGLBFileNameSigns();

        if (this.myAvatar?.setState) this.myAvatar.setState("me");
        console.log("[WORLD] All avatars created and matched");
        await patchData(signData.avatarID, "isLoading", false)
            .then(() => console.log("[WORLD] Avatar loading finished"))
            .catch((err) => console.error("[WORLD] Update failed:", err));
        console.log("[WORLD] wellcomeDone: before first periodicUpdate");
        this.msg.clearInstance();
        this.msg = null;
        await this.periodicUpdate();
        console.log("[WORLD] wellcomeDone: after first periodicUpdate");
        this.startPeriodicUpdate();
        this.startCameraWatch();
        console.log("[WORLD] Welcome complete");
    }

    // ---------- PERIODIC UPDATE ----------
    /*
    startPeriodicUpdate() {
        if (this.periodicUpdateInterval) {
            console.warn("[UPDATE] Already running");
            return;
        }
        this.periodicUpdateInterval = setInterval(() => {
            this.periodicUpdate();
        }, this.PERIODIC_UPDATE_MS);
    }
*/

    startPeriodicUpdate() {
        if (this.periodicHandle) {
            console.warn("[UPDATE] Already running");
            return;
        }
        // If you sometimes adapt PERIODIC_UPDATE_MS at runtime,
        // you can pass () => this.PERIODIC_UPDATE_MS instead of the number.
        this.periodicHandle = startSafePoll(
            async () => { await this.periodicUpdate(); },
            this.PERIODIC_UPDATE_MS,
            "PeriodicUpdate"
        );
    }

    stopPeriodicUpdate() {
        if (this.periodicHandle) {
            this.periodicHandle.stop();
            this.periodicHandle = null;
        }
    }

    /*
        stopPeriodicUpdate() {
            if (this.periodicUpdateInterval) {
                clearInterval(this.periodicUpdateInterval);
                this.periodicUpdateInterval = null;
                console.log("[UPDATE] Stopped");
            }
        }
    */
    async periodicUpdate() {
        console.log("[UPDATE] Start");

        // NEW: send my avatarID as a heartbeat (if known)
        const myID = this.myAvatar && this.myAvatar.ID ? this.myAvatar.ID : null;
        const query = myID ? `?avatarID=${encodeURIComponent(myID)}` : "";

        const result = await getData("getAllStatuses", query);
        const signs = result.signs || [];
        const avatars = result.avatars || [];

        // update signs
        for (const sign of signs) {
            let currAvatar = this._avatarsArr.find(a => a.avatarID === sign.avatarID);
            if (!currAvatar) {
                currAvatar = this.getFreeAvatar(sign.isMan);
                if (!currAvatar) continue;
                await currAvatar.matchUser(sign);
            } else {
                currAvatar.setState(sign.isLoading ? "loading" : "noChat");
            }
        }
        this.showTestGLBFileNameSigns();

        // update avatar statuses
        // world.js -> periodicUpdate(), in the “apply statuses” loop
        for (const a of avatars) {
            const isSticky = this.stickyUntilDone.has(a.avatarID);

            // Maintain the sticky flag even if the avatar UI isn't instantiated
            if (isSticky && a.status === "done") {
                this.stickyUntilDone.delete(a.avatarID); // clear persistence as soon as they’re done
            }

            const currAvatar = this._avatarsArr.find(v => v.avatarID === a.avatarID);
            if (!currAvatar) continue; // avoid UI errors when avatar object isn't available

            if (isSticky) {
                // While sticky and not yet done -> force "alreadyTalked"
                if (a.status === "done") {
                    currAvatar.setState("done");
                    // sticky already cleared above
                } else {
                    currAvatar.setState("alreadyTalked");
                }
                continue;
            }

            // default: follow server status
            currAvatar.setState(a.status);
        }

        // Auto-open chat window on the callee when server flipped me to inChat
        if (this.myAvatar && !this.currChat) {
            const meSrv = avatars.find(v => v.avatarID === this.myAvatar.ID);
            if (meSrv && meSrv.status === "inChat" && meSrv.partnerID && meSrv.chatID) {
                const partner = this.idToAvatar(meSrv.partnerID);
                if (partner) {
                    this.currChat = new Chat(this.myAvatar, partner, this, meSrv.chatID);
                    if (partner.setState) partner.setState("myChat");
                    if (this.myAvatar.setState) this.myAvatar.setState("myChat");
                    this.walkPartnerIn(partner);
                    console.log("[CHAT] Auto-opened incoming chat:", meSrv.chatID);
                    this.stopPeriodicUpdate();
                    this.allowPointer = false;
                }
            }
        }

        // Auto-close my chat if the server shows I'm no longer inChat (remote ended)
        if (this.myAvatar && this.currChat) {
            const meSrv = avatars.find(v => v.avatarID === this.myAvatar.ID);
            if (meSrv) {
                const partnerID = this.currChat.avatarFromID === this.myAvatar.ID
                    ? this.currChat.avatarToID
                    : this.currChat.avatarFromID;
                const shouldClose =
                    meSrv.status !== "inChat" ||
                    !meSrv.chatID ||
                    meSrv.chatID !== this.currChat.chatID ||
                    meSrv.partnerID !== partnerID;
                if (shouldClose) {
                    const agreed = this.chatAgreed(this.currChat);
                    // Local close (do NOT call /chat/end again)
                    this.currChat.dispose?.();
                    this.currChat = null;
                    this.allowPointer = true;
                    this.startPeriodicUpdate();
                    // visually reset both sides if present
                    const p = this.idToAvatar(partnerID);
                    // NEW: keep partner as "alreadyTalked" until they leave
                    if (p?.setState) p.setState("alreadyTalked");
                    this.stickyUntilDone.add(partnerID);

                    // keep my own state as noChat
                    if (this.myAvatar?.setState) this.myAvatar.setState("noChat");
                    this.walkPartnerHome(agreed);
                    console.log("[CHAT] Auto-closed (remote end detected)");
                }
            }
        }


        console.log("[UPDATE] End");
    }

    // ---------- AVATAR MANAGEMENT ----------
    showTestGLBFileNameSigns() {
        if (this.viewerAvatarID !== "test") return;
        for (const avatar of this._avatarsArr) {
            avatar.showGLBFileNameSign();
        }
    }

    getFreeAvatar(isMan) {
        let genderArray = this._avatarsArr.filter(a => !a.avatarData.isUsed && a.avatarData.loadedIsMan == isMan);
        if (genderArray.length === 0)
            genderArray = this._avatarsArr.filter(a => !a.avatarData.isUsed);
        if (genderArray.length === 0) return false;
        const avatarObj = genderArray[0];
        avatarObj.avatarData.isUsed = true;
        return avatarObj;
    }

    idToAvatar(id) {
        return this._avatarsArr.find(a => a.avatarID === id);
    }

    // ---------- AVATAR ANIMATION (see avatarStateAnimator.js) ----------
    // Every avatar stands in an idle pose until it gets a user; then its sign
    // state drives its clips (Avatar.setState -> onAvatarUiState).
    async startAvatarAnimations() {
        if (typeof setAvatarAnimState !== "function") return;
        const animated = this._avatarsArr.filter(canAnimateAvatar);
        const isManValues = [...new Set(animated.map(a => !!a.avatarData.loadedIsMan))];
        if (isManValues.length === 0) return;
        await preloadStateClips(this.scene, isManValues, ["standing"]);
        animated.forEach(avatar => setAvatarAnimState(avatar, "standing"));
        // The rest downloads in the background, so a clip is ready when its state comes.
        preloadStateClips(this.scene, isManValues);
    }

    /// True while the viewer's camera stands at the center of the circle
    /// (index.html sets window.isCameraAtCenter; the user can walk it out towards
    /// the avatars and back).
    isCameraAtCenter() {
        return typeof window.isCameraAtCenter === "function" ? window.isCameraAtCenter() : true;
    }

    /// Checks the camera a few times a second, only while it is at the center:
    /// walks the chat partner in if it hasn't yet, and lets a waiting avatar react
    /// when the camera points at it.
    startCameraWatch() {
        if (this.cameraWatch) return;
        let elapsedMs = 0;
        this.cameraWatch = this.scene.onBeforeRenderObservable.add(() => {
            elapsedMs += this.scene.getEngine().getDeltaTime();
            if (elapsedMs < CAMERA_WATCH_MS) return;
            const seconds = elapsedMs / 1000;
            elapsedMs = 0;
            if (!this.isCameraAtCenter()) {
                this.gaze = null;
                return;
            }
            this.walkPartnerInIfWaiting();
            this.updateGaze(seconds);
        });
    }

    updateGaze(seconds) {
        const camera = this.scene.activeCamera;
        if (!camera || this.currChat || typeof setAvatarAnimState !== "function") {
            this.gaze = null;
            return;
        }
        const forward = camera.getDirection(BABYLON.Axis.Z);
        forward.y = 0;
        forward.normalize();
        const eye = camera.globalPosition || camera.position;

        let target = null;
        let targetDegrees = LOOK_AT_MAX_DEGREES;
        for (const avatar of this._avatarsArr) {
            if (avatar === this.myAvatar || !avatar.userData?.avatarID || !canAnimateAvatar(avatar)) continue;
            const toAvatar = avatar.avatarMesh.position.subtract(eye);
            toAvatar.y = 0;
            if (toAvatar.lengthSquared() < 0.0001) continue;
            toAvatar.normalize();
            const degrees = BABYLON.Tools.ToDegrees(Math.acos(BABYLON.Scalar.Clamp(BABYLON.Vector3.Dot(forward, toAvatar), -1, 1)));
            if (degrees < targetDegrees) {
                target = avatar;
                targetDegrees = degrees;
            }
        }

        if (!target) {
            this.gaze = null;
            return;
        }
        if (!this.gaze || this.gaze.avatar !== target) {
            this.gaze = { avatar: target, seconds: 0, reacted: false };
            return;
        }
        this.gaze.seconds += seconds;
        const now = performance.now();
        if (!this.gaze.reacted
            && this.gaze.seconds >= LOOK_AT_DWELL_SECONDS
            && getAvatarAnimState(target) === "waiting"
            && now >= (target._lookAtReadyAt || 0)) {
            this.gaze.reacted = true; // once per look
            target._lookAtReadyAt = now + LOOK_AT_COOLDOWN_SECONDS * 1000;
            setAvatarAnimState(target, "lookedAt");
        }
    }

    /// Whether we both chose [agree]: my own last choice, and a [dealDone] line in
    /// the chat that isn't mine and no [noDeal] line that isn't mine (the chat text
    /// doesn't say who wrote a line, so the Chat counts the lines I sent).
    chatAgreed(chat) {
        if (!chat || chat.dealResult !== "dealDone") return false;
        const text = (chat.getText && chat.getText()) || "";
        const count = line => text.split(line).length - 1;
        const partnerAgreed = count("[dealDone]") > (chat.myDealDoneLines || 0);
        const partnerRefused = count("[noDeal]") > (chat.myNoDealLines || 0);
        return partnerAgreed && !partnerRefused;
    }

    // ---------- CHAT WALK (see walkAvatar.js) ----------
    // The chat partner plays its "accepted" clip and walks from its place on the
    // circle towards the center (the viewer) when a chat starts, and back when it
    // ends. It only walks in while the camera is at the center; if the camera is
    // out towards the avatars, it waits for the camera to come back.
    walkPartnerIn(partner) {
        if (!partner?.avatarMesh) return;
        if (this.chatPartner && this.chatPartner !== partner) this.walkPartnerHome(false);
        this.chatPartner = partner;
        if (typeof canAnimateAvatar === "function" && canAnimateAvatar(partner)) {
            setAvatarAnimState(partner, "accepted");
        } else {
            this.walkPartnerInIfWaiting(); // no clips (lego avatars): just walk
        }
    }

    /// Walk the chat partner in if it hasn't yet and the camera is at the center.
    walkPartnerInIfWaiting() {
        const partner = this.chatPartner;
        if (!partner || partner._walkedIn || !this.isCameraAtCenter()) return;
        if (typeof canAnimateAvatar === "function" && canAnimateAvatar(partner)) {
            // Waits for the "accepted" clip, which walks in by itself.
            if (getAvatarAnimState(partner) === "talking") setAvatarAnimState(partner, "walkingIn");
            return;
        }
        partner._walkedIn = true;
        partner.walkToCenter({ stopDistance: CHAT_WALK_STOP_DISTANCE })
            .catch(err => console.warn("[WALK] walk to center failed:", err));
    }

    /// The chat with the partner ended: it plays its end clip (agreed or not) and
    /// walks back to its place.
    walkPartnerHome(agreed = false) {
        const partner = this.chatPartner;
        if (!partner) return;
        this.chatPartner = null;
        if (typeof canAnimateAvatar === "function" && canAnimateAvatar(partner)) {
            setAvatarAnimState(partner, agreed ? "endAgree" : "endNoAgree");
            return;
        }
        partner._walkedIn = false;
        partner.walkHome()
            .catch(err => console.warn("[WALK] walk home failed:", err));
    }

    ///find by registry id ("avatar8"...), e.g. myWorld.registryIdToAvatar("avatar8").walkToCenter()
    registryIdToAvatar(registryId) {
        return this._avatarsArr.find(a => a.avatarData.id === registryId);
    }

    // ---------- CHAT ----------


    async chatRequest(toID) {
        if (!this.periodicHandle) {
            console.warn("[CHAT] periodicUpdate is paused; cannot start chat");
            this.startPeriodicUpdate();
            return;
        }
        try {
            // Resolve the target avatar (for UI state changes & logs)
            const toAvatar = this.idToAvatar ? this.idToAvatar(toID) : null;
            console.log("[CHAT] Request ->", toID);

            // Prevent double clicks while we work
            if (this.allowPointer !== undefined) this.allowPointer = false;

            // Call server to start the chat (server is the source of truth for chatID)
            const res = await postData("chat/start", {
                fromAvatarID: this.myAvatar.ID,
                toAvatarID: toID,
                messageId: (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
            });

            // Specific mappings for structured errors returned by postData
            if (typeof isErrorResponse === "function" && isErrorResponse(res)) {
                const err = (res.error || "").toString();

                // Pair already chatted (ever) -> permanent "alreadyTalked"
                if (err === "pairNotAllowed") {
                    if (toAvatar?.setState) toAvatar.setState("alreadyTalked");
                    this.stickyUntilDone.add(toID);
                    console.log("[CHAT] pairNotAllowed -> alreadyTalked:", toID);
                    return;
                }

                // Callee is currently in another chat -> short refusal message
                if (err === "calleeBusy") {
                    if (toAvatar?.setState) {
                        const prev = toAvatar.currState || "noChat";
                        toAvatar.setState("refuseChat");
                        setTimeout(() => { if (!this.currChat) toAvatar.setState(prev); }, 1200);
                    }
                    console.log("[CHAT] calleeBusy -> temporary refuseChat:", toID);
                    return;
                }

                // Other errors -> generic short refusal
                if (toAvatar?.setState) {
                    const prev = toAvatar.currState || "noChat";
                    toAvatar.setState("refuseChat");
                    setTimeout(() => { if (!this.currChat) toAvatar.setState(prev); }, 1200);
                }
                console.warn("[CHAT] start rejected:", res);
                return;
            }

            // Must have a chatID on success
            if (!res || isErrorResponse(res) || !res.chatID) {
                if (toAvatar?.setState) {
                    const prev = toAvatar.currState || "noChat";
                    toAvatar.setState("refuseChat");
                    setTimeout(() => { if (!this.currChat) toAvatar.setState(prev); }, 1200);
                }
                console.warn("[CHAT] start missing chatID:", res);
                return;
            }

            // Success: open the chat window using server-authoritative chatID
            if (!toAvatar) {
                console.warn("[CHAT] toAvatar not found for id:", toID);
                return;
            }

            this.currChat = new Chat(this.myAvatar, toAvatar, this, res.chatID);
            this.stopPeriodicUpdate();
            this.allowPointer = false;
            if (toAvatar.setState) toAvatar.setState("myChat");
            if (this.myAvatar?.setState) this.myAvatar.setState("myChat");
            this.walkPartnerIn(toAvatar);
            console.log("[CHAT] Started with chatID:", res.chatID);

        } catch (err) {
            console.warn("[CHAT] start failed:", err);
        } finally {
            if (this.allowPointer !== undefined) this.allowPointer = true;
        }
    }


    /*
      async chatRequest(toID) {
        const toAvatar = this.idToAvatar(toID);
        if (this.currChat || !toAvatar) return;
    
        console.log("[CHAT] Request to:", toID);
    
        // verify availability
        const checkMsg = {
          avatarID: toID,
          attr: "status",
          requiredValue: "noChat",
          newValue: "inChat"
        };
        const result = await postData("checkAndUpdate", checkMsg).catch(e => {
          console.error("[CHAT] checkAndUpdate failed:", e);
          return null;
        });
    
        if (!result || result.error === "preconditionFailed") {
          toAvatar.setState("refuseChat");
          this.allowPointer = true;
          console.warn("[CHAT] Refused (busy)");
          return;
        }
    
        this.allowPointer = false;
    
        try {
          const res = await postData("chat/start", {
            fromAvatarID: this.myAvatar.ID,
            toAvatarID: toID,
            messageId: crypto.randomUUID()
          });
          this.currChat = new Chat(this.myAvatar, toAvatar, this);
          console.log("[CHAT] Started:", res.chatID);
        } catch (err) {
          console.error("[CHAT] start failed:", err);
          this.allowPointer = true;
        }
      }
    */

    async closeChat(fromID, toID, result) {
        if (!this.currChat) return;
        const agreed = this.chatAgreed(this.currChat);
        try {
            await postData("chat/end", {
                chatID: this.currChat.chatID,
                fromAvatarID: fromID,
                toAvatarID: toID,
                dealResult: result
            });
            /*
            await Promise.all([
                patchData(fromID, "status", "noChat"),
                patchData(toID, "status", "noChat")
            ]);
            */
            console.log("[CHAT] Ended");
        } catch (e) {
            console.error("[CHAT] closeChat error:", e);
        } finally {
            this.currChat?.dispose?.();
            this.currChat = null;
            this.allowPointer = true;
            this.walkPartnerHome(agreed);

            const partnerID = toID;
            this.stickyUntilDone.add(partnerID);
            const partner = this.idToAvatar(partnerID);
            if (partner?.setState) partner.setState("alreadyTalked");

            await this.periodicUpdate();
            this.startPeriodicUpdate();
        }
    }

    // ---------- DEAL & CHAT UPDATES ----------
    async dealDoneSelected(chatID, fromID, toID) {
        await this._sendDealResult(chatID, fromID, toID, "dealDone");
    }

    async dealNotDoneSelected(chatID, fromID, toID) {
        await this._sendDealResult(chatID, fromID, toID, "noDeal");
    }

    async _sendDealResult(chatID, fromID, toID, result) {
        try {
            await postData("chat/sendLine", {
                chatID,
                fromAvatarID: fromID,
                toAvatarID: toID,
                newLine: `[${result}]`
            });
            console.log("[CHAT] Deal result sent:", result);
        } catch (e) {
            console.error("[CHAT] dealResult failed:", e);
        }
    }

    async updateChat(chatID, fromID, toID, text) {
        try {
            await postData("chat/sendLine", {
                chatID,
                fromAvatarID: fromID,
                toAvatarID: toID,
                newLine: text
            });
            console.log("[CHAT] Line sent");
        } catch (e) {
            console.error("[CHAT] sendLine error:", e);
        }
    }

    chatStarted(fromID, toID) {
        console.log("[CHAT] Started between", fromID, toID);
    }

    chatUpdated(chatText, destID) {
        if (this.myAvatar.ID === destID && this.currChat) {
            this.currChat.updateText(chatText);
        }
    }

    dealResult(fromID, toID, senderAnswer, destAnswer) {
        if (!this.currChat) return;
        console.log("[CHAT] Deal result:", senderAnswer, destAnswer);
        if (senderAnswer === "dealDone" && destAnswer === "dealDone")
            this.currChat.setChatState("done");
        else if (senderAnswer === "noDeal" && destAnswer === "noDeal")
            this.currChat.setChatState("notDone");
        else this.currChat.setChatState("mixed");
    }
    /// not in use?
    chatEnded(fromID, toID, chatID) {
        console.log("[CHAT] End signal from", fromID, toID);
        if (this.currChat && this.currChat.chatID === chatID) {
            const agreed = this.chatAgreed(this.currChat);
            this.currChat.dispose();
            this.currChat = null;
            this.allowPointer = true;
            this.startPeriodicUpdate();
            this.walkPartnerHome(agreed);
        }
        const fromA = this.idToAvatar(fromID);
        const toA = this.idToAvatar(toID);
        if (fromA) fromA.setState("noChat");
        if (toA) toA.setState("noChat");
    }

    doAvatarLeft(id) {
        console.log("[WORLD] Avatar left:", id);
        const a = this.idToAvatar(id);
        if (a) a.setDone();
    }

    doSetStatus(id, status) {
        const a = this.idToAvatar(id);
        if (a) a.setState(status);
    }

    safeStringifySkipMyWorld(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (k, v) => {
            if (k === "myWorld") return undefined;
            if (typeof v === "object" && v !== null) {
                if (seen.has(v)) return "[Circular]";
                seen.add(v);
            }
            return v;
        }, 2);
    }
}

// Export globally for index.html and message.js
window.World = World;

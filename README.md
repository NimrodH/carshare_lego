**Run the app:** [Production (main)](https://nimrodh.github.io/carshare_lego/)

**Ready Player Me animations (previews):** [All categories](https://github.com/readyplayerme/animation-library#animations) · [Feminine clips](https://github.com/readyplayerme/animation-library/tree/master/feminine/webp) · [Masculine clips](https://github.com/readyplayerme/animation-library/tree/master/masculine/webp)

# carshare_lego

A Babylon.js 3D world for finding a carpool partner. Each participant fills in their travel days and times, gets an avatar with a sign showing those details, and can open a chat with another participant to agree on a ride.

## Run locally

GLB avatars don't load from `file://`, so serve the folder over HTTP:

```
npm install
npm run dev
```

Then open http://localhost:5500/.

## Functionality

1. **Start form.** The viewer enters an ID, name, gender, address, whether they are a driver and/or a passenger, and the times they travel from home and back on days א–ה (Sunday–Thursday).
2. **The circle.** The scene shows a ring of avatar places (listed in [avatarRegistry.js](avatarRegistry.js)). Every participant who has joined gets a free place that matches their gender, with a green sign showing their travel details. The viewer's own avatar is marked as "me".
3. **Looking around.** The camera stays in the center of the circle and turns to face one avatar at a time. Hovering over a sign shows its text in a larger popup.
4. **Chat.** Clicking the button on a sign asks that participant for a chat. If they are free, the chat opens. Both sides type lines, and at the end each side picks "deal" or "no deal". A pair can chat only once: afterwards the other avatar is marked "already talked".
5. **Updates.** Every 10 seconds the page asks the server for everyone's status, so new participants appear and busy ones show as busy.

### Groups: what the viewer sees

The **first letter of the ID** typed in the start form sets the viewer's group. The group decides how *every* participant looks on that viewer's screen; another viewer sees the same people in their own group's style.

| Group | ID starts with | What the viewer sees |
|---|---|---|
| **A** | `A` | **Lego avatars.** Each avatar is built from lego blocks, from the "man" model saved by the lego builder (read from the lego model server), in random block colors. They have no skeleton, so they play no clips: they slide when they move. The camera aims at the head of the avatar it faces. |
| **B** | anything other than `A` or `C` (for example `B`) | **Ready Player Me avatars.** A woman's or a man's GLB from `Avatars/weman/` or `Avatars/Mans/`, depending on the place. They are animated with Ready Player Me clips: idle while waiting, a short expression when the camera looks at them, walking in for the chat, talking during it, a dance at the end if they agreed (another expression if not), and walking back. |
| **C** | `C` | **Signs only.** No avatar body is shown (one GLB is loaded and hidden, only to carry the sign) and nothing is animated. |

Which clip each state plays is set in [avatarStateClips.js](avatarStateClips.js).

## Ready Player Me avatars and animations

> **Note:** readyplayer.me and models.readyplayer.me did not respond when this was written (November 2026), so the avatar steps below may no longer work. The avatars this app needs are already in `Avatars/`, and the animation library is still on GitHub.

### Avatars

- **Create:** make the avatar in the Ready Player Me avatar creator (readyplayer.me). Each avatar gets an ID, and its model is at `https://models.readyplayer.me/<avatar-id>.glb`.
- **Download:** open that URL and save the `.glb` file into `Avatars/weman/` (women) or `Avatars/Mans/` (men). The file names in those folders are the avatar IDs.
- **Use:** in [avatarRegistry.js](avatarRegistry.js), each place has `avatarURL` (the woman's GLB) and `avatarURLBoy` (the man's GLB). The app picks one of the two by whether the place number is even or odd. Instead of a local file you can also link the online `models.readyplayer.me` URL there, but a file in the repo loads faster and doesn't depend on Ready Player Me's servers.

### Animations

The clips come from the [Ready Player Me animation library](https://github.com/readyplayerme/animation-library) on GitHub. It has a `masculine/` and a `feminine/` folder, each holding the clips as `glb/` (used here), `fbx/` and `webp/` (moving previews), in the categories `dance`, `expression`, `idle` and `locomotion`.

- **Link (how the app works now):** `WALK_CLIP_BASE_URL` in [walkAvatar.js](walkAvatar.js) points at the library on GitHub, pinned to one commit so the clips can't change under the app:

  ```
  https://raw.githubusercontent.com/readyplayerme/animation-library/c841f8ba6f290b62fa0a3c19dddd0e5e8444f1e5/
  ```

  A clip's URL is that base plus `<masculine|feminine>/glb/<category>/<name>.glb`, for example `masculine/glb/dance/M_Dances_001.glb`. Men's avatars get the masculine clip and women's the feminine one.
- **Download:** clone or download the library (`git clone https://github.com/readyplayerme/animation-library.git`), copy its `masculine/` and `feminine/` folders into a local folder such as `Avatars/animations/` with the same layout, and set `WALK_CLIP_BASE_URL = "Avatars/animations/"`.
- **License:** the clips are free to use with Ready Player Me avatars but may not be redistributed (see the library's [LICENSE.md](https://github.com/readyplayerme/animation-library/blob/master/LICENSE.md)). This repo and its GitHub Pages site are public, so committing a downloaded copy here would redistribute them. That is why the app links to GitHub instead.
- **Add a clip to a state:** write its name without the `F`/`M` prefix in [avatarStateClips.js](avatarStateClips.js), for example `"_Dances_001"`. The known names are listed in `RPM_CLIP_CATALOG` in [avatarClips.js](avatarClips.js).

## Data sent to the server

The page talks to an AWS API Gateway at `https://t8l4i3853e.execute-api.us-east-1.amazonaws.com/V1/`, through the helpers `getData`, `postData` and `patchData` in [index.html](index.html). Nothing is sent before the start form is submitted.

| When | Request | Data sent |
|---|---|---|
| Start form submitted | `POST addAvatar` | Everything in the form: `avatarID`, `userName`, `isMan`, `address`, `isDriver`, `isPassenger`, `day1to` … `day5to` (time leaving home), `day1back` … `day5back` (time going back), plus `isLoading: true` |
| Avatars finished loading | `PATCH avatars/<avatarID>` | `{ "field": "isLoading", "value": false }` |
| Every 10 s, and every 2 s during a chat | `GET getAllStatuses?avatarID=<my ID>` | The viewer's ID only; it also tells the server the viewer is still here. The reply holds every participant's sign data and status. |
| Clicking a sign's chat button | `POST chat/start` | `fromAvatarID`, `toAvatarID` and a random `messageId` |
| Each chat line | `POST chat/sendLine` | `chatID`, `fromAvatarID`, `toAvatarID`, `newLine` (`"<name>: <text>"`) |
| "Deal" or "no deal" pressed | `POST chat/sendLine` | The same, with `newLine` set to `"[dealDone]"` or `"[noDeal]"` |
| During a chat, every 2 s | `GET chat/getText?chatID=<id>` | The chat ID only |
| Chat closed | `POST chat/end` | `chatID`, `fromAvatarID`, `toAvatarID`, `dealResult` (`"dealDone"` or `"notDone"`) |
| Leaving or closing the page | `PATCH avatars/<avatarID>` | `{ "field": "status", "value": "done" }` |

**Group A only:** to build the lego avatars, the page also reads the lego models from `https://9ewp86ps3e.execute-api.us-east-1.amazonaws.com/development/model` (`GET`, sending only `myStep=ALL`).

The WebSocket code in `index.html` is turned off (`USE_WS = false`). The scripts that run on the server side are in `server/`.

## More

- **Animation code:** `walkAvatar.js` (walking), `avatarClips.js` (playing any clip), `avatarStateClips.js` (which clip each state plays) and `avatarStateAnimator.js` (runs the states).
- **[old_anim/](old_anim/):** files the app no longer loads (the old pose and motion-sequence system, the lego builder page and the animation demo page). Kept for reference; their script paths are not updated.

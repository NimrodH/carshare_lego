**Run the app:** [Production (main)](https://nimrodh.github.io/carshare_lego/)

# carshare_lego

A Babylon.js 3D world with Ready Player Me avatars: poses, walk animations and a chat between avatars.

## Run locally

GLB avatars don't load from `file://`, so serve the folder over HTTP:

```
npm install
npm run dev
```

Then open http://localhost:5500/.

## More

- Avatars animate with clips from the [Ready Player Me animation library](https://github.com/readyplayerme/animation-library): `walkAvatar.js`, `avatarClips.js`, `avatarStateClips.js` and `avatarStateAnimator.js`.
- [old_anim/](old_anim/): files the app no longer loads (the old pose and motion-sequence system, the lego builder page and the animation demo page). Kept for reference; their script paths are not updated.

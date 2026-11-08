# A little Diwali light for Khushi

A personal, interactive Diwali greeting from Tomato to Khushi. It is built with plain HTML, CSS, and JavaScript, with no external assets, libraries, build step, or server-side APIs. The layout adapts to phones and tablets, uses touch-friendly controls, and respects reduced-motion settings.

## Run locally

From the project directory, start any static file server. For example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy to Cloudflare Pages

This is a static site and works with Cloudflare Pages' standard static hosting:

1. Connect this repository in **Workers & Pages → Create → Pages → Connect to Git**.
2. Set the framework preset to **None**.
3. Leave the build command empty.
4. Set the build output directory to `.` (the repository root).
5. Deploy.

The entry page is `index.html`. The sound effects are synthesized in the browser with the Web Audio API after the visitor turns sound on; there are no audio files or autoplay. Fireworks and rangoli artwork are drawn locally in the browser, so the page does not depend on external services or assets.

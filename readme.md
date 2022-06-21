# `<nftfx-viewer>` component

The `<nftfx-viewer>` component is a web component that renders an animated NFT powered by WebGL-shaders.

## Getting started

```sh
npm i @nftfx/nftfx-viewer
```

### JavaScript

```js
import { NFTFXViewer } from 'https://cdn.skypack.dev/nftfx-viewer';
```

### CSS

You can style your shader-element according to your needs. Just provide a `display: block` (default would be display: inline) and specify a width and height according to your needs.

```css
nftfx-viewer {
  display: block;
  width: 100vmin;
  height: 100vmin;
}
```

### HTML

The HTML structure of a shader-art component looks like this:

```html
<nftfx-viewer autoplay url="https://arweave-or-ipfs-proxy/path-to-nftfx-metadata.json" />
```

## Provided uniforms

- `uniform float time`: number of ticks passed
- `uniform vec2 resolution`: resolution of the canvas

import * as THREE from 'three';

import { MultipassRenderer, RenderPassParams } from './multipass-renderer.js';
import { isNFTFXMetadata, NFTFXMetadata } from './metaplex-metadata-nftfx';
import { makeAbsUrl, MESSAGE_CSS, safeFetch, safeFetchJson } from './utils.js';

///////////////////////////

export class NFTFXViewer extends HTMLElement {

    public renderer?: THREE.WebGLRenderer;
    public multipassRenderer?: MultipassRenderer;
    public allTexturesLoaded?: Promise<boolean>;

    private uniforms: Record<string, THREE.IUniform<any>> = {};
    // private mouseX: number = 0;
    // private mouseY: number = 0;
    private startTime: number = 0;
    private metadata: Promise<NFTFXMetadata>;
    private $message: HTMLDivElement = document.createElement('div');

    static register() {
        if (typeof customElements.get('nftfx-viewer') === 'undefined') {
            customElements.define('nftfx-viewer', NFTFXViewer);
        }
    }

    static get observedAttributes() {
        return ['width', 'height', 'url'];
    }

    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        console.log(`[nftfx.attributeChangedCallback] Attribute "${name}" changed from "${oldValue}" to "${newValue}"`);
        this.render();
    }

    get width() {
        return parseInt(this.getAttribute("width") ?? '500');
    }

    get height() {
        return parseInt(this.getAttribute("height") ?? '500');
    }

    get url() {
        return this.getAttribute("url");
    }

    get autoplay() {
        return this.getAttribute("autoplay") === 'true';
    }

    constructor() {
        super();
        console.log('[nftfx.init] 1');

        this.style.width = `${this.width}px`;
        this.style.height = `${this.height}px`;
        this.style.display = `block`;
        this.style.position = 'relative';
        this.style.backgroundColor = '#333';
        this.style.font = 'bold 13px sans-serif';
        this.style.color = '#eee';
        this.appendChild(this.$message);
        this.setMessage('NFTFX LOADING...');

        this.metadata = this.url
            ? safeFetchJson<NFTFXMetadata>(this.url)
            : Promise.resolve(this.getMetadataFromScript()).then(res => {
                if (res === null)
                    throw new Error('Cannot get metadata from &lt;script&gt;');
                else
                    return res;
            });
        this.metadata
            .catch(this.renderError.bind(this));
        this.init()
            .catch(this.renderError.bind(this));
    }

    async init() {
        // const THREE = window['THREE'];

        // this.camera = new THREE.Camera();
        // this.camera.position.z = 1;
        // this.scene = new THREE.Scene();

        this.startTime = Date.now();

        const metadata = await this.metadata;
        if (!isNFTFXMetadata(metadata)) {
            console.error('[NFTFXViewer.init] Wrong metadata format', metadata);
            throw new Error('Wrong metadata format');
        }
        this.style.backgroundImage = `url(${(await this.metadata).image})`;
        this.style.backgroundSize = 'contain';
        const attributes: Record<string, string | number> = metadata.attributes
            .reduce((acc, x) => ({ ...acc, [x.trait_type]: x.value }), {});
        const shaderOptions = metadata.properties.nftfx;
        console.log('[nftfx.init] Manifest:', metadata);
        const absUrl = makeAbsUrl(metadata);
        console.log('attributes', attributes);

        const makeResourceUrl = (url: string) =>
            url.replace(/\$\w+\$/g, x =>
                (attributes[x.replace(/\$/g, '')] ?? x).toString()
            );

        // 1
        const shaders = await Promise.all(
            Object.entries(shaderOptions.shaders)
                .map(([name, url]) =>
                    safeFetch(absUrl(makeResourceUrl(url)))
                        .then(res => res.text())
                        .then(res => [name, res])
                )
        );

        // 2
        const uniforms: Record<string, THREE.IUniform<any>> = Object
            .entries(shaderOptions.uniforms)
            .reduce((acc, [name, value]) => ({ ...acc, [name]: { value } }), {}); // type: 'i', 
        this.uniforms = {
            time: { value: 0.0 }, // type: "f", 
            resolution: { value: new THREE.Vector2() }, // type: "v2", 
            ...uniforms,
        };

        // 3
        let pendingTextures = Object.keys(shaderOptions.textures).length;
        this.allTexturesLoaded = new Promise((resolve, reject) => {
            Object.entries(shaderOptions.textures)
                .forEach(([name, url]) => {
                    const txurl = absUrl(makeResourceUrl(url));
                    const texture = new THREE.TextureLoader().load(
                        txurl,
                        () => {
                            pendingTextures--;
                            console.log('[TextureLoader.onLoad]', pendingTextures);
                            if (!pendingTextures)
                                resolve(true);
                        },
                        undefined,
                        e => reject(`[TextureLoader] Cannot load texture ${txurl}`) //this.renderError.bind(this)
                    );
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    // texture.repeat.set(1, 1);
                    this.uniforms[name] = { value: texture }; // type: 't', 
                });
        });
        await this.allTexturesLoaded;
        console.log('[nftfx.init] allTexturesLoaded');
        this.setMessage('');

        const pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.appendChild(this.renderer.domElement);

        this.uniforms.resolution.value.x = this.width * pixelRatio;
        this.uniforms.resolution.value.y = this.height * pixelRatio;

        const passes: Record<string, RenderPassParams> = shaders
            .reduce((acc, [name, shader], i) => ({
                ...acc,
                [name]: {
                    fragmentShader: shader,
                    uniforms: { ...this.uniforms },
                }
            }), {});
        console.log('[init]', shaders, passes);
        this.multipassRenderer = new MultipassRenderer(this.renderer, passes);

        console.log(this);
        this.runAnimation();
    }

    private getMetadataFromScript(): NFTFXMetadata | null {
        const text = this.querySelector('script[type="text/nftfx"]')?.textContent;
        return text ? JSON.parse(text) : null;
    }

    private setMessage(msg: string) {
        this.$message.innerHTML = !msg ? '' : `<p style="${MESSAGE_CSS}">${msg}</p>`;
    }

    private renderError(error: any, throwError: boolean = true) {
        const msg = error
            ? `ERROR: ${error.toString().replace('Error: ', '')}`
            : `Unknown error`;
        this.setMessage(msg);
        if (throwError)
            throw error;
    }

    runAnimation() {
        if (this.autoplay)
            requestAnimationFrame(this.runAnimation.bind(this));
        this.render();
    }

    render(doScreenshot = false) {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        this.uniforms.time.value = elapsedSeconds;

        // this.renderer.render(this.scene, this.camera);
        this.multipassRenderer!.render();
        if (doScreenshot) {
            return this.renderer!.domElement.toDataURL();
        }
    }

}

NFTFXViewer.register();

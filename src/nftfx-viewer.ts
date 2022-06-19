import * as THREE from 'three';

import { MultipassRenderer, RenderPassParams } from './multipass-renderer.js';
import { isNFTFXMetadata, NFTFXMetadata } from './metaplex-metadata-nftfx';
import { makeAbsUrl, makeResourceUrl, MESSAGE_CSS, safeFetch, safeFetchJson, setStyle } from './utils.js';

///////////////////////////

type ObservedAttributes = 'width' | 'height' | 'url' | 'autoplay';

export class NFTFXViewer extends HTMLElement {

    public renderer?: THREE.WebGLRenderer;
    public multipassRenderer?: MultipassRenderer;
    public allTexturesLoaded?: Promise<boolean>;
    public isInitialized: boolean = false;
    public frame: number = 0;

    private uniforms: Record<string, THREE.IUniform<any>> = {};
    // TODO: add mouse pointer support
    // private mouseX: number = 0;
    // private mouseY: number = 0;
    private startTime: number = 0;
    private metadata?: Promise<NFTFXMetadata>;
    private $message: HTMLDivElement = document.createElement('div');

    static register() {
        if (typeof customElements.get('nftfx-viewer') === 'undefined') {
            customElements.define('nftfx-viewer', NFTFXViewer);
        }
    }

    static get observedAttributes(): ObservedAttributes[] {
        return ['width', 'height', 'url', 'autoplay'];
    }

    public attributeChangedCallback(name: ObservedAttributes, oldValue: any, newValue: any) {
        console.log(`[nftfx.attributeChangedCallback] Attribute "${name}" changed from "${oldValue}" to "${newValue}"`);
        if (!this.isInitialized)
            return;
        if (name === 'autoplay' && newValue === 'true') {
            this.runAnimation();
        } else {
            this.render();
        }
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
        console.log('[nftfx] Web-component initialization started');

        this.style.width = `${this.width}px`;
        this.style.height = `${this.height}px`;
        this.style.display = `block`;
        this.style.position = 'relative';
        this.style.backgroundColor = '#333';
        this.style.font = 'bold 13px sans-serif';
        this.style.color = '#eee';
        setStyle(this.$message, MESSAGE_CSS);
        this.appendChild(this.$message);

        if (this.url || this.querySelector('script[type="text/nftfx"]')) {
            this.init().catch(this.renderError.bind(this));
        }
    }

    public async init(newMetadata?: NFTFXMetadata) {
        // CLEANUP
        this.setMessage('NFTFX LOADING...');
        this.isInitialized = false;
        this.uniforms = {}
        // if (this.renderer)
        //     this.removeChild(this.renderer.domElement);
        const oldCanvas = this.querySelector('canvas');
        if (oldCanvas)
            this.removeChild(oldCanvas);

        // FETCH METADATA
        if (newMetadata) {
            this.metadata = Promise.resolve(newMetadata);
        } else {
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
        }

        // PROCESS METADATA
        const metadata = await this.metadata;
        console.log('[nftfx.init] Metadata:', metadata);
        if (!isNFTFXMetadata(metadata)) {
            console.error('[NFTFXViewer.init] Wrong metadata format', metadata);
            throw new Error('Wrong metadata format');
        }
        const nftfxProps = metadata.properties.nftfx;
        const absUrl = makeAbsUrl(metadata);
        const resourceUrl = makeResourceUrl(metadata);
        this.style.backgroundSize = 'contain';
        this.style.backgroundImage = `url(${metadata.image})`;

        // SHADERS
        const shaders: string[][] = await Promise.all(
            Object.entries(nftfxProps.shaders)
                .map(([name, url]) =>
                    safeFetch(absUrl(resourceUrl(url)))
                        .then(res => res.text())
                        .then(res => [name, res])
                )
        );

        // UNIFORMS
        const uniforms: Record<string, THREE.IUniform<any>> = Object
            .entries(nftfxProps.uniforms)
            .reduce((acc, [name, value]) => ({ ...acc, [name]: { value } }), {}); // type: 'i', 
        this.uniforms = {
            time: { value: 0.0 }, // type: "f", 
            resolution: { value: new THREE.Vector2() }, // type: "v2", 
            ...uniforms,
        };

        // TEXTURES
        await (this.allTexturesLoaded = this.loadTextures(metadata));
        console.log('[nftfx.init] allTexturesLoaded');

        // SETUP RENDERER
        this.setMessage('');
        this.initRenderer(shaders);
        this.startTime = Date.now();
        this.isInitialized = true;
        this.runAnimation();
        return true;
    }

    private initRenderer(shaders: string[][]) {
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
        console.log('[nftfx.init]', shaders, passes);
        this.multipassRenderer = new MultipassRenderer(this.renderer, passes);
    }

    private loadTextures(metadata: NFTFXMetadata) {
        const absUrl = makeAbsUrl(metadata);
        const resourceUrl = makeResourceUrl(metadata);

        const textures = metadata.properties.nftfx.textures;
        let pendingTextures = Object.keys(textures).length;
        return new Promise<boolean>((resolve, reject) => {
            Object.entries(textures)
                .forEach(([name, url]) => {
                    const txurl = absUrl(resourceUrl(url));
                    const texture = new THREE.TextureLoader().load(
                        txurl,
                        () => {
                            pendingTextures--;
                            console.log('[TextureLoader.onLoad]', pendingTextures);
                            if (!pendingTextures)
                                resolve(true);
                        },
                        undefined,
                        e => reject(`[TextureLoader] Cannot load texture ${txurl}`)
                    );
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    // texture.repeat.set(1, 1);
                    this.uniforms[name] = { value: texture }; // type: 't', 
                });
        });
    }

    private getMetadataFromScript(): NFTFXMetadata | null {
        const text = this.querySelector('script[type="text/nftfx"]')?.textContent;
        return text ? JSON.parse(text) : null;
    }

    private setMessage(msg: string) {
        if (msg) {
            this.$message.style.display = 'block';
            this.$message.innerHTML = msg;
        } else {
            this.$message.style.display = 'none';
            this.$message.innerHTML = '';
        }
    }

    private renderError(error: any, throwError: boolean = true) {
        const msg = error
            ? `ERROR: ${error.toString().replace('Error: ', '')}`
            : `Unknown error`;
        this.setMessage(msg);
        if (throwError)
            throw error;
    }

    private runAnimation() {
        if (this.isInitialized && this.autoplay)
            requestAnimationFrame(this.runAnimation.bind(this));
        this.render();
    }

    public render(doScreenshot = false) {
        this.frame++;
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        this.uniforms.time.value = elapsedSeconds;

        this.multipassRenderer!.render();
        if (doScreenshot) {
            return this.renderer!.domElement.toDataURL();
        }
    }

}

NFTFXViewer.register();

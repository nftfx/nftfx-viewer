import * as THREE from 'three';
import { MultipassRenderer } from './multipass-renderer.js';
import { NFTFXMetadata } from './metaplex-metadata-nftfx';
declare type ObservedAttributes = 'width' | 'height' | 'url' | 'autoplay';
export declare class NFTFXViewer extends HTMLElement {
    renderer?: THREE.WebGLRenderer;
    multipassRenderer?: MultipassRenderer;
    allTexturesLoaded?: Promise<boolean>;
    isInitialized: boolean;
    frame: number;
    private uniforms;
    private startTime;
    private metadata?;
    private $message;
    private animationFrame;
    static register(): void;
    static get observedAttributes(): ObservedAttributes[];
    attributeChangedCallback(name: ObservedAttributes, oldValue: any, newValue: any): void;
    get width(): number;
    get height(): number;
    get url(): string | null;
    get autoplay(): boolean;
    constructor();
    connectedCallback(): void;
    init(newMetadata?: NFTFXMetadata): Promise<boolean>;
    private initRenderer;
    private loadTextures;
    private getMetadataFromScript;
    private setMessage;
    private renderError;
    private runAnimation;
    render(doScreenshot?: boolean): string | undefined;
}
export {};

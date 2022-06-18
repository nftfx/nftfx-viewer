import * as THREE from 'three';
import { MultipassRenderer } from './multipass-renderer.js';
export declare class NFTFXViewer extends HTMLElement {
    renderer?: THREE.WebGLRenderer;
    multipassRenderer?: MultipassRenderer;
    allTexturesLoaded?: Promise<boolean>;
    private uniforms;
    private startTime;
    private metadata;
    private $message;
    static register(): void;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: any, newValue: any): void;
    get width(): number;
    get height(): number;
    get url(): string | null;
    get autoplay(): boolean;
    constructor();
    init(): Promise<void>;
    private getMetadataFromScript;
    private setMessage;
    private renderError;
    runAnimation(): void;
    render(doScreenshot?: boolean): string | undefined;
}

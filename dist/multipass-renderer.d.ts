/**
 *
 * Add post processing to a scene
 * Taken from https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
 * and improved to add the ability to handle multiple passes
 *
 * To use it, simply declare:
 * `const post = new MultiPostFX({renderer: rendering});`
 *
 * Then on update, instead of:
 * `rendering.render(scene, camera);`
 * replace with:
 * `post.render(scene, camera);`
 *
 * To resize it, just use:
 * `post.resize();`
 *
 * To update a specific uniform just do:
 * `post.passes.myPassName.material.uniforms.myUniform.value = value;`
 *
 * See init params below to see how to add passes with specific shaders, uniforms, etc.
 *
 */
/**
 *
 * @params: (object)
 * renderer: (THREE.WebGLRenderer) renderer used to render your original scene
 * passes: (object) object describing the passes applied consecutively
 *  - passName (object):
 *      - format: (THREE texture constants format, optionnal) format to use for your pass texure (default to THREE.RGBAFormat)
 *      - uniforms: (object, optionnal) additional uniforms to use (see THREE Uniform)
 *      - vertexShader: (string, optionnal) vertexShader to use. Use one if you want to specify varyings to your fragment shader. Uses the default const vertexShader if none specified
 *      - fragmentShader: (string optionnal) fragmentShader to use. Uses the default const fragmentShader (that just display your scene) if none specified.
 *
 */
import * as THREE from 'three';
export interface RenderPassParams {
    format: THREE.PixelFormat;
    uniforms: Record<string, THREE.IUniform<any>>;
    fragmentShader?: string;
    vertexShader?: string;
}
export interface RenderPass {
    scene: THREE.Scene;
    target: THREE.WebGLRenderTarget;
    material: THREE.RawShaderMaterial;
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>;
}
export declare class MultipassRenderer {
    renderer: any;
    private passes;
    private dummyCamera?;
    private geometry?;
    private resolution?;
    constructor(renderer: any, passes: Record<string, RenderPassParams>);
    private makePass;
    resize(): void;
    private renderPassTo;
    render(): void;
}

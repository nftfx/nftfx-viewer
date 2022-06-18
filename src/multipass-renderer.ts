// source: https://github.com/martinlaxenaire/three-multipass-post-processing
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

const DEFAULT_VERTEX_SHADER = `
    precision highp float;
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 1.0, 1.0);
    }
`;

const DEFAULT_FRAGMENT_SHADER = `
    precision highp float;
    uniform sampler2D uScene;
    uniform vec2 uResolution;
    void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        gl_FragColor = texture2D(uScene, uv);
    }
`;

// Triangle expressed in clip space coordinates
const DEFAULT_VERTICES = new Float32Array([
    -1.0, -1.0,
    3.0, -1.0,
    -1.0, 3.0
]);

export interface RenderPassParams {
    format: THREE.PixelFormat
    uniforms: Record<string, THREE.IUniform<any>>
    fragmentShader?: string
    vertexShader?: string
}

export interface RenderPass {
    scene: THREE.Scene;
    target: THREE.WebGLRenderTarget;
    material: THREE.RawShaderMaterial;
    mesh: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>;
}

export class MultipassRenderer {
    public renderer: any;
    private passes: Record<string, RenderPass> = {};
    private dummyCamera?: THREE.OrthographicCamera;
    private geometry?: THREE.BufferGeometry;
    private resolution?: THREE.Vector2;

    constructor(renderer: any, passes: Record<string, RenderPassParams>) {
        if (!renderer || !passes)
            return;

        // three.js for .render() wants a camera, even if we're not using it :(
        this.dummyCamera = new THREE.OrthographicCamera();
        this.resolution = new THREE.Vector2();

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(DEFAULT_VERTICES, 2));

        this.renderer = renderer;
        this.renderer.getDrawingBufferSize(this.resolution);

        Object.entries(passes)
            .forEach(([name, passParams]) => {
                const pass = this.makePass(name, passParams);
                console.log('[makePass]', name, passParams, pass);
                this.passes[name] = pass;
            });
    }

    private makePass(passName: string, passParams: RenderPassParams): RenderPass {
        // create a pass object that will contain a scene, a render target
        // a material and its uniforms and finally a mesh

        const target = new THREE.WebGLRenderTarget(this.resolution!.x, this.resolution!.y, {
            format: passParams.format || THREE.RGBAFormat, // allow transparency
            stencilBuffer: false,
            depthBuffer: true,
        });

        const uniforms = {
            txScene: { value: target.texture },
            resolution: { value: this.resolution },
            ...(passParams.uniforms || {}),
        };

        const material = new THREE.RawShaderMaterial({
            fragmentShader: passParams.fragmentShader || DEFAULT_FRAGMENT_SHADER,
            vertexShader: passParams.vertexShader || DEFAULT_VERTEX_SHADER,
            uniforms: uniforms
        });

        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.frustumCulled = false;

        const scene = new THREE.Scene();
        scene.add(mesh);

        return {
            scene,
            target,
            material,
            mesh,
        };
    }

    public resize() {
        // resize all passes
        this.renderer.getDrawingBufferSize(this.resolution);
        Object.values(this.passes)
            .forEach(pass => {
                pass.target.setSize(this.resolution!.x, this.resolution!.y);
                pass.material.uniforms.uResolution.value = this.resolution;
            });
    }

    private renderPassTo(pass: RenderPass, to: RenderPass | null) {
        // console.log('[renderPassTo]', pass, to);
        this.renderer.setRenderTarget(to ? to.target : null);
        this.renderer.render(pass.scene, this.dummyCamera);
    }

    public render() {
        const passBackground = this.passes['Background'];
        const passMain = this.passes['Main'];
        const passFilter = this.passes['Filter'];
        // const passCompute = this.passes['Compute'];

        if (passBackground) {
            this.renderPassTo(passBackground, passMain);
        }
        if (passFilter) {
            this.renderPassTo(passMain, passFilter);
            this.renderPassTo(passFilter, null);
        } else {
            this.renderPassTo(passMain, null);
        }
    }
}
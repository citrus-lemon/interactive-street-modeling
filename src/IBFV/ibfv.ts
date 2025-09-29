import {
  BufferImageSource,
  compileHighShaderGlProgram,
  Geometry,
  Mesh,
  Renderer,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
  TextureSource,
} from "pixi.js";
import { VectorFieldBuffer } from "./VectorField";

export class IBFV extends Sprite {
  resolution = 1000;
  private sourceTexture: RenderTexture;
  private targetTexture: RenderTexture;

  private shader: Shader;

  private geometry: Geometry;

  private shaderMesh: Mesh<Geometry, Shader>;

  private vectorField: VectorFieldBuffer;

  noise: TextureSource;

  constructor(vectorField?: VectorFieldBuffer) {
    super();

    this.sourceTexture = RenderTexture.create({
      width: 1,
      height: 1,
      resolution: this.resolution,
      scaleMode: "linear",
    });
    this.targetTexture = RenderTexture.create({
      width: 1,
      height: 1,
      resolution: this.resolution,
      scaleMode: "linear",
      wrapMode: "repeat",
    });
    this.onRender = this.render;

    this.geometry = new Geometry({
      attributes: {
        aPosition: [0, 0, 1, 0, 1, 1, 0, 1],
        aUV: [0, 0, 1, 0, 1, 1, 0, 1],
      },
      indexBuffer: [0, 1, 2, 0, 2, 3],
    });

    this.noise = this.createNoise(this.resolution / 4);

    this.shader = new Shader({
      glProgram: compileHighShaderGlProgram({
        name: "ibfv-shader",
        bits: [IBFVGLBits],
      }),
      resources: {
        group: {
          uMaximumFlow: { value: 0.05, type: "f32" },
        },
        uVectorField: Texture.WHITE.source,
        uSampler: Texture.WHITE.source,
        uNoise: this.noise,
      },
    });

    this.vectorField = vectorField || new Float32Array(2);
    this.field = this.vectorField;

    this.shaderMesh = new Mesh({
      geometry: this.geometry,
      shader: this.shader,
    });
  }

  createNoise(noiseResolution: number) {
    // meet webgl alignment
    noiseResolution = Math.floor(noiseResolution / 4) * 4;
    return new BufferImageSource({
      resource: Uint8Array.from(Array(noiseResolution * noiseResolution), () =>
        Math.random() > 0.5 ? 255 : 0
      ),
      width: noiseResolution,
      height: noiseResolution,
      format: "r8unorm",
      wrapMode: "repeat",
      scaleMode: "nearest",
      label: "noise",
    });
  }

  set noiseResolution(value: number) {
    this.shader.resources.uNoise = this.createNoise(value);
  }

  get noiseResolution() {
    return this.shader.resources.uNoise.width;
  }

  set maximumFlow(value: number) {
    this.shader.resources.group.uniforms.uMaximumFlow = value;
  }

  get maximumFlow() {
    return this.shader.resources.group.uniforms.uMaximumFlow;
  }

  get field() {
    return this.vectorField;
  }

  set field(vectorField: VectorFieldBuffer) {
    this.vectorField = vectorField;
    const defaultSize = Math.floor(Math.sqrt(vectorField.length / 2));
    const bufferImageSource = new BufferImageSource({
      resource: vectorField,
      width: vectorField.width || defaultSize,
      height: vectorField.height || defaultSize,
      format: "rg32float",
      wrapMode: "clamp-to-edge",
      scaleMode: "linear",
    });
    this.shader.resources.uVectorField = bufferImageSource;
  }

  update() {
    this.shader.resources.uVectorField?.update();
  }

  render(renderer: Renderer) {
    this.texture = this.sourceTexture;
    setTimeout(() => {
      this.shader.resources.uSampler = this.sourceTexture.source;
      renderer.render({
        container: this.shaderMesh,
        target: this.targetTexture,
      });
      // Swap textures for next frame
      [this.sourceTexture, this.targetTexture] = [
        this.targetTexture,
        this.sourceTexture,
      ];
    });
  }
}

export const IBFVGLBits = {
  fragment: {
    header: /*glsl*/ `
      uniform float uMaximumFlow;
      uniform sampler2D uVectorField;
      uniform sampler2D uSampler;
      uniform sampler2D uNoise;
    `,
    main: /*glsl*/ `
      vec4 noise = vec4(vec3(texture(uNoise, vUV).r), 1.0);
      vec2 flow = texture(uVectorField, vUV).rg;
      flow = flow * min(uMaximumFlow / length(flow), 1.0);

      outColor = mix(texture(uSampler, fract(vUV - flow)), noise, 0.05);
    `,
  },
};

export default IBFV;

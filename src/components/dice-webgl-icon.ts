import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as THREE from 'three';

import { DEFAULT_DICE_TYPE, getDiceType, type DiceTypeId } from '../dice-config';

type MotionMode = 'preview' | 'rolling' | 'still';

type FaceDescriptor = {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  size: number;
};

type FaceAccumulator = {
  normal: THREE.Vector3;
  plane: number;
  vertices: Map<string, THREE.Vector3>;
};

@customElement('dice-webgl-icon')
export class DiceWebglIcon extends LitElement {
  @property({ type: String, attribute: 'dice-type' }) diceTypeId: DiceTypeId = DEFAULT_DICE_TYPE;
  @property({ type: String, attribute: 'motion-mode' }) motionMode: MotionMode = 'preview';
  @property({ type: Number, attribute: 'roll-duration-ms' }) rollDurationMs = 3000;
  @property({ type: Number, attribute: 'face-value' }) faceValue = 1;

  @state() private hasWebglError = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    .viewport {
      position: relative;
      width: 100%;
      height: 100%;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .fallback {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #314255;
    }
  `;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private diceRoot?: THREE.Group;
  private resizeObserver?: ResizeObserver;
  private readonly clock = new THREE.Clock();
  private readonly previewVelocity = new THREE.Vector3();
  private readonly rollAxis = new THREE.Vector3(1, 1, 1);
  private prefersReducedMotion = false;
  private faceDescriptors: FaceDescriptor[] = [];
  private rollStartedAt = 0;
  private rollPeakSpeed = 0;
  private isSettling = false;
  private settleStartedAt = 0;
  private readonly settleDurationMs = 420;
  private readonly settleFromQuaternion = new THREE.Quaternion();
  private readonly settleToQuaternion = new THREE.Quaternion();

  render() {
    return html`
      <div class="viewport">
        <canvas></canvas>
        ${this.hasWebglError ? html`<div class="fallback">${this.diceTypeId.toUpperCase()}</div>` : null}
      </div>
    `;
  }

  firstUpdated() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initializeScene();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('diceTypeId') && this.scene) {
      this.rebuildDie();
    }

    if (
      this.scene &&
      (changedProperties.has('motionMode') ||
        changedProperties.has('rollDurationMs') ||
        changedProperties.has('faceValue'))
    ) {
      this.syncMotionMode(changedProperties);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.teardownScene();
  }

  private initializeScene() {
    const canvas = this.renderRoot.querySelector('canvas');

    if (!canvas) {
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      this.hasWebglError = true;
      return;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.camera.position.set(0, 0.18, 4.2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xc6d3e3, 1.4);
    hemisphereLight.position.set(0, 2, 0);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(2.6, 3.2, 4.6);
    const fillLight = new THREE.DirectionalLight(0xa5c4ff, 0.65);
    fillLight.position.set(-3.2, -1.4, 2.2);

    this.scene.add(ambientLight, hemisphereLight, keyLight, fillLight);

    this.rebuildDie();
    this.resizeCanvas();
    this.syncMotionMode(new Map());

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this);

    this.clock.start();
    this.renderer.setAnimationLoop(this.renderFrame);
  }

  private teardownScene() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }

    if (this.scene && this.diceRoot) {
      this.scene.remove(this.diceRoot);
      this.disposeObject3D(this.diceRoot);
      this.diceRoot = undefined;
    }

    this.renderer?.dispose();
    this.renderer = undefined;
    this.scene = undefined;
    this.camera = undefined;
  }

  private resizeCanvas() {
    if (!this.renderer || !this.camera) {
      return;
    }

    const width = Math.max(1, Math.floor(this.clientWidth));
    const height = Math.max(1, Math.floor(this.clientHeight));

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene!, this.camera);
  }

  private rebuildDie() {
    if (!this.scene) {
      return;
    }

    if (this.diceRoot) {
      this.scene.remove(this.diceRoot);
      this.disposeObject3D(this.diceRoot);
      this.diceRoot = undefined;
    }

    this.diceRoot = this.createDieGroup();
    this.scene.add(this.diceRoot);
    this.randomizePreviewMotion();
    this.syncMotionMode(new Map());
  }

  private readonly renderFrame = () => {
    if (!this.renderer || !this.scene || !this.camera || !this.diceRoot) {
      return;
    }

    const delta = this.clock.getDelta();

    if (!this.prefersReducedMotion) {
      if (this.motionMode === 'preview') {
        this.diceRoot.rotation.x += this.previewVelocity.x * delta;
        this.diceRoot.rotation.y += this.previewVelocity.y * delta;
        this.diceRoot.rotation.z += this.previewVelocity.z * delta;
      }

      if (this.motionMode === 'rolling') {
        const progress = Math.min(
          1,
          Math.max(0, (performance.now() - this.rollStartedAt) / this.rollDurationMs)
        );
        const angularSpeed = this.getRollAngularSpeed(progress);

        this.diceRoot.rotation.x += this.rollAxis.x * angularSpeed * delta;
        this.diceRoot.rotation.y += this.rollAxis.y * angularSpeed * delta;
        this.diceRoot.rotation.z += this.rollAxis.z * angularSpeed * delta;
      }
    }

    if (this.isSettling) {
      const progress = Math.min(
        1,
        Math.max(0, (performance.now() - this.settleStartedAt) / this.settleDurationMs)
      );
      const easedProgress = this.easeOutCubic(progress);
      this.diceRoot.quaternion.slerpQuaternions(
        this.settleFromQuaternion,
        this.settleToQuaternion,
        easedProgress
      );

      if (progress >= 1) {
        this.isSettling = false;
        this.diceRoot.quaternion.copy(this.settleToQuaternion);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  private createDieGroup(): THREE.Group {
    const diceType = getDiceType(this.diceTypeId);
    const { geometry, faces } = this.buildGeometryForDice(diceType.id);
    const group = new THREE.Group();
    this.faceDescriptors = faces.slice(0, diceType.sides);

    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf9fbff,
      metalness: 0.04,
      roughness: 0.26,
      clearcoat: 0.7,
      clearcoatRoughness: 0.32,
      sheen: 0.35,
      sheenColor: 0xeaf1ff,
      transparent: true,
      opacity: 0.98,
    });

    const shell = new THREE.Mesh(geometry, shellMaterial);
    group.add(shell);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 8),
      new THREE.LineBasicMaterial({
        color: 0x7e93ab,
        transparent: true,
        opacity: 0.62,
      })
    );
    group.add(edges);

    this.faceDescriptors.forEach((face, index) => {
      group.add(this.createFaceLabel(index + 1, face));
    });

    group.scale.setScalar(this.getVisualScale(diceType.id));

    return group;
  }

  private buildGeometryForDice(diceTypeId: DiceTypeId): {
    geometry: THREE.BufferGeometry;
    faces: FaceDescriptor[];
  } {
    let geometry: THREE.BufferGeometry;

    switch (diceTypeId) {
      case 'd4':
        geometry = new THREE.TetrahedronGeometry(1);
        break;
      case 'd6':
        geometry = new THREE.BoxGeometry(1.55, 1.55, 1.55);
        break;
      case 'd8':
        geometry = new THREE.OctahedronGeometry(1.15);
        break;
      case 'd10':
        geometry = this.createD10Geometry();
        break;
      case 'd12':
        geometry = new THREE.DodecahedronGeometry(1.05);
        break;
      case 'd20':
        geometry = new THREE.IcosahedronGeometry(1.1);
        break;
      default:
        geometry = new THREE.BoxGeometry(1.55, 1.55, 1.55);
    }

    this.normalizeGeometrySize(geometry);
    geometry.computeVertexNormals();

    return {
      geometry,
      faces: this.extractFaces(geometry),
    };
  }

  private createD10Geometry(): THREE.BufferGeometry {
    const sphereRadius = 1;
    // This offset makes each kite face planar while keeping all vertices on one sphere.
    const ringOffsetY = 0.10557280900008409;
    const poleHeight = sphereRadius;
    const radius = Math.sqrt(sphereRadius * sphereRadius - ringOffsetY * ringOffsetY);
    const top = new THREE.Vector3(0, poleHeight, 0);
    const bottom = new THREE.Vector3(0, -poleHeight, 0);
    const upperRing: THREE.Vector3[] = [];
    const lowerRing: THREE.Vector3[] = [];
    const upperY = ringOffsetY;
    const lowerY = -ringOffsetY;

    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      upperRing.push(new THREE.Vector3(Math.cos(angle) * radius, upperY, Math.sin(angle) * radius));

      const lowerAngle = angle + Math.PI / 5;
      lowerRing.push(
        new THREE.Vector3(Math.cos(lowerAngle) * radius, lowerY, Math.sin(lowerAngle) * radius)
      );
    }

    const triangles: number[] = [];

    const pushTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
      const normal = new THREE.Vector3()
        .subVectors(b, a)
        .cross(new THREE.Vector3().subVectors(c, a));

      if (normal.dot(a) < 0) {
        triangles.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
        return;
      }

      triangles.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };

    for (let index = 0; index < 5; index += 1) {
      const nextIndex = (index + 1) % 5;

      const upperFace = [top, upperRing[index], lowerRing[index], upperRing[nextIndex]];
      pushTriangle(upperFace[0], upperFace[1], upperFace[2]);
      pushTriangle(upperFace[0], upperFace[2], upperFace[3]);

      const lowerFace = [bottom, lowerRing[index], upperRing[nextIndex], lowerRing[nextIndex]];
      pushTriangle(lowerFace[0], lowerFace[1], lowerFace[2]);
      pushTriangle(lowerFace[0], lowerFace[2], lowerFace[3]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles, 3));
    return geometry;
  }

  private normalizeGeometrySize(geometry: THREE.BufferGeometry) {
    geometry.computeBoundingSphere();

    if (!geometry.boundingSphere) {
      return;
    }

    const radius = geometry.boundingSphere.radius || 1;
    const scale = 1.18 / radius;
    geometry.scale(scale, scale, scale);
  }

  private extractFaces(geometry: THREE.BufferGeometry): FaceDescriptor[] {
    const sourceGeometry = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const positions = sourceGeometry.getAttribute('position');
    const groups = new Map<string, FaceAccumulator>();
    const normal = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();

    for (let index = 0; index < positions.count; index += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(positions, index);
      const b = new THREE.Vector3().fromBufferAttribute(positions, index + 1);
      const c = new THREE.Vector3().fromBufferAttribute(positions, index + 2);

      ab.subVectors(b, a);
      ac.subVectors(c, a);
      normal.crossVectors(ab, ac).normalize();

      if (normal.lengthSq() === 0) {
        continue;
      }

      const plane = normal.dot(a);
      const key = `${this.roundForKey(normal.x)}:${this.roundForKey(normal.y)}:${this.roundForKey(
        normal.z
      )}:${this.roundForKey(plane)}`;

      const entry = groups.get(key) ?? {
        normal: normal.clone(),
        plane,
        vertices: new Map<string, THREE.Vector3>(),
      };

      entry.vertices.set(this.vertexKey(a), a.clone());
      entry.vertices.set(this.vertexKey(b), b.clone());
      entry.vertices.set(this.vertexKey(c), c.clone());
      groups.set(key, entry);
    }

    sourceGeometry.dispose();

    return Array.from(groups.values())
      .map((entry) => {
        const vertices = Array.from(entry.vertices.values());
        const center = vertices.reduce(
          (sum, vertex) => sum.add(vertex),
          new THREE.Vector3()
        ).multiplyScalar(1 / vertices.length);

        const averageRadius =
          vertices.reduce((sum, vertex) => sum + vertex.distanceTo(center), 0) / vertices.length;

        const sizeMultiplier =
          vertices.length <= 3 ? 1.14 : vertices.length === 4 ? 1.2 : 1.34;

        return {
          center,
          normal: entry.normal.clone().normalize(),
          size: averageRadius * sizeMultiplier,
        };
      })
      .sort((left, right) => {
        if (Math.abs(right.center.y - left.center.y) > 0.01) {
          return right.center.y - left.center.y;
        }

        if (Math.abs(left.center.x - right.center.x) > 0.01) {
          return left.center.x - right.center.x;
        }

        return right.center.z - left.center.z;
      });
  }

  private createFaceLabel(value: number, face: FaceDescriptor): THREE.Mesh {
    const texture = this.createLabelTexture(value);
    const geometry = new THREE.PlaneGeometry(face.size, face.size);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(face.center).add(face.normal.clone().multiplyScalar(0.05));

    const upHint = new THREE.Vector3(0, 1, 0);
    const projectedUp = upHint.sub(face.normal.clone().multiplyScalar(upHint.dot(face.normal)));

    if (projectedUp.lengthSq() < 1e-4) {
      projectedUp.set(1, 0, 0).sub(face.normal.clone().multiplyScalar(face.normal.x));
    }

    projectedUp.normalize();

    const right = new THREE.Vector3().crossVectors(projectedUp, face.normal).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(face.normal, right).normalize();
    const orientation = new THREE.Matrix4().makeBasis(right, correctedUp, face.normal);

    mesh.quaternion.setFromRotationMatrix(orientation);

    return mesh;
  }

  private createLabelTexture(value: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.drawPips(context, value);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }

  private drawPips(context: CanvasRenderingContext2D, value: number) {
    if (value > 6) {
      this.drawDensePips(context, value);
      return;
    }

    const pipMap: Record<number, Array<[number, number]>> = {
      1: [[0, 0]],
      2: [
        [-1, -1],
        [1, 1],
      ],
      3: [
        [-1, -1],
        [0, 0],
        [1, 1],
      ],
      4: [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ],
      5: [
        [-1, -1],
        [1, -1],
        [0, 0],
        [-1, 1],
        [1, 1],
      ],
      6: [
        [-1, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [1, 1],
      ],
    };

    const positions = pipMap[value] ?? pipMap[1];
    context.fillStyle = '#13283a';

    positions.forEach(([gridX, gridY]) => {
      context.beginPath();
      context.arc(128 + gridX * 42, 128 + gridY * 42, 16, 0, Math.PI * 2);
      context.fill();
    });
  }

  private drawDensePips(context: CanvasRenderingContext2D, value: number) {
    const columns = value <= 9 ? 3 : value <= 16 ? 4 : 5;
    const rows = Math.ceil(value / columns);
    const innerSize = 124;
    const startY = 128 - innerSize / 2;
    const stepX = columns > 1 ? innerSize / (columns - 1) : 0;
    const stepY = rows > 1 ? innerSize / (rows - 1) : 0;
    const radius = value <= 9 ? 10 : value <= 16 ? 8 : 6.5;
    const positions: Array<{ x: number; y: number }> = [];

    for (let row = 0; row < rows; row += 1) {
      const countInRow = Math.min(columns, value - positions.length);
      const rowWidth = countInRow > 1 ? stepX * (countInRow - 1) : 0;
      const rowStartX = 128 - rowWidth / 2;
      const y = rows > 1 ? startY + row * stepY : 128;

      for (let column = 0; column < countInRow; column += 1) {
        positions.push({
          x: rowStartX + column * stepX,
          y,
        });
      }
    }

    context.fillStyle = '#13283a';

    positions.forEach(({ x, y }) => {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  private randomizePreviewMotion() {
    if (!this.diceRoot) {
      return;
    }

    this.diceRoot.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    const minimumSpeed = 0.07;
    const maximumSpeed = 0.14;
    const randomSpeed = () => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      return direction * (minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed));
    };

    this.previewVelocity.set(randomSpeed(), randomSpeed(), randomSpeed());
  }

  private syncMotionMode(changedProperties: Map<string, unknown>) {
    if (!this.diceRoot) {
      return;
    }

    if (this.motionMode === 'rolling') {
      if (changedProperties.has('motionMode') || changedProperties.size === 0) {
        this.startRollAnimation();
      }

      return;
    }

    if (this.motionMode === 'still') {
      if (
        changedProperties.has('motionMode') ||
        changedProperties.has('faceValue') ||
        changedProperties.size === 0
      ) {
        this.settleToFaceValue();
      }

      return;
    }

    if (this.motionMode === 'preview' && changedProperties.has('motionMode')) {
      this.randomizePreviewMotion();
    }
  }

  private startRollAnimation() {
    if (!this.diceRoot) {
      return;
    }

    this.rollStartedAt = performance.now();
    this.rollPeakSpeed = 17 + Math.random() * 6;

    this.rollAxis
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize();

    if (this.rollAxis.lengthSq() === 0) {
      this.rollAxis.set(0.7, 1, -0.6).normalize();
    }
  }

  private getRollAngularSpeed(progress: number): number {
    const accelerateEnd = 0.16;
    const decelerateStart = 0.72;
    const minimumSpeed = 0.45;

    if (progress <= accelerateEnd) {
      return this.rollPeakSpeed * this.easeOutCubic(progress / accelerateEnd);
    }

    if (progress < decelerateStart) {
      return this.rollPeakSpeed;
    }

    const slowDownProgress = (progress - decelerateStart) / (1 - decelerateStart);
    return minimumSpeed + (this.rollPeakSpeed - minimumSpeed) * (1 - this.easeInOutCubic(slowDownProgress));
  }

  private settleToFaceValue() {
    if (!this.diceRoot || !this.camera || this.faceDescriptors.length === 0) {
      return;
    }

    const safeValue = Math.min(
      this.faceDescriptors.length,
      Math.max(1, Math.round(Number(this.faceValue) || 1))
    );
    const targetFace = this.faceDescriptors[safeValue - 1];
    const targetDirection = this.camera.position.clone().normalize();
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
      targetFace.normal.clone().normalize(),
      targetDirection
    );

    this.isSettling = true;
    this.settleStartedAt = performance.now();
    this.settleFromQuaternion.copy(this.diceRoot.quaternion);
    this.settleToQuaternion.copy(targetQuaternion);

    if (this.prefersReducedMotion) {
      this.diceRoot.quaternion.copy(targetQuaternion);
      this.isSettling = false;
    }
  }

  private easeOutCubic(value: number): number {
    return 1 - Math.pow(1 - value, 3);
  }

  private easeInOutCubic(value: number): number {
    if (value < 0.5) {
      return 4 * value * value * value;
    }

    return 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  private getVisualScale(diceTypeId: DiceTypeId): number {
    switch (diceTypeId) {
      case 'd4':
        return 0.7776;
      case 'd6':
        return 0.6966;
      case 'd8':
        return 0.7452;
      case 'd10':
        return 0.729;
      case 'd12':
        return 0.7128;
      case 'd20':
        return 0.7047;
      default:
        return 0.7128;
    }
  }

  private disposeObject3D(object: THREE.Object3D) {
    object.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        if (Array.isArray(child.material)) {
          child.material.forEach((material: THREE.Material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(child.material);
        }
      }

      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();

        if (Array.isArray(child.material)) {
          child.material.forEach((material: THREE.Material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  private disposeMaterial(material: THREE.Material) {
    const materialWithMap = material as THREE.Material & {
      map?: THREE.Texture | null;
    };

    materialWithMap.map?.dispose();
    material.dispose();
  }

  private roundForKey(value: number): string {
    return (Math.round(value * 1000) / 1000).toFixed(3);
  }

  private vertexKey(vertex: THREE.Vector3): string {
    return `${this.roundForKey(vertex.x)}:${this.roundForKey(vertex.y)}:${this.roundForKey(
      vertex.z
    )}`;
  }
}

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

type LabelStyle = 'pips' | 'number';

@customElement('dice-webgl-icon')
export class DiceWebglIcon extends LitElement {
  @property({ type: String, attribute: 'dice-type' }) diceTypeId: DiceTypeId = DEFAULT_DICE_TYPE;
  @property({ type: String, attribute: 'motion-mode' }) motionMode: MotionMode = 'preview';
  @property({ type: Number, attribute: 'roll-duration-ms' }) rollDurationMs = 3000;
  @property({ type: Number, attribute: 'face-value' }) faceValue = 1;
  /** Цвет кубика в hex-формате, берётся из diceType.color */
  @property({ type: String, attribute: 'dice-color' }) diceColor = '#d94040';

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
  private readonly timer = new THREE.Timer();
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

    // При смене цвета — перестраиваем кубик целиком (меняется материал)
    if (changedProperties.has('diceColor') && this.scene) {
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
    this.camera.position.set(0.7, 3.9, 2.2);
    this.camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x1a1a2a, 1.8);
    hemisphereLight.position.set(0, 2, 0);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(0.3, 6.0, 1.0);
    const fillLight = new THREE.DirectionalLight(0x6688aa, 0.2);
    fillLight.position.set(-3.0, -1.0, 2.0);

    this.scene.add(ambientLight, hemisphereLight, keyLight, fillLight);

    this.rebuildDie();
    this.resizeCanvas();
    this.syncMotionMode(new Map());

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this);

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

    if (this.renderer) {
      const gl = this.renderer.getContext();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.renderer.dispose();
      this.renderer = undefined;
    }

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

  private readonly renderFrame = (timestamp: number) => {
    if (!this.renderer || !this.scene || !this.camera || !this.diceRoot) {
      return;
    }

    this.timer.update(timestamp);
    const delta = this.timer.getDelta();

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

  /**
   * Создаёт группу Three.js для кубика выбранного типа и цвета.
   * @returns Готовая группа объектов сцены
   */
  private createDieGroup(): THREE.Group {
    const diceType = getDiceType(this.diceTypeId);
    const { geometry, edgesGeometry, faces, labelStyle } = this.buildGeometryForDice(diceType.id);
    const group = new THREE.Group();
    this.faceDescriptors = faces.slice(0, diceType.sides);

    const bodyColor = new THREE.Color(this.diceColor);
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      metalness: 0.02,
      roughness: 0.24,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
      sheen: 0.25,
      sheenColor: bodyColor.clone().lerp(new THREE.Color(0xffffff), 0.32),
      opacity: 1,
    });

    const shell = new THREE.Mesh(geometry, shellMaterial);
    group.add(shell);

    const edgeColor = bodyColor.clone().lerp(new THREE.Color(0x000000), 0.45);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.5,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
    group.add(edges);

    this.faceDescriptors.forEach((face, index) => {
      group.add(this.createFaceLabel(index + 1, face, labelStyle, bodyColor));
    });

    group.scale.setScalar(this.getVisualScale(diceType.id));

    return group;
  }

  private buildGeometryForDice(diceTypeId: DiceTypeId): {
    geometry: THREE.BufferGeometry;
    edgesGeometry: THREE.EdgesGeometry;
    faces: FaceDescriptor[];
    labelStyle: LabelStyle;
  } {
    let sharpGeometry: THREE.BufferGeometry;

    switch (diceTypeId) {
      case 'd4':
        sharpGeometry = new THREE.TetrahedronGeometry(1);
        break;
      case 'd6':
        sharpGeometry = new THREE.BoxGeometry(1.55, 1.55, 1.55);
        break;
      case 'd8':
        sharpGeometry = new THREE.OctahedronGeometry(1.15);
        break;
      case 'd10':
        sharpGeometry = this.createD10Geometry();
        break;
      case 'd12':
        sharpGeometry = new THREE.DodecahedronGeometry(1.05);
        break;
      case 'd20':
        sharpGeometry = new THREE.IcosahedronGeometry(1.1);
        break;
      default:
        sharpGeometry = new THREE.BoxGeometry(1.55, 1.55, 1.55);
    }

    this.normalizeGeometrySize(sharpGeometry);
    sharpGeometry.computeVertexNormals();
    const faces = this.extractFaces(sharpGeometry);
    const edgesGeometry = new THREE.EdgesGeometry(sharpGeometry, 1);
    const geometry = this.createRoundedGeometry(sharpGeometry, diceTypeId);
    sharpGeometry.dispose();

    return {
      geometry,
      edgesGeometry,
      faces,
      labelStyle: diceTypeId === 'd6' ? 'pips' : 'number',
    };
  }

  private createRoundedGeometry(
    sourceGeometry: THREE.BufferGeometry,
    diceTypeId: DiceTypeId
  ): THREE.BufferGeometry {
    const roundingPresets: Record<string, [number, number, number]> = {
      d4:  [2, 0.22, 0.03],
      d6:  [3, 0.36, 0.07],
      d8:  [2, 0.14, 0.02],
      d10: [2, 0.20, 0.03],
      d12: [2, 0.22, 0.035],
      d20: [2, 0.20, 0.03],
    };
    const [subdivisionIterations, smoothStrength, sphereBlend] =
      roundingPresets[diceTypeId] ?? [2, 0.28, 0.045];

    let geometry = this.mergeVerticesByPosition(sourceGeometry);
    geometry = this.subdivideGeometry(geometry, subdivisionIterations);
    this.relaxGeometry(geometry, smoothStrength, 2);
    this.blendGeometryTowardSphere(geometry, sphereBlend);
    this.normalizeGeometrySize(geometry);
    geometry.computeVertexNormals();

    return geometry;
  }

  private mergeVerticesByPosition(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const sourceGeometry = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const positionAttribute = sourceGeometry.getAttribute('position');
    const positions: number[] = [];
    const indices: number[] = [];
    const uniqueVertexMap = new Map<string, number>();
    const vertex = new THREE.Vector3();

    for (let index = 0; index < positionAttribute.count; index += 1) {
      vertex.fromBufferAttribute(positionAttribute, index);
      const key = this.vertexKey(vertex);
      const existingIndex = uniqueVertexMap.get(key);

      if (existingIndex !== undefined) {
        indices.push(existingIndex);
        continue;
      }

      const newIndex = positions.length / 3;
      positions.push(vertex.x, vertex.y, vertex.z);
      uniqueVertexMap.set(key, newIndex);
      indices.push(newIndex);
    }

    sourceGeometry.dispose();

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    mergedGeometry.setIndex(indices);
    return mergedGeometry;
  }

  private subdivideGeometry(
    geometry: THREE.BufferGeometry,
    iterations: number
  ): THREE.BufferGeometry {
    let currentGeometry = geometry;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const positionAttribute = currentGeometry.getAttribute('position');
      const indexAttribute = currentGeometry.getIndex();

      if (!indexAttribute) {
        break;
      }

      const positions = Array.from(positionAttribute.array);
      const nextIndices: number[] = [];
      const midpointCache = new Map<string, number>();
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const midpoint = new THREE.Vector3();

      const getMidpointIndex = (leftIndex: number, rightIndex: number) => {
        const minIndex = Math.min(leftIndex, rightIndex);
        const maxIndex = Math.max(leftIndex, rightIndex);
        const edgeKey = `${minIndex}:${maxIndex}`;
        const cachedIndex = midpointCache.get(edgeKey);

        if (cachedIndex !== undefined) {
          return cachedIndex;
        }

        a.fromArray(positions, leftIndex * 3);
        b.fromArray(positions, rightIndex * 3);
        midpoint.copy(a).add(b).multiplyScalar(0.5);

        const newIndex = positions.length / 3;
        positions.push(midpoint.x, midpoint.y, midpoint.z);
        midpointCache.set(edgeKey, newIndex);

        return newIndex;
      };

      for (let index = 0; index < indexAttribute.count; index += 3) {
        const i0 = indexAttribute.getX(index);
        const i1 = indexAttribute.getX(index + 1);
        const i2 = indexAttribute.getX(index + 2);
        const aMid = getMidpointIndex(i0, i1);
        const bMid = getMidpointIndex(i1, i2);
        const cMid = getMidpointIndex(i2, i0);

        nextIndices.push(i0, aMid, cMid, i1, bMid, aMid, i2, cMid, bMid, aMid, bMid, cMid);
      }

      const nextGeometry = new THREE.BufferGeometry();
      nextGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      nextGeometry.setIndex(nextIndices);

      currentGeometry.dispose();
      currentGeometry = nextGeometry;
    }

    return currentGeometry;
  }

  private relaxGeometry(
    geometry: THREE.BufferGeometry,
    strength: number,
    iterations: number
  ): void {
    const positionAttribute = geometry.getAttribute('position');
    const indexAttribute = geometry.getIndex();

    if (!indexAttribute) {
      return;
    }

    const neighbors = Array.from({ length: positionAttribute.count }, () => new Set<number>());

    for (let index = 0; index < indexAttribute.count; index += 3) {
      const a = indexAttribute.getX(index);
      const b = indexAttribute.getX(index + 1);
      const c = indexAttribute.getX(index + 2);

      neighbors[a].add(b);
      neighbors[a].add(c);
      neighbors[b].add(a);
      neighbors[b].add(c);
      neighbors[c].add(a);
      neighbors[c].add(b);
    }

    let currentPositions = Array.from(positionAttribute.array);

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const nextPositions = currentPositions.slice();

      for (let vertexIndex = 0; vertexIndex < neighbors.length; vertexIndex += 1) {
        const adjacentVertices = Array.from(neighbors[vertexIndex]);

        if (adjacentVertices.length === 0) {
          continue;
        }

        let averageX = 0;
        let averageY = 0;
        let averageZ = 0;

        for (const adjacentIndex of adjacentVertices) {
          averageX += currentPositions[adjacentIndex * 3];
          averageY += currentPositions[adjacentIndex * 3 + 1];
          averageZ += currentPositions[adjacentIndex * 3 + 2];
        }

        averageX /= adjacentVertices.length;
        averageY /= adjacentVertices.length;
        averageZ /= adjacentVertices.length;
        const baseOffset = vertexIndex * 3;
        nextPositions[baseOffset] = THREE.MathUtils.lerp(
          currentPositions[baseOffset],
          averageX,
          strength
        );
        nextPositions[baseOffset + 1] = THREE.MathUtils.lerp(
          currentPositions[baseOffset + 1],
          averageY,
          strength
        );
        nextPositions[baseOffset + 2] = THREE.MathUtils.lerp(
          currentPositions[baseOffset + 2],
          averageZ,
          strength
        );
      }

      currentPositions = nextPositions;
    }

    positionAttribute.array.set(currentPositions);
    positionAttribute.needsUpdate = true;
  }

  private blendGeometryTowardSphere(geometry: THREE.BufferGeometry, amount: number): void {
    if (amount <= 0) {
      return;
    }

    geometry.computeBoundingSphere();

    if (!geometry.boundingSphere) {
      return;
    }

    const targetRadius = geometry.boundingSphere.radius;
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const spherePoint = new THREE.Vector3();

    for (let index = 0; index < positionAttribute.count; index += 1) {
      vertex.fromBufferAttribute(positionAttribute, index);

      if (vertex.lengthSq() === 0) {
        continue;
      }

      spherePoint.copy(vertex).normalize().multiplyScalar(targetRadius);
      vertex.lerp(spherePoint, amount);
      positionAttribute.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }

    positionAttribute.needsUpdate = true;
  }

  private createD10Geometry(): THREE.BufferGeometry {
    const sphereRadius = 1;
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

  /**
   * Создаёт меш с числовой меткой, прикреплённый к центру грани.
   * @param value Числовое значение грани
   * @param face Дескриптор грани (центр, нормаль, размер)
   * @returns Меш с текстурой числа
   */
  private createFaceLabel(
    value: number,
    face: FaceDescriptor,
    labelStyle: LabelStyle,
    bodyColor: THREE.Color
  ): THREE.Mesh {
    const texture = this.createLabelTexture(value, labelStyle, bodyColor);
    const labelScale = labelStyle === 'pips' ? 0.68 : this.getNumberLabelScale();
    const geometry = new THREE.PlaneGeometry(face.size * labelScale, face.size * labelScale);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(face.center).add(face.normal.clone().multiplyScalar(0.12));

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

  /**
   * Создаёт canvas-текстуру с точками-пипсами на прозрачном фоне.
   * @param value Числовое значение грани
   * @returns Текстура Three.js
   */
  private createLabelTexture(
    value: number,
    labelStyle: LabelStyle,
    bodyColor: THREE.Color
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 384;

    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (labelStyle === 'pips') {
      this.drawPips(context, value, bodyColor);
    } else {
      this.drawFaceNumber(context, value, bodyColor);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }

  private drawPips(
    context: CanvasRenderingContext2D,
    value: number,
    bodyColor: THREE.Color
  ): void {
    const size = 384;
    const positions = this.getPipPositions(value);
    const pipRadius = Math.max(12, Math.floor(52 / Math.sqrt(value)));
    const isLightDie = this.isLightColor(bodyColor);
    const pipColor = isLightDie ? '#20242c' : '#f7fbff';
    const shadowColor = isLightDie ? 'rgba(0, 0, 0, 0.16)' : 'rgba(0, 0, 0, 0.22)';

    for (const [nx, ny] of positions) {
      const x = nx * size;
      const y = ny * size;

      context.beginPath();
      context.arc(x, y + 3, pipRadius + 4, 0, Math.PI * 2);
      context.fillStyle = shadowColor;
      context.fill();

      context.beginPath();
      context.arc(x, y, pipRadius, 0, Math.PI * 2);
      context.fillStyle = pipColor;
      context.fill();
    }
  }

  private drawFaceNumber(
    context: CanvasRenderingContext2D,
    value: number,
    bodyColor: THREE.Color
  ): void {
    const inkColor = this.isLightColor(bodyColor) ? '#222831' : '#f8fbff';
    const outlineColor = this.isLightColor(bodyColor) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.25)';

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.font = `bold ${value >= 10 ? 210 : 260}px "Trebuchet MS", "Arial Black", sans-serif`;
    context.strokeStyle = outlineColor;
    context.lineWidth = value >= 10 ? 18 : 20;
    context.shadowColor = 'rgba(0, 0, 0, 0.18)';
    context.shadowBlur = 20;
    context.shadowOffsetY = 8;
    context.strokeText(String(value), 192, 208);
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.fillStyle = inkColor;
    context.fillText(String(value), 192, 208);
  }

  private getNumberLabelScale(): number {
    switch (this.diceTypeId) {
      case 'd4':
        return 0.52;
      case 'd10':
        return 0.54;
      case 'd12':
        return 0.58;
      case 'd20':
        return 0.56;
      default:
        return 0.58;
    }
  }

  private isLightColor(color: THREE.Color): boolean {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    return hsl.l > 0.72;
  }

  private getPipPositions(value: number): [number, number][] {
    const patterns: Record<number, [number, number][]> = {
      1: [[0.5, 0.5]],
      2: [[0.3, 0.3], [0.7, 0.7]],
      3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
      4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
      5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
      6: [[0.3, 0.22], [0.7, 0.22], [0.3, 0.5], [0.7, 0.5], [0.3, 0.78], [0.7, 0.78]],
    };

    if (patterns[value]) {
      return patterns[value];
    }

    const cols = value <= 9 ? 3 : value <= 12 ? 4 : 5;
    return this.makePipGrid(value, cols);
  }

  private makePipGrid(value: number, cols: number): [number, number][] {
    const rows = Math.ceil(value / cols);
    const positions: [number, number][] = [];
    const margin = 0.18;
    const spacingX = cols > 1 ? (1 - 2 * margin) / (cols - 1) : 0;
    const spacingY = rows > 1 ? (1 - 2 * margin) / (rows - 1) : 0;

    for (let row = 0; row < rows; row++) {
      const rowCount = Math.min(cols, value - row * cols);
      const y = rows === 1 ? 0.5 : margin + row * spacingY;
      const rowWidth = (rowCount - 1) * spacingX;
      const startX = rowCount === 1 ? 0.5 : 0.5 - rowWidth / 2;

      for (let col = 0; col < rowCount; col++) {
        positions.push([startX + col * spacingX, y]);
      }
    }

    return positions;
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
    const targetDirection = new THREE.Vector3(0, 1, 0);
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

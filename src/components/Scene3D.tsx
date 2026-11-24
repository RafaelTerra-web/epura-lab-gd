"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  GDPoint,
  GDSegment,
  getLineProjectionLabels,
  getProjectionLabels,
  NotationMode,
} from "@/lib/gd-math";
import { Eye, RotateCcw } from "lucide-react";

interface Scene3DProps {
  points: GDPoint[];
  segments: GDSegment[];
  selectedPointId?: string | null;
  foldAngle: number; // 0 to 90 degrees
  notation: NotationMode;
  showXYZ: boolean;
  showBisectors: boolean;
  showDiedroLabels?: boolean;
  dark?: boolean;
  onSelectPoint?: (id: string) => void;
  className?: string;
}

type CameraPreset = "iso" | "profile" | "front" | "top";

function makeTextSprite(
  text: string,
  color: string,
  bgColor: string,
  borderColor?: string,
  fontSize = 44
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 112;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
  const metrics = ctx.measureText(text);
  const w = Math.min(240, Math.max(76, metrics.width + 38));
  const h = 66;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();

  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.55, 0.68, 1);
  return sprite;
}

function makeDashedLine(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: string | number,
  opacity = 0.78
): THREE.Line {
  const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.22,
    gapSize: 0.14,
    transparent: true,
    opacity,
  });
  const line = new THREE.Line(geom, mat);
  line.computeLineDistances();
  return line;
}

function makeSolidLine(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: string | number,
  opacity = 1
): THREE.Line {
  const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Line(geom, mat);
}

function makeCylinderSegment(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  color: string | number,
  opacity = 1
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = Math.max(0.001, dir.length());
  const geom = new THREE.CylinderGeometry(radius, radius, len, 12);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    transparent: opacity < 1,
    opacity,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize()
  );
  return mesh;
}

export function Scene3D({
  points,
  segments,
  selectedPointId,
  foldAngle,
  notation,
  showXYZ,
  showBisectors,
  showDiedroLabels = true,
  dark = false,
  className = "",
}: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>("iso");
  const [webglError, setWebglError] = useState(false);

  // Camera spherical state kept in refs for 60fps interaction without React rerenders
  const camStateRef = useRef({
    theta: 0.68, // azimuth around Y
    phi: 1.14, // polar angle from +Y
    radius: 17.5,
    targetTheta: 0.68,
    targetPhi: 1.14,
    targetRadius: 17.5,
  });

  const sceneRefs = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    dynamicGroup: THREE.Group;
    horizontalGroup: THREE.Group;
    staticGroup: THREE.Group;
    foldRef: { angle: number };
  } | null>(null);

  const applyCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    const s = camStateRef.current;
    if (preset === "iso") {
      s.targetTheta = 0.68;
      s.targetPhi = 1.14;
      s.targetRadius = 17.5;
    } else if (preset === "profile") {
      s.targetTheta = Math.PI / 2 - 0.04;
      s.targetPhi = Math.PI / 2 - 0.02;
      s.targetRadius = 18.5;
    } else if (preset === "front") {
      s.targetTheta = 0;
      s.targetPhi = Math.PI / 2;
      s.targetRadius = 17;
    } else if (preset === "top") {
      s.targetTheta = 0;
      s.targetPhi = 0.16;
      s.targetRadius = 17.5;
    }
  };

  // Auto-glide toward frontal view when user reaches 90° fold
  const prevFoldRef = useRef(foldAngle);
  useEffect(() => {
    if (prevFoldRef.current < 88 && foldAngle >= 88) {
      camStateRef.current.targetTheta = 0.02;
      camStateRef.current.targetPhi = Math.PI / 2 - 0.02;
      setActivePreset("front");
    } else if (prevFoldRef.current >= 88 && foldAngle < 25) {
      camStateRef.current.targetTheta = 0.68;
      camStateRef.current.targetPhi = 1.14;
      setActivePreset("iso");
    }
    prevFoldRef.current = foldAngle;
  }, [foldAngle]);

  // Mount Three.js once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 400, container.clientHeight || 360);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      (container.clientWidth || 400) / (container.clientHeight || 360),
      0.1,
      200
    );

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight.position.set(10, 14, 12);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
    fillLight.position.set(-10, -6, -8);
    scene.add(fillLight);

    const staticGroup = new THREE.Group();
    const dynamicGroup = new THREE.Group();
    const horizontalGroup = new THREE.Group();
    scene.add(staticGroup);
    scene.add(dynamicGroup);
    scene.add(horizontalGroup);

    const foldRef = { angle: foldAngle };
    sceneRefs.current = {
      scene,
      renderer,
      camera,
      dynamicGroup,
      horizontalGroup,
      staticGroup,
      foldRef,
    };

    // Pointer drag & pinch zoom handlers
    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    const activePointers = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      dom.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      const prev = activePointers.get(e.pointerId)!;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const s = camStateRef.current;
      if (activePointers.size === 1) {
        s.targetTheta -= dx * 0.0085;
        s.targetPhi = Math.max(
          0.12,
          Math.min(Math.PI - 0.12, s.targetPhi - dy * 0.0085)
        );
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastPinchDist > 0) {
          const delta = (lastPinchDist - dist) * 0.04;
          s.targetRadius = Math.max(9, Math.min(28, s.targetRadius + delta));
        }
        lastPinchDist = dist;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) lastPinchDist = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = camStateRef.current;
      s.targetRadius = Math.max(9, Math.min(28, s.targetRadius + e.deltaY * 0.01));
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(100, container.clientWidth);
      const h = Math.max(100, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const s = camStateRef.current;
      s.theta += (s.targetTheta - s.theta) * 0.12;
      s.phi += (s.targetPhi - s.phi) * 0.12;
      s.radius += (s.targetRadius - s.radius) * 0.12;

      camera.position.set(
        s.radius * Math.sin(s.phi) * Math.sin(s.theta),
        s.radius * Math.cos(s.phi),
        s.radius * Math.sin(s.phi) * Math.cos(s.theta)
      );
      camera.lookAt(0, 0, 0);

      // Smoothly fold horizontalGroup around X axis (Mongean clockwise fold)
      const targetRad = (foldRef.angle * Math.PI) / 180;
      horizontalGroup.rotation.x +=
        (targetRad - horizontalGroup.rotation.x) * 0.18;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      renderer.dispose();
      sceneRefs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update foldRef smoothly without rebuilding geometry
  useEffect(() => {
    if (sceneRefs.current) {
      sceneRefs.current.foldRef.angle = foldAngle;
    }
  }, [foldAngle]);

  // Rebuild planes, points, projections, segments when scene data changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const { staticGroup, dynamicGroup, horizontalGroup } = refs;

    const clearGroup = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) {
          if ((mat as THREE.SpriteMaterial).map) {
            (mat as THREE.SpriteMaterial).map?.dispose();
          }
          mat.dispose();
        }
      }
    };

    clearGroup(staticGroup);
    clearGroup(dynamicGroup);
    clearGroup(horizontalGroup);

    const SIZE = 12; // -6 to +6
    const HALF = SIZE / 2;
    const labelBg = dark ? "rgba(17,26,46,0.9)" : "rgba(253,252,248,0.92)";
    const inkColor = dark ? "#F1F5F9" : "#1C1917";
    const foldRatio = foldAngle / 90;
    const spaceFade = Math.max(0.06, 1 - foldRatio * 1.15);

    const sampleLabels = getProjectionLabels("A", notation);

    // ---- 1. PLANO VERTICAL (π' / PV) at Z_w = 0 (FIXED) ----
    const pvMat = new THREE.MeshBasicMaterial({
      color: dark ? 0xef4444 : 0xc94032,
      transparent: true,
      opacity: dark ? 0.1 : 0.085,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pvPlane = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), pvMat);
    staticGroup.add(pvPlane);

    // PV border & subtle grid
    for (let i = -HALF; i <= HALF; i++) {
      const isEdge = Math.abs(i) === HALF;
      const op = isEdge ? 0.45 : i === 0 ? 0.25 : 0.14;
      staticGroup.add(
        makeSolidLine(
          new THREE.Vector3(i, -HALF, 0),
          new THREE.Vector3(i, HALF, 0),
          0xc94032,
          op
        )
      );
      if (i !== 0) {
        staticGroup.add(
          makeSolidLine(
            new THREE.Vector3(-HALF, i, 0),
            new THREE.Vector3(HALF, i, 0),
            0xc94032,
            op
          )
        );
      }
    }

    const pvsSprite = makeTextSprite(
      `${sampleLabels.pvShort}S`,
      "#C94032",
      labelBg,
      "#C94032",
      38
    );
    pvsSprite.position.set(-HALF + 0.95, HALF - 0.65, 0.06);
    staticGroup.add(pvsSprite);

    const pviSprite = makeTextSprite(
      `${sampleLabels.pvShort}I`,
      "#C94032",
      labelBg,
      "#C94032",
      38
    );
    pviSprite.position.set(-HALF + 0.95, -HALF + 0.65, 0.06);
    staticGroup.add(pviSprite);

    // ---- 2. PLANO HORIZONTAL (π / PH) inside horizontalGroup (FOLDS 0° → 90°) ----
    const phMat = new THREE.MeshBasicMaterial({
      color: dark ? 0x3b82f6 : 0x1e56a0,
      transparent: true,
      opacity: dark ? 0.12 : 0.095,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const phPlane = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), phMat);
    phPlane.rotation.x = -Math.PI / 2;
    horizontalGroup.add(phPlane);

    for (let i = -HALF; i <= HALF; i++) {
      const isEdge = Math.abs(i) === HALF;
      const op = isEdge ? 0.48 : i === 0 ? 0.25 : 0.15;
      horizontalGroup.add(
        makeSolidLine(
          new THREE.Vector3(i, 0, -HALF),
          new THREE.Vector3(i, 0, HALF),
          0x1e56a0,
          op
        )
      );
      if (i !== 0) {
        horizontalGroup.add(
          makeSolidLine(
            new THREE.Vector3(-HALF, 0, i),
            new THREE.Vector3(HALF, 0, i),
            0x1e56a0,
            op
          )
        );
      }
    }

    const phaSprite = makeTextSprite(
      `${sampleLabels.phShort}A`,
      "#1E56A0",
      labelBg,
      "#1E56A0",
      38
    );
    phaSprite.position.set(HALF - 0.95, 0.06, HALF - 0.65);
    horizontalGroup.add(phaSprite);

    const phpSprite = makeTextSprite(
      `${sampleLabels.phShort}P`,
      "#1E56A0",
      labelBg,
      "#1E56A0",
      38
    );
    phpSprite.position.set(HALF - 0.95, 0.06, -HALF + 0.65);
    horizontalGroup.add(phpSprite);

    // ---- 3. LINHA DE TERRA (LT) along X_w axis ----
    staticGroup.add(
      makeCylinderSegment(
        new THREE.Vector3(-HALF - 0.5, 0, 0),
        new THREE.Vector3(HALF + 0.5, 0, 0),
        0.065,
        0x0f766e,
        1
      )
    );
    // Origin O(0) sphere
    const originMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f766e })
    );
    staticGroup.add(originMesh);

    const ltSprite = makeTextSprite("LT", "#0F766E", labelBg, "#0F766E", 40);
    ltSprite.position.set(HALF + 0.85, 0.12, 0.12);
    staticGroup.add(ltSprite);

    // ---- 4. OPTIONAL BISECTORS (β₁₃ and β₂₄) ----
    if (showBisectors) {
      const b13Mat = new THREE.MeshBasicMaterial({
        color: 0xd97706,
        transparent: true,
        opacity: 0.12 * spaceFade,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const b13 = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), b13Mat);
      b13.rotation.x = Math.PI / 4; // Y = Z (1st & 3rd diedros)
      staticGroup.add(b13);

      const b24Mat = new THREE.MeshBasicMaterial({
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.1 * spaceFade,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const b24 = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), b24Mat);
      b24.rotation.x = -Math.PI / 4; // Y = -Z (2nd & 4th diedros)
      staticGroup.add(b24);

      if (spaceFade > 0.3) {
        const b13Tag = makeTextSprite("β₁₃", "#B45309", labelBg, "#B45309", 36);
        b13Tag.position.set(-HALF + 0.7, 3.8, 3.8);
        staticGroup.add(b13Tag);

        const b24Tag = makeTextSprite("β₂₄", "#6D28D9", labelBg, "#6D28D9", 36);
        b24Tag.position.set(-HALF + 0.7, 3.8, -3.8);
        staticGroup.add(b24Tag);
      }
    }

    // ---- 5. OPTIONAL XYZ AXES OVERLAY ----
    if (showXYZ) {
      const arrowX = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        5.8,
        0x0f766e,
        0.55,
        0.32
      );
      const arrowZ = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        5.8,
        0xc94032,
        0.55,
        0.32
      );
      const arrowY = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        5.8,
        0x1e56a0,
        0.55,
        0.32
      );
      staticGroup.add(arrowX);
      staticGroup.add(arrowZ);
      horizontalGroup.add(arrowY);

      const xTag = makeTextSprite("+X Absc.", "#0F766E", labelBg, undefined, 32);
      xTag.position.set(5.4, -0.55, 0.2);
      staticGroup.add(xTag);

      const zTag = makeTextSprite("+Z Cota", "#C94032", labelBg, undefined, 32);
      zTag.position.set(0.35, 5.7, 0.15);
      staticGroup.add(zTag);

      const yTag = makeTextSprite("+Y Afast.", "#1E56A0", labelBg, undefined, 32);
      yTag.position.set(0.35, 0.25, 5.65);
      horizontalGroup.add(yTag);
    }

    // ---- 6. DIEDRO QUADRANT LABELS (visible when not fully folded) ----
    if (showDiedroLabels && spaceFade > 0.35) {
      const diedroSpecs = [
        { txt: "1º D", pos: new THREE.Vector3(4.6, 3.4, 3.4), col: "#1E56A0" },
        { txt: "2º D", pos: new THREE.Vector3(4.6, 3.4, -3.4), col: "#0F766E" },
        { txt: "3º D", pos: new THREE.Vector3(4.6, -3.4, -3.4), col: "#C94032" },
        { txt: "4º D", pos: new THREE.Vector3(4.6, -3.4, 3.4), col: "#B45309" },
      ];
      diedroSpecs.forEach((d) => {
        const sp = makeTextSprite(d.txt, d.col, labelBg, undefined, 34);
        sp.scale.set(1.15, 0.52, 1);
        sp.position.copy(d.pos);
        staticGroup.add(sp);
      });
    }

    // ---- 7. POINTS, PROJECTIONS, PROJECTORS & REBATIMENTO ARCS ----
    points.forEach((pt) => {
      const labels = getProjectionLabels(pt.label, notation);
      const isSelected = pt.id === selectedPointId;
      const spacePos = new THREE.Vector3(pt.x, pt.z, pt.y);
      const pvPos = new THREE.Vector3(pt.x, pt.z, 0);
      const phLocalPos = new THREE.Vector3(pt.x, 0, pt.y);
      const ltPos = new THREE.Vector3(pt.x, 0, 0);

      // Spatial point (A) — fades out gently as sheet flattens to 90°
      if (spaceFade > 0.12) {
        const spaceSphere = new THREE.Mesh(
          new THREE.SphereGeometry(isSelected ? 0.26 : 0.21, 20, 20),
          new THREE.MeshStandardMaterial({
            color: pt.color,
            roughness: 0.25,
            metalness: 0.1,
            transparent: true,
            opacity: spaceFade,
          })
        );
        spaceSphere.position.copy(spacePos);
        dynamicGroup.add(spaceSphere);

        if (isSelected) {
          const halo = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.4, 24),
            new THREE.MeshBasicMaterial({
              color: pt.color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.5 * spaceFade,
            })
          );
          halo.position.copy(spacePos);
          dynamicGroup.add(halo);
        }

        const spaceTag = makeTextSprite(
          labels.space,
          inkColor,
          labelBg,
          pt.color,
          44
        );
        spaceTag.material.opacity = spaceFade;
        spaceTag.position.set(pt.x + 0.55, pt.z + 0.52, pt.y + 0.35);
        dynamicGroup.add(spaceTag);

        // Projecting rays: (A) -> A' (afastamento) and (A) -> A (cota)
        dynamicGroup.add(makeDashedLine(spacePos, pvPos, pt.color, 0.65 * spaceFade));
        dynamicGroup.add(
          makeDashedLine(spacePos, phLocalPos, pt.color, 0.65 * spaceFade)
        );
      }

      // Vertical Projection A' on π' (fixed in dynamicGroup)
      const pvDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xc94032 })
      );
      pvDot.position.copy(pvPos);
      dynamicGroup.add(pvDot);

      // Vertical Linha de Chamada segment (LT -> A')
      dynamicGroup.add(makeDashedLine(ltPos, pvPos, 0xc94032, 0.72));

      const pvTag = makeTextSprite(
        labels.vertical,
        "#C94032",
        labelBg,
        "#C94032",
        42
      );
      pvTag.scale.set(1.15, 0.52, 1);
      pvTag.position.set(
        pt.x + 0.42,
        pt.z + (pt.z >= 0 ? 0.38 : -0.38),
        0.08
      );
      dynamicGroup.add(pvTag);

      // Horizontal Projection A on π (inside horizontalGroup so it ROTATES with π!)
      const phDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e56a0 })
      );
      phDot.position.copy(phLocalPos);
      horizontalGroup.add(phDot);

      // Horizontal Linha de Chamada segment (LT -> A)
      horizontalGroup.add(makeDashedLine(ltPos, phLocalPos, 0x1e56a0, 0.72));

      const phTag = makeTextSprite(
        labels.horizontal,
        "#1E56A0",
        labelBg,
        "#1E56A0",
        42
      );
      phTag.scale.set(1.15, 0.52, 1);
      phTag.position.set(
        pt.x - 0.42,
        0.1,
        pt.y + (pt.y >= 0 ? 0.38 : -0.38)
      );
      horizontalGroup.add(phTag);

      // Quarter-circle Rebatimento compass arc showing A's trajectory when folding!
      if (Math.abs(pt.y) > 0.2 && foldAngle > 2) {
        const arcPts: THREE.Vector3[] = [];
        const steps = 24;
        const maxRad = (foldAngle * Math.PI) / 180;
        for (let s = 0; s <= steps; s++) {
          const a = (s / steps) * maxRad;
          arcPts.push(
            new THREE.Vector3(pt.x, -pt.y * Math.sin(a), pt.y * Math.cos(a))
          );
        }
        const arcGeom = new THREE.BufferGeometry().setFromPoints(arcPts);
        const arcMat = new THREE.LineBasicMaterial({
          color: 0x1e56a0,
          transparent: true,
          opacity: 0.48,
        });
        dynamicGroup.add(new THREE.Line(arcGeom, arcMat));
      }
    });

    // ---- 8. SEGMENTS AND EXTENDED LINES (r), r, r' ----
    const pointMap = new Map(points.map((p) => [p.id, p]));
    segments.forEach((seg) => {
      const a = pointMap.get(seg.fromId);
      const b = pointMap.get(seg.toId);
      if (!a || !b) return;

      const aSpace = new THREE.Vector3(a.x, a.z, a.y);
      const bSpace = new THREE.Vector3(b.x, b.z, b.y);
      const aPv = new THREE.Vector3(a.x, a.z, 0);
      const bPv = new THREE.Vector3(b.x, b.z, 0);
      const aPh = new THREE.Vector3(a.x, 0, a.y);
      const bPh = new THREE.Vector3(b.x, 0, b.y);

      // Spatial segment (A)(B)
      if (spaceFade > 0.12) {
        dynamicGroup.add(
          makeCylinderSegment(
            aSpace,
            bSpace,
            0.065,
            dark ? 0xf8fafc : 0x1c1917,
            spaceFade
          )
        );
      }

      // Vertical projection segment r'
      dynamicGroup.add(makeCylinderSegment(aPv, bPv, 0.045, 0xc94032, 0.92));

      // Horizontal projection segment r (inside horizontalGroup so it folds!)
      horizontalGroup.add(makeCylinderSegment(aPh, bPh, 0.045, 0x1e56a0, 0.92));

      // Extended infinite line (r), r', r
      if (seg.extendLine) {
        const extend = (p1: THREE.Vector3, p2: THREE.Vector3) => {
          const dir = new THREE.Vector3().subVectors(p2, p1);
          if (dir.length() < 1e-4) return null;
          dir.normalize();
          return [
            p1.clone().addScaledVector(dir, -3.5),
            p2.clone().addScaledVector(dir, 3.5),
          ] as const;
        };

        const extSpace = extend(aSpace, bSpace);
        if (extSpace && spaceFade > 0.12) {
          dynamicGroup.add(
            makeDashedLine(
              extSpace[0],
              extSpace[1],
              dark ? 0xe2e8f0 : 0x44403c,
              0.55 * spaceFade
            )
          );
        }
        const extPv = extend(aPv, bPv);
        if (extPv) {
          dynamicGroup.add(makeDashedLine(extPv[0], extPv[1], 0xc94032, 0.55));
        }
        const extPh = extend(aPh, bPh);
        if (extPh) {
          horizontalGroup.add(
            makeDashedLine(extPh[0], extPh[1], 0x1e56a0, 0.55)
          );
        }

        if (seg.label) {
          const lLabels = getLineProjectionLabels(seg.label, notation);
          if (spaceFade > 0.25) {
            const midSpace = aSpace.clone().lerp(bSpace, 0.65);
            const rSp = makeTextSprite(
              lLabels.space,
              inkColor,
              labelBg,
              undefined,
              34
            );
            rSp.scale.set(0.95, 0.45, 1);
            rSp.position.copy(midSpace).add(new THREE.Vector3(0, 0.55, 0.35));
            dynamicGroup.add(rSp);
          }
          const midPv = aPv.clone().lerp(bPv, 0.72);
          const rPv = makeTextSprite(
            lLabels.vertical,
            "#C94032",
            labelBg,
            undefined,
            34
          );
          rPv.scale.set(0.9, 0.42, 1);
          rPv.position.copy(midPv).add(new THREE.Vector3(0.4, 0.35, 0.08));
          dynamicGroup.add(rPv);

          const midPh = aPh.clone().lerp(bPh, 0.72);
          const rPh = makeTextSprite(
            lLabels.horizontal,
            "#1E56A0",
            labelBg,
            undefined,
            34
          );
          rPh.scale.set(0.9, 0.42, 1);
          rPh.position.copy(midPh).add(new THREE.Vector3(-0.4, 0.1, 0.35));
          horizontalGroup.add(rPh);
        }
      }
    });
  }, [points, segments, selectedPointId, foldAngle, notation, showXYZ, showBisectors, showDiedroLabels, dark]);

  if (webglError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-paper-300 bg-paper-50 ${className}`}
      >
        <p className="font-semibold text-ink-900">
          WebGL indisponível neste navegador
        </p>
        <p className="text-sm text-ink-500 mt-1">
          A visualização 2D da Épura continua 100% interativa ao lado.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border select-none ${
        dark
          ? "bg-blueprint-950 border-blueprint-700"
          : "bg-paper-50 border-paper-300"
      } ${className}`}
    >
      <div ref={mountRef} className="w-full h-full min-h-[280px] cursor-grab active:cursor-grabbing" />

      {/* Top overlay bar: Status badge + Camera Viewpoint Pills (no overlap on narrow mobile) */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase backdrop-blur-md border shrink-0 ${
            dark
              ? "bg-blueprint-900/85 border-blueprint-700 text-slate-200"
              : "bg-paper-50/90 border-paper-300 text-ink-700"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              foldAngle >= 88 ? "bg-lt" : "bg-ph"
            }`}
          />
          <span className="sm:hidden">
            {foldAngle >= 88
              ? "Épura 90°"
              : foldAngle > 2
                ? `${Math.round(foldAngle)}°`
                : "3D"}
          </span>
          <span className="hidden sm:inline">
            {foldAngle >= 88
              ? "Épura Rebatida (90°)"
              : foldAngle > 2
                ? `Rebatendo π (${Math.round(foldAngle)}°)`
                : "Espaço 3D · Monge"}
          </span>
        </span>

        <div className="pointer-events-auto flex items-center gap-1">
          {(
            [
              { id: "iso", label: "3D" },
              { id: "profile", label: "Perfil" },
              { id: "front", label: "Frontal" },
              { id: "top", label: "Topo" },
            ] as const
          ).map((cam) => (
            <button
              key={cam.id}
              type="button"
              onClick={() => applyCameraPreset(cam.id)}
              className={`px-2 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-semibold transition border backdrop-blur-md ${
                activePreset === cam.id
                  ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                  : dark
                    ? "bg-blueprint-900/80 text-slate-300 border-blueprint-700 hover:bg-blueprint-800"
                    : "bg-paper-50/90 text-ink-700 border-paper-300 hover:bg-paper-200"
              }`}
              title={`Câmera: ${cam.label}`}
            >
              {cam.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyCameraPreset("iso")}
            className={`p-1.5 rounded-lg border backdrop-blur-md transition ${
              dark
                ? "bg-blueprint-900/80 text-slate-300 border-blueprint-700 hover:bg-blueprint-800"
                : "bg-paper-50/90 text-ink-700 border-paper-300 hover:bg-paper-200"
            }`}
            title="Resetar câmera"
            aria-label="Resetar câmera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtle bottom interaction hint */}
      <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px]">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-sm ${
            dark
              ? "bg-blueprint-900/70 text-slate-400"
              : "bg-paper-50/80 text-ink-500"
          }`}
        >
          <Eye className="w-3 h-3" />
          Arraste para girar · Pinça/Scroll para zoom
        </span>
      </div>
    </div>
  );
}

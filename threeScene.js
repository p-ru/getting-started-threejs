import * as THREE from "three";
import getLayer from "./getLayer.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "jsm/loaders/PLYLoader.js";

import { CSS2DRenderer, CSS2DObject } from 'jsm/renderers/CSS2DRenderer.js';




export function setupThreeScene() {
  // CSS2DRenderer for labels
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '-13px';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none'; // pass mouse to canvas
  document.body.appendChild(labelRenderer.domElement);





  const w = window.innerWidth;
  const h = window.innerHeight;
  const scene = new THREE.Scene();
  scene.rotation.x = -Math.PI / 2;



  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(w, h);
  document.body.appendChild(renderer.domElement);

  const ctrls = new OrbitControls(camera, renderer.domElement);
  ctrls.enableDamping = true;

  //world axes
  const axes = new THREE.AxesHelper(1); // X red, Y green, Z blue
  scene.add(axes);


  // Drone marker
  const dronePositionGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const dronePositionMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const dronePositionMarker = new THREE.Mesh(dronePositionGeometry, dronePositionMaterial);
  scene.add(dronePositionMarker);


  //dummy waypoints and waylines
const waypoints = [
  { x: -2.42, y: -0.39, z: 1.25, id: "point_0" },
  { x: -4.47, y: 0.57, z: 1.25, id: "point_1" },
  { x: -2.44, y: 0.57, z: 1.25, id: "point_2" }
];
  const pts = waypoints.map(w => new THREE.Vector3(w.x, w.y, w.z));
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const dotMat = new THREE.PointsMaterial({ color: 0xff5533, size: 0.06 });
  const dots = new THREE.Points(geom, dotMat);
  scene.add(dots);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 1.0 });
  const line = new THREE.Line(geom, lineMat); // connects points in order (LINE_STRIP)
  scene.add(line);
  // waypoint labels
  const labelObjects = [];
  waypoints.forEach((w) => {
    const div = document.createElement('div');
    div.textContent = w.id;
    div.style.cssText = `
      color: #fff;
      font: 12px monospace;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0,0,0,0.6);
      transform: translate(-50%, -120%); /* center and lift above point */
      white-space: nowrap;
    `;

    const label = new CSS2DObject(div);
    label.position.set(w.x, w.y + 0.08, w.z); // slight Y offset above dot
    scene.add(label);
    labelObjects.push(label);
  });




  // Transformation matrix
  const transformationMatrix = new THREE.Matrix4();
  transformationMatrix.set(
    -3.55418505, 0.00549407, 0.24166754, -2.9772194,
    0.24149272, -0.07705495, 3.5533658, 0.57382213,
    0.01070744, 3.56155824, 0.0765049, 0.75848744,
    0.0, 0.0, 0.0, 1.0
  );

  // Load GLTF
  const gltfLaoder = new GLTFLoader();
  gltfLaoder.load(
    'assets/room_v2.glb',
    (gltf) => {
      const room_v2 = gltf.scene;
      room_v2.traverse((child) => {
        if (child.isMesh) child.geometry.center();
      });
      room_v2.applyMatrix4(transformationMatrix);
      scene.add(room_v2);
    }
  );

  // Load PLY
  const plyLoader = new PLYLoader();
  plyLoader.load(
    'scripts/tag_positions.ply',
    (geometry) => {
      const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
    }
  );

  // Lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));
  scene.add(getLayer({
    hue: 0.5,
    numSprites: 8,
    opacity: 0.2,
    radius: 10,
    size: 24,
    z: -15.5,
  }));



// Recommended color management for PBR/glTF workflows
renderer.outputColorSpace = THREE.SRGBColorSpace; // r152+ API [web:27][web:38]
// Optional but common for HDR/PBR
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.4;
const ambient = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambient);



  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    updateCameraInfo();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    ctrls.update();
  }



  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, ctrls, dronePositionMarker };


  function updateCameraInfo() {
  const cameraInfo = document.getElementById('camera-info');
  cameraInfo.innerHTML = `
    <strong>Camera Position:</strong><br>
    x: ${camera.position.x.toFixed(2)}<br>
    y: ${camera.position.y.toFixed(2)}<br>
    z: ${camera.position.z.toFixed(2)}<br>
    <strong>Camera Rotation:</strong><br>
    x: ${camera.rotation.x.toFixed(2)}<br>
    y: ${camera.rotation.y.toFixed(2)}<br>
    z: ${camera.rotation.z.toFixed(2)}
  `;
}
}
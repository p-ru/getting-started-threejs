import { setupRos } from './ros.js';
import { setupThreeScene } from './threeScene.js';
import { setupUI } from './ui.js';

const ros = setupRos();
const { scene, camera, renderer, ctrls, dronePositionMarker } = setupThreeScene();
setupUI({ ros, scene, camera, renderer, ctrls, dronePositionMarker });
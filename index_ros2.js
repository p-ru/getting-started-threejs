import * as THREE from "three";
import getLayer from "./getLayer.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "jsm/loaders/PLYLoader.js"; // Import PLYLoader
// Import necessary modules from Three.js



// Create a basic Three.js scene with a camera, renderer, and controls
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);








// Connect to ROS bridge websocket
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

// Subscribe to /odom/body_rig topic
const odomTopic = new ROSLIB.Topic({
  ros,
  name: '/odom/body_rig',
  messageType: 'nav_msgs/Odometry'
});

odomTopic.subscribe(msg => {
  // Extract position
  const { x, y, z } = msg.pose.pose.position;

  // Display in a div (make sure this exists in your HTML)
  const infoDiv = document.getElementById('odom-info');
  if (infoDiv) {
    infoDiv.innerHTML = `
      <strong>Odometry Position:</strong><br>
      x: ${x.toFixed(2)}<br>
      y: ${y.toFixed(2)}<br>
      z: ${z.toFixed(2)}
    `;
  }

  // Optionally log to console
  console.log('Odometry:', x, y, z);
});
import * as THREE from "three";
import getLayer from "./getLayer.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "jsm/loaders/PLYLoader.js"; // Import PLYLoader
// Import necessary modules from Three.js



// Non-blocking notification function
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '10px 20px';
  notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '1001';
  notification.style.transition = 'opacity 0.5s';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) document.body.removeChild(notification);
    }, 500);
  }, 3000);
}




// Initialize ROS connection
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090' // Replace with your ROS bridge server URL
});

// Subscribe to the image topic
// name: '/Mavic_3M/image/compressed',
// messageType: 'sensor_msgs/CompressedImage'
const imgTopic = new ROSLIB.Topic({
  ros,
  name: '/Mavic_3M/image/compressed',
  messageType: 'sensor_msgs/CompressedImage'
});

// Subscribe to the odometry topic for drone position
//name: '/tagslam/odom/body_rig',
//messageType: 'nav_msgs/Odometry'
const odomTopic = new ROSLIB.Topic({
  ros,
  name: '/tagslam/odom/body_rig',
  messageType: 'nav_msgs/Odometry'
});

imgTopic.subscribe(msg => {
  const streamElement = document.getElementById('stream');
  if (streamElement) {
    streamElement.src = 'data:image/jpeg;base64,' + msg.data;
  }


  // Calculate latency
  const rosTimestamp = msg.header.stamp.secs * 1000 + msg.header.stamp.nsecs / 1e6; // Convert ROS timestamp to milliseconds
  const currentTimestamp = Date.now(); // Current time in milliseconds
  const latency = Math.abs(currentTimestamp - rosTimestamp);
  // console.log('Latency:', latency, 'ms');
  //console.log('ROS Timestamp:', rosTimestamp, 'Current Timestamp:', currentTimestamp);
  // Display latency
  const latencyElement = document.getElementById('latency-value');
  if (latencyElement) {

    latencyElement.textContent = latency.toFixed(2); // Display latency in milliseconds
  }
});

// Subscribe to odometry topic to update drone position
odomTopic.subscribe(msg => {
  const { x, y, z } = msg.pose.pose.position;

  // Update the yellow dot's position in the 3D scene
  dronePositionMarker.position.set(x, y, z);

  // Update the text display for drone position
  const dronePositionInfo = document.getElementById('drone-position-info');
  if (dronePositionInfo) {
    dronePositionInfo.innerHTML = `
      <strong>Drone Position (Odom):</strong><br>
      x: ${x.toFixed(2)}<br>
      y: ${y.toFixed(2)}<br>
      z: ${z.toFixed(2)}
    `;
  }
});

// Create a service client for the landing service
const landingClient = new ROSLIB.Service({
  ros,
  name: '/landing',
  serviceType: 'std_srvs/Trigger' // Assuming a standard trigger service. You might need to change this.
});

// Create a service client for the takeoff service
const takeoffClient = new ROSLIB.Service({
  ros,
  name: '/takeoff',
  serviceType: 'std_srvs/Trigger' // Assuming a standard trigger service.
});

// Create a service client for setting the gimbal pitch
const setGimbalPitchClient = new ROSLIB.Service({
  ros,
  name: '/set_gimbal_pitch',
  serviceType: 'dji_srvs/SetValue'
});


// Create a service client for setting the gimbal yaw
const setGimbalYawClient = new ROSLIB.Service({
  ros,
  name: '/set_gimbal_yaw',
  serviceType: 'dji_srvs/SetValue'
});


// Create a service client for setting the gimbal yaw
const pullKeyListClient = new ROSLIB.Service({
  ros,
  name: '/pull_key_list',
  serviceType: 'dji_srvs/SetString'
});




// Create a basic Three.js scene with a camera, renderer, and controls
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5; const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Add landing button
const landButton = document.createElement('button');
landButton.textContent = 'Land Drone';
landButton.style.position = 'absolute';
landButton.style.right = '20px';
landButton.style.bottom = '60px';
landButton.style.padding = '10px 15px';
landButton.style.cursor = 'pointer';
landButton.style.zIndex = '100';
document.body.appendChild(landButton);

landButton.addEventListener('click', () => {
  console.log('Calling landing service...');
  const request = new ROSLIB.ServiceRequest({}); // Empty request for std_srvs/Trigger

  landingClient.callService(request, (result) => {
    console.log('Landing service response:', result);
    if (result.success) {
      showNotification('Landing command sent successfully!');
    } else {
      showNotification(`Landing command failed: ${result.message}`, true);
    }
  }, (error) => {
    console.error('Error calling landing service:', error);
    showNotification('Error calling landing service.', true);
  });
});


//Add take off button
const takeoffButton = document.createElement('button');
takeoffButton.textContent = 'Takeoff Drone';
takeoffButton.style.position = 'absolute';
takeoffButton.style.bottom = '20px';
takeoffButton.style.right = '20px';
takeoffButton.style.padding = '10px 15px';
takeoffButton.style.cursor = 'pointer';
takeoffButton.style.zIndex = '100';
document.body.appendChild(takeoffButton);

takeoffButton.addEventListener('click', () => {
  console.log('Calling takeoff service...');
  const request = new ROSLIB.ServiceRequest({}); // Empty request for std_srvs/Trigger

  takeoffClient.callService(request, (result) => {
    console.log('Takeoff service response:', result);
    if (result.success) {
      showNotification('Takeoff command sent successfully!');
    } else {
      showNotification(`Takeoff command failed: ${result.message}`, true);
    }
  }, (error) => {
    console.error('Error calling takeoff service:', error);
    showNotification('Error calling takeoff service.', true);
  });
});


//Add set gimbal pitch button
const setGimbalPitchButton = document.createElement('button');
setGimbalPitchButton.textContent = 'Set Gimbal Pitch';
setGimbalPitchButton.style.position = 'absolute';
setGimbalPitchButton.style.bottom = '100px';
setGimbalPitchButton.style.right = '20px';
setGimbalPitchButton.style.padding = '10px 15px';
setGimbalPitchButton.style.cursor = 'pointer';
setGimbalPitchButton.style.zIndex = '100';
document.body.appendChild(setGimbalPitchButton);

setGimbalPitchButton.addEventListener('click', () => {
  gimbalPitchInputContainer.style.display = 'flex';
  gimbalPitchInput.focus();
});

// --- Non-blocking Gimbal Pitch Input UI ---
const gimbalPitchInputContainer = document.createElement('div');
gimbalPitchInputContainer.style.position = 'absolute';
gimbalPitchInputContainer.style.bottom = '100px';
gimbalPitchInputContainer.style.right = '160px';
gimbalPitchInputContainer.style.padding = '10px';
gimbalPitchInputContainer.style.background = 'rgba(40, 40, 40, 0.8)';
gimbalPitchInputContainer.style.borderRadius = '5px';
gimbalPitchInputContainer.style.display = 'none'; // Hidden by default
gimbalPitchInputContainer.style.zIndex = '100';
gimbalPitchInputContainer.style.alignItems = 'center';

const gimbalPitchInput = document.createElement('input');
gimbalPitchInput.type = 'number';
gimbalPitchInput.placeholder = 'Angle';
gimbalPitchInput.style.width = '80px';
gimbalPitchInput.style.marginRight = '5px';

const gimbalPitchOkButton = document.createElement('button');
gimbalPitchOkButton.textContent = 'Set';

const gimbalPitchCancelButton = document.createElement('button');
gimbalPitchCancelButton.textContent = 'Cancel';
gimbalPitchCancelButton.style.marginLeft = '5px';

gimbalPitchInputContainer.appendChild(gimbalPitchInput);
gimbalPitchInputContainer.appendChild(gimbalPitchOkButton);
gimbalPitchInputContainer.appendChild(gimbalPitchCancelButton);
document.body.appendChild(gimbalPitchInputContainer);

gimbalPitchCancelButton.addEventListener('click', () => {
  gimbalPitchInputContainer.style.display = 'none';
});



gimbalPitchOkButton.addEventListener('click', () => {
  const angle = parseFloat(gimbalPitchInput.value);
  gimbalPitchInputContainer.style.display = 'none';

  if (isNaN(angle)) {
    showNotification('Invalid angle. Please enter a number.', true);
    return;
  }

  console.log(`Calling set_gimbal service with angle: ${angle}`);
  const request = new ROSLIB.ServiceRequest({
    value: angle
  });



  setGimbalPitchClient.callService(request, (result) => {
    console.log('Set gimbal service response:', result);
    if (result.success) {
      showNotification('Gimbal command sent successfully!');
    } else {
      showNotification(`Set gimbal command failed: ${result.message || 'No message provided.'}`, true);
    }
  }, (error) => {
    console.error('Error calling set_gimbal service:', error);
    showNotification('Error calling set_gimbal service.', true);
  });
});






//Add set gimbal yaw button
const setGimbalYawButton = document.createElement('button');
setGimbalYawButton.textContent = 'Set Gimbal Yaw';
setGimbalYawButton.style.position = 'absolute';
setGimbalYawButton.style.bottom = '140px';
setGimbalYawButton.style.right = '20px';
setGimbalYawButton.style.padding = '10px 15px';
setGimbalYawButton.style.cursor = 'pointer';
setGimbalYawButton.style.zIndex = '100';
document.body.appendChild(setGimbalYawButton);

setGimbalYawButton.addEventListener('click', () => {
  gimbalYawInputContainer.style.display = 'flex';
  gimbalYawInput.focus();
});

// --- Non-blocking Gimbal Yaw Input UI ---
const gimbalYawInputContainer = document.createElement('div');
gimbalYawInputContainer.style.position = 'absolute';
gimbalYawInputContainer.style.bottom = '140px';
gimbalYawInputContainer.style.right = '160px';
gimbalYawInputContainer.style.padding = '10px';
gimbalYawInputContainer.style.background = 'rgba(40, 40, 40, 0.8)';
gimbalYawInputContainer.style.borderRadius = '5px';
gimbalYawInputContainer.style.display = 'none'; // Hidden by default
gimbalYawInputContainer.style.zIndex = '100';
gimbalYawInputContainer.style.alignItems = 'center';

const gimbalYawInput = document.createElement('input');
gimbalYawInput.type = 'number';
gimbalYawInput.placeholder = 'Angle';
gimbalYawInput.style.width = '80px';
gimbalYawInput.style.marginRight = '5px';

const gimbalYawOkButton = document.createElement('button');
gimbalYawOkButton.textContent = 'Set';

const gimbalYawCancelButton = document.createElement('button');
gimbalYawCancelButton.textContent = 'Cancel';
gimbalYawCancelButton.style.marginLeft = '5px';

gimbalYawInputContainer.appendChild(gimbalYawInput);
gimbalYawInputContainer.appendChild(gimbalYawOkButton);
gimbalYawInputContainer.appendChild(gimbalYawCancelButton);
document.body.appendChild(gimbalYawInputContainer);

gimbalYawCancelButton.addEventListener('click', () => {
  gimbalYawInputContainer.style.display = 'none';
});



gimbalYawOkButton.addEventListener('click', () => {
  const angle = parseFloat(gimbalYawInput.value);
  gimbalYawInputContainer.style.display = 'none';

  if (isNaN(angle)) {
    showNotification('Invalid angle. Please enter a number.', true);
    return;
  }

  console.log(`Calling set_gimbal service with angle: ${angle}`);
  const request = new ROSLIB.ServiceRequest({
    value: angle
  });



  setGimbalYawClient.callService(request, (result) => {
    console.log('Set gimbal service response:', result);
    if (result.success) {
      showNotification('Gimbal command sent successfully!');
    } else {
      showNotification(`Set gimbal command failed: ${result.message || 'No message provided.'}`, true);
    }
  }, (error) => {
    console.error('Error calling set_gimbal service:', error);
    showNotification('Error calling set_gimbal service.', true);
  });
});










// Create a div to display drone position
const dronePositionInfo = document.createElement('div');
dronePositionInfo.id = 'drone-position-info';
dronePositionInfo.style.position = 'absolute';
dronePositionInfo.style.top = '180px';
dronePositionInfo.style.left = '10px';
dronePositionInfo.style.color = 'white';
dronePositionInfo.style.background = 'rgba(0,0,0,0.5)';
dronePositionInfo.style.padding = '10px';
dronePositionInfo.style.borderRadius = '5px';
dronePositionInfo.style.fontFamily = 'monospace';
dronePositionInfo.style.zIndex = '100';
dronePositionInfo.innerHTML = '<strong>Drone Position (Odom):</strong><br>Waiting for data...';
document.body.appendChild(dronePositionInfo);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;

// Create a marker for the drone's current position
const dronePositionGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const dronePositionMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow
const dronePositionMarker = new THREE.Mesh(dronePositionGeometry, dronePositionMaterial);
scene.add(dronePositionMarker);


const transformationMatrix = new THREE.Matrix4();
transformationMatrix.set(
  -3.55418505, 0.00549407, 0.24166754, -2.9772194,
  0.24149272, -0.07705495, 3.5533658, 0.57382213,
  0.01070744, 3.56155824, 0.0765049, 0.75848744,
  0.0, 0.0, 0.0, 1.0
);

// Load GLTF model
const gltfLaoder = new GLTFLoader();
gltfLaoder.load(
  'assets/room_v2.glb', // Replace with your model path
  (gltf) => {
    console.log('GLTF model loaded:', gltf);
    const room_v2 = gltf.scene;
    room_v2.traverse((child) => {
      if (child.isMesh) {
        //child.material.side = THREE.DoubleSide;
        child.geometry.center();
      }
    });
    room_v2.applyMatrix4(transformationMatrix); // Apply the transformation matrix

    scene.add(room_v2);
  },
);

// Load PLY file
const plyLoader = new PLYLoader();
plyLoader.load(
  'scripts/tag_positions.ply', // Path to your PLY file
  (geometry) => {
    const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 });
    const points = new THREE.Points(geometry, material);
    //points.rotation.x = -Math.PI / 2; // Rotate 90 degrees around X-axis

    scene.add(points);
    console.log('PLY file loaded:', geometry);
  },
  undefined,
  (error) => {
    console.error('Error loading PLY file:', error);
  }
);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshStandardMaterial({
//   color: 0xffff00,
// });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(hemiLight);

// Sprites BG
const gradientBackground = getLayer({
  hue: 0.5,
  numSprites: 8,
  opacity: 0.2,
  radius: 10,
  size: 24,
  z: -15.5,
});
scene.add(gradientBackground);


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
function animate() {
  requestAnimationFrame(animate);
  updateCameraInfo();
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.02;
  renderer.render(scene, camera);
  ctrls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);






// Create a button to pull key list
const pullKeyListButton = document.createElement('button');
pullKeyListButton.textContent = 'Pull Key List';
pullKeyListButton.style.position = 'absolute';
pullKeyListButton.style.bottom = '20px';
pullKeyListButton.style.left = '20px';
pullKeyListButton.style.padding = '10px 15px';
pullKeyListButton.style.cursor = 'pointer';
pullKeyListButton.style.zIndex = '100';
document.body.appendChild(pullKeyListButton);

// Create a floating text window for displaying the key list
const keyListWindow = document.createElement('div');
keyListWindow.id = 'key-list-window';
keyListWindow.style.position = 'absolute';
keyListWindow.style.top = '70px';
keyListWindow.style.right = '360px';
keyListWindow.style.width = '320px';
keyListWindow.style.maxHeight = '300px';
keyListWindow.style.overflowY = 'auto';
keyListWindow.style.background = 'rgba(30,30,30,0.95)';
keyListWindow.style.color = 'white';
keyListWindow.style.padding = '15px';
keyListWindow.style.borderRadius = '8px';
keyListWindow.style.fontFamily = 'monospace';
keyListWindow.style.fontSize = '14px';
keyListWindow.style.zIndex = '100';
keyListWindow.style.display = 'none';
document.body.appendChild(keyListWindow);


pullKeyListButton.addEventListener('click', () => {
  // Prompt the user for the key/channel string
  const userValue = prompt('Enter key/channel for pull_key_list (e.g., BATTERY, AIRLINK, CAMERA, GIMBAL, REMOTE_CONTROLLER, FLIGHT_CONTROL):', '');
  if (userValue === null) return; // Cancelled

  keyListWindow.style.display = 'block';
  keyListWindow.textContent = 'Loading...';

  const request = new ROSLIB.ServiceRequest({
    value: userValue
  });

  pullKeyListClient.callService(request, (result) => {
    keyListWindow.textContent = result.value || JSON.stringify(result, null, 2);
  }, (error) => {
    keyListWindow.textContent = 'Error: ' + (error.message || error.toString());
  });
});

// Optional: Hide the window when clicked
// keyListWindow.addEventListener('click', () => {
//   keyListWindow.style.display = 'none';
// });


document.body.appendChild(renderer.domElement);

// Hide key list window when clicking the main display
renderer.domElement.addEventListener('click', () => {
  keyListWindow.style.display = 'none';

  gimbalYawInputContainer.style.display = 'none';
  gimbalPitchInputContainer.style.display = 'none';
});
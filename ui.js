export function setupUI({ ros, scene, camera, renderer, ctrls, dronePositionMarker }) {


// Notification
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

// UI elements (buttons, info panels, etc.)
// ... replicate your button creation and event listeners here ...
// Example: Land button
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
const request = new ROSLIB.ServiceRequest({});
ros.clients.landing.callService(request, (result) => {
    if (result.success) showNotification('Landing command sent successfully!');
    else showNotification(`Landing command failed: ${result.message}`, true);
}, (error) => {
    showNotification('Error calling landing service.', true);
});
});

// ...repeat for takeoff, gimbal, key list, etc...

// ROS topic subscriptions
// ros.topics.img.subscribe(msg => {
// const streamElement = document.getElementById('stream');
// if (streamElement) streamElement.src = 'data:image/jpeg;base64,' + msg.data;
// const rosTimestamp = msg.header.stamp.secs * 1000 + msg.header.stamp.nsecs / 1e6;
// const currentTimestamp = Date.now();
// const latency = Math.abs(currentTimestamp - rosTimestamp);
// const latencyElement = document.getElementById('latency-value');
// if (latencyElement) latencyElement.textContent = latency.toFixed(2);
// });

ros.topics.odom.subscribe(msg => {
const { x, y, z } = msg.pose.pose.position;
dronePositionMarker.position.set(x, y, z);
const dronePositionInfo = document.getElementById('drone-position-info');
if (dronePositionInfo) {
    dronePositionInfo.innerHTML = `
    <strong>Drone Position (TagSLAM):</strong><br>
    x: ${x.toFixed(2)}<br>
    y: ${y.toFixed(2)}<br>
    z: ${z.toFixed(2)}
    `;
}
});

  // ...add other UI logic and event listeners...

// //Add take off button
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

  ros.clients.takeoff.callService(request, (result) => {
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


// //Add set gimbal pitch button
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


// // --- Non-blocking Gimbal Pitch Input UI ---
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



  ros.clients.setGimbalPitch.callService(request, (result) => {
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



   ros.clients.setGimbalYaw.callService(request, (result) => {
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
dronePositionInfo.innerHTML = '<strong>Drone Position (TagSLAM):</strong><br>Waiting for data...';
document.body.appendChild(dronePositionInfo);







// Create a button to pull key list
const pullKeyListButton = document.createElement('button');
pullKeyListButton.textContent = 'Pull Key List';
pullKeyListButton.style.position = 'absolute';
pullKeyListButton.style.bottom = '180px';
pullKeyListButton.style.right = '20px';
pullKeyListButton.style.padding = '10px 15px';
pullKeyListButton.style.cursor = 'pointer';
pullKeyListButton.style.zIndex = '100';
document.body.appendChild(pullKeyListButton);





// Create a floating dropdown for displaying and searching the key list
const keyListDropdown = document.createElement('div');
keyListDropdown.id = 'key-list-dropdown';
keyListDropdown.style.position = 'absolute';
keyListDropdown.style.top = '70px';
keyListDropdown.style.right = '700px'; //360px
keyListDropdown.style.width = '320px';
keyListDropdown.style.maxHeight = '300px';
keyListDropdown.style.overflowY = 'auto';
keyListDropdown.style.background = 'rgba(30,30,30,0.95)';
keyListDropdown.style.color = 'white';
keyListDropdown.style.padding = '15px';
keyListDropdown.style.borderRadius = '8px';
keyListDropdown.style.fontFamily = 'monospace';
keyListDropdown.style.fontSize = '14px';
keyListDropdown.style.zIndex = '100';
keyListDropdown.style.display = 'none';
document.body.appendChild(keyListDropdown);

// Add a search input
const keyListSearch = document.createElement('input');
keyListSearch.type = 'text';
keyListSearch.placeholder = 'Search key...';
keyListSearch.style.width = '100%';
keyListSearch.style.marginBottom = '10px';
keyListSearch.style.padding = '5px';
keyListSearch.style.borderRadius = '4px';
keyListSearch.style.border = 'none';
keyListDropdown.appendChild(keyListSearch);

// Container for the list items
const keyListItemsContainer = document.createElement('div');
keyListDropdown.appendChild(keyListItemsContainer);






// Show dropdown and populate on button click
pullKeyListButton.addEventListener('click', () => {
  const userValue = prompt('Enter key/channel for pull_key_list (e.g., BATTERY, AIRLINK, CAMERA, GIMBAL, REMOTE_CONTROLLER, FLIGHT_CONTROL):', '');
  if (userValue === null) return;

  keyListDropdown.style.display = 'block';
  keyListItemsContainer.innerHTML = 'Loading...';

  const request = new ROSLIB.ServiceRequest({ value: userValue });

  ros.clients.pullKeyList.callService(request, (result) => {
    // Parse the result string into an array
    let keys = [];
    try {
      keys = JSON.parse(result.value);
    } catch {
      // Fallback: parse comma-separated values
      keys = result.message.replace(/^\[|\]$/g, '').split(',').map(k => k.trim());
    }

    // Render the list
    renderKeyList(userValue, keys);
  }, (error) => {
    keyListItemsContainer.innerHTML = 'Error: ' + (error.message || error.toString());
  });
});

// Render function for the key list
function renderKeyList(userValue, keys) {
  keyListItemsContainer.innerHTML = '';
  keys.forEach(key => {
    const item = document.createElement('div');
    item.textContent = key;
    item.style.padding = '6px 8px';
    item.style.cursor = 'pointer';
    item.style.borderBottom = '1px solid #444';

    // wrapping styles
    item.style.whiteSpace = 'normal';        // allow soft line wraps
    item.style.overflowWrap = 'anywhere';    // break long tokens/IDs if needed
    item.style.wordBreak = 'break-word';     // helpful fallback
    // if this sits inside a flex row/grid container:
    item.style.minWidth = '0';               // let it shrink and wrap


    item.addEventListener('click', () => {
      // Call the pullKeyInfo service
      keyListItemsContainer.innerHTML = `Loading info for <strong>${key}</strong>...`;

      const request = new ROSLIB.ServiceRequest({ value: `${userValue}.${key}` });
      ros.clients.pullKeyInfo.callService(request, (result) => {
        // Display the result in the dropdown
        keyListItemsContainer.innerHTML = `
          <strong>Key Info for ${key}:</strong><br>
          <pre class="pre-wrap">${result.message}</pre>
          <button id="back-to-key-list">Back</button>
        `;
        // Add back button handler
        document.getElementById('back-to-key-list').onclick = () => {
          renderKeyList(userValue, keys);
        };
      }, (error) => {
        keyListItemsContainer.innerHTML = `Error: ${error.message || error.toString()}<br><button id="back-to-key-list">Back</button>`;
        document.getElementById('back-to-key-list').onclick = () => {
          renderKeyList(userValue, keys);
        };
      });
    });
    keyListItemsContainer.appendChild(item);
  });
}

// Search filter
keyListSearch.addEventListener('input', () => {
  const filter = keyListSearch.value.toLowerCase();
  Array.from(keyListItemsContainer.children).forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(filter) ? '' : 'none';
  });
});

// Hide dropdown when clicking the main display
renderer.domElement.addEventListener('click', () => {
  keyListDropdown.style.display = 'none';
  gimbalYawInputContainer.style.display = 'none';
  gimbalPitchInputContainer.style.display = 'none';
});






// Build UI once
const keyDialogue = document.createElement('div');
keyDialogue.id = 'key-dialogue';
Object.assign(keyDialogue.style, {
  position: 'absolute', bottom: '20px', right: '160px',
  width: '600px', background: 'rgba(0,0,0,0.5)', color: 'white',
  Rightpadding: '15px', borderRadius: '8px', fontFamily: 'monospace',
  fontSize: '14px', zIndex: '100', display: 'block'
});



const body = document.createElement('div');
body.id = 'key-dialogue-body';
Object.assign(body.style, {
  maxHeight: '300px', overflowY: 'auto', scrollbarGutter: 'stable both-edges',
  padding: '0 20px', 
});

const footer = document.createElement('div');
footer.style.marginTop = '8px';
const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear';
footer.appendChild(clearBtn);


keyDialogue.appendChild(body);
keyDialogue.appendChild(footer);
document.body.appendChild(keyDialogue);

// Clear history
clearBtn.addEventListener('click', () => {
  body.innerHTML = ''; // remove previous messages [web:223]
});

// Subscribe and append messages
ros.topics.otherState.subscribe(msg => {
  const el = document.getElementById('key-dialogue-body');
  if (!el) return;

  // Detect if user is already at bottom before appending [web:219][web:222]
  const atBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) <= 1;

  // Safer DOM creation than innerHTML (or use insertAdjacentHTML if preferred) [web:232][web:214]
  const pre = document.createElement('pre');
  pre.className = 'pre-wrap';
  pre.textContent = msg.data; // preserves text safely [web:232]
  el.appendChild(pre); // keep history by appending [web:232]

  // Auto-scroll only if user was at bottom [web:222][web:219]
  if (atBottom) el.scrollTop = el.scrollHeight;
});

}
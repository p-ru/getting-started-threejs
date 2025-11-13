export function setupRos() {
  const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
  });

  // Service clients
  ros.clients = {
    landing: new ROSLIB.Service({ ros, name: '/Mavic_3M/landing', serviceType: 'std_srvs/Trigger' }),
    takeoff: new ROSLIB.Service({ ros, name: '/Mavic_3M/takeoff', serviceType: 'std_srvs/Trigger' }),
    setGimbalPitch: new ROSLIB.Service({ ros, name: '/Mavic_3M/set_gimbal_pitch', serviceType: 'dji_srvs/SetValue' }),
    setGimbalYaw: new ROSLIB.Service({ ros, name: '/Mavic_3M/set_gimbal_yaw', serviceType: 'dji_srvs/SetValue' }),
    pullKeyList: new ROSLIB.Service({ ros, name: '/Mavic_3M/pull_key_list', serviceType: 'dji_srvs/SetString' }),
    pullKeyInfo: new ROSLIB.Service({ ros, name: '/Mavic_3M/pull_key_info', serviceType: 'dji_srvs/SetString' }),
  };

  // Topics
  ros.topics = {
    img: new ROSLIB.Topic({ ros, name: '/Mavic_3M/image/compressed', messageType: 'sensor_msgs/CompressedImage' }),
    odom: new ROSLIB.Topic({ ros, name: '/tagslam/odom/body_rig', messageType: 'nav_msgs/Odometry' }),
    otherState: new ROSLIB.Topic({ ros, name: '/Mavic_3M/state/other', messageType: 'std_msgs/String' }),
  

  };

  return ros;
}
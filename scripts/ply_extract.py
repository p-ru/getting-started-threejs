import yaml
import open3d as o3d
import numpy as np

def extract_tag_positions(yaml_file):
    """Extract tag positions from a TagSLAM YAML file."""
    with open(yaml_file, 'r') as file:
        data = yaml.safe_load(file)
    
    tag_positions = []
    for body in data.get('bodies', []):  # Iterate over the list of bodies
        
        grasp_lab = body.get('grasp_lab', {})

        tags = grasp_lab.get('tags', [])
        for tag in tags:
            position = tag.get('pose', {}).get('position', {})
            if position:
                tag_positions.append([
                    position.get('x', 0.0),
                    position.get('y', 0.0),
                    position.get('z', 0.0)
                ])
    return np.array(tag_positions)

# ...existing code...

def create_point_cloud(tag_positions, output_file):
    """Create a point cloud from tag positions and save it as a .ply file."""
    if tag_positions.shape[1] != 3:
        raise ValueError("Tag positions must be a NumPy array with shape (N, 3).")
    
    point_cloud = o3d.geometry.PointCloud()
    point_cloud.points = o3d.utility.Vector3dVector(tag_positions)
    o3d.io.write_point_cloud(output_file, point_cloud)
    print(f"Point cloud saved to {output_file}")

if __name__ == "__main__":
    # Path to the TagSLAM YAML file
    yaml_file = "/home/droneproject/getting-started-threejs/scripts/greenhouse_tagslam.yaml"
    
    # Output PLY file
    output_file = "/home/droneproject/getting-started-threejs/scripts/greenhouse_tag_positions.ply"
    
    # Extract tag positions and create point cloud
    tag_positions = extract_tag_positions(yaml_file)
    
    # Debugging output
    print("Tag positions:", tag_positions)
    print("Shape of tag_positions:", tag_positions.shape)
    
    if tag_positions.size == 0:
        print("No valid tag positions found in the YAML file.")
    else:
        create_point_cloud(tag_positions, output_file)
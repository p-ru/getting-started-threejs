import numpy as np
import open3d as o3d

# GLTF vertex positions (source)
P = np.array([
    [-0.6835, 0.1401, 0.7675],   # id 41
    [-0.8656, 0.0960, -0.4027],  # id 33
    [-0.1119, 0.1709, -0.5489]   # id 134
])

# TagSLAM world coordinates (target)
Q = np.array([
    [-0.38508897, 3.12226044, 1.31113689],  # id 41
    [0.03136762, -1.10654857, 1.05567428],  # id 33
    [-2.71669041, -1.38090090, 1.32633576]  # id 134
])

# Convert to Open3D format
source_pcd = o3d.geometry.PointCloud()
source_pcd.points = o3d.utility.Vector3dVector(P)

target_pcd = o3d.geometry.PointCloud()
target_pcd.points = o3d.utility.Vector3dVector(Q)

# Create a correspondence set
corres = o3d.utility.Vector2iVector(np.array([[0, 0], [1, 1], [2, 2]]))

# Estimate transformation with scale
est = o3d.pipelines.registration.TransformationEstimationPointToPoint(with_scaling=True)
transformation = est.compute_transformation(source_pcd, target_pcd, corres)

print("Transformation matrix:\n", transformation)
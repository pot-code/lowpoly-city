import { MeshLambertMaterial } from 'three';

export default async function load(scene) {
  await scene.loadGltf('assets/3d/cube/cube.glb', (sm) => {
    sm.mesh.castShadow = true;
  });
}

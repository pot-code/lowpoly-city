import { MeshLambertMaterial } from 'three';

export default async function load(scene) {
  await scene.loadObj('assets/3d/data_center/floor.obj', (sm) => {
    sm.mesh.castShadow = true;
    sm.mesh.receiveShadow = true;
    sm.setMaterial(
      new MeshLambertMaterial({
        color: 0xeaeaea,
        reflectivity: 0.1,
      })
    );
  });

  await scene.loadObj(
    'assets/3d/data_center/windmill.obj',
    (sm) => {
      sm.mesh.castShadow = true;
      sm.setMaterial(
        new MeshLambertMaterial({
          color: 0xfcba2a,
        })
      );
      sm.selectable = true;
    },
    {
      name: 'Windmill',
    }
  );

  await scene.loadObj(
    'assets/3d/data_center/data_center.obj',
    (sm) => {
      sm.mesh.castShadow = true;
      sm.setMaterial(
        new MeshLambertMaterial({
          color: 0xfcba2a,
        })
      );
      sm.selectable = true;
    },
    {
      name: 'Data Center',
    }
  );

  await scene.loadGltf('assets/3d/data_center/scene.glb', (sm) => {
    sm.mesh.castShadow = true;
  });
}

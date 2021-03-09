/*
 * Copyright (C) 2021 pot-code GNU General Public License v3.0 only.
 * File Created: Saturday, 20th February 2021 5:16:01 pm
 * Author: pot-code (hg136290354@163.com)
 */

import {
  Scene,
  Color,
  DirectionalLight,
  OrthographicCamera,
  PlaneGeometry,
  MeshLambertMaterial,
  Mesh,
  WebGLRenderer,
  Vector2,
  Raycaster,
  AmbientLight,
  PCFSoftShadowMap,
  PointLight,
  DirectionalLightHelper,
  PointLightHelper,
  CameraHelper,
  Vector3,
  Clock,
  AnimationMixer,
  PerspectiveCamera,
} from 'three';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { fromEvent, interval } from 'rxjs';
import { throttle } from 'rxjs/operators';

import { OBJLoader } from './lib/OBJLoader.js';
import { GLTFExporter } from './lib/GLTFExporter.js';
import { OrbitControls } from './lib/OrbitControls';
import { GLTFLoader } from './lib/GLTFLoader.js';

class SceneMesh {
  constructor(mesh, meta) {
    this.mesh = mesh;
    this.meta = meta;
    this.selectable = false;
  }
  getId() {
    return this.mesh.id;
  }
  setMaterial(material) {
    this.mesh.material = material;
  }
  getMaterial() {
    return this.mesh.material;
  }
}

class SelectedSceneMesh {
  constructor(sm) {
    this.sm = null;
    this.mat = null;
    if (sm) {
      this.sm = sm;
      this.mat = sm.getMaterial();
    }
  }
  reset() {
    if (this.sm) {
      this.sm.setMaterial(this.mat);
    }
    this.sm = null;
    this.mat = null;
  }
  selected() {
    return this.sm;
  }
  setSelected(newSelection, activeMaterial) {
    if (this.sm !== newSelection) {
      if (this.sm) {
        this.sm.setMaterial(this.mat);
      }
      this.sm = newSelection;
      this.mat = newSelection.getMaterial();
      this.sm.setMaterial(activeMaterial);
    }
  }
  getMesh() {
    this.sm;
  }
}

class Core {
  constructor() {
    this._exporter = new GLTFExporter();
    this._objLoader = new OBJLoader();
    this._gltfLoader = new GLTFLoader();
    this._mouse = new Vector2(-1, -1);
    this._raycaster = new Raycaster();
    this._selected = new SelectedSceneMesh(); // empty selection
    this._selectedMaterial = new MeshLambertMaterial({
      color: 0x4f9ef4,
    });
    this._mouseMoveCallbacks = [];
    this._registry = new Map();
    this._mixers = [];
    this._lights = [];

    this._state = {
      cameraDistance: 27,
      ambientTotal: 1.05,
      ambient: 0.67,
      rotationSpeed: 0.008,
    };

    const scene = new Scene();
    scene.background = new Color(0xffffff);

    const aspect = window.innerWidth / window.innerHeight;
    const d = this._state.cameraDistance;
    const camera = new OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 200);
    // const camera = new PerspectiveCamera(35, aspect, 0.1, 100);
    // const cameraHelper = new CameraHelper(camera);
    // scene.add(cameraHelper);
    camera.position.set(50, 47, 50);
    camera.lookAt(0, 0, 0);
    camera.zoom = 0.95;

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const $root = renderer.domElement;
    document.body.appendChild($root);

    const $save = document.createElement('a');
    $save.style.display = 'none';
    document.body.appendChild($save);

    // private
    this._$save = $save;
    this._$root = $root;

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this._setupEnvLighting(scene);
    this._setupGround(scene);
    this._addGUI();

    window.addEventListener('mousemove', this._pickMouseMove.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    fromEvent(window, 'resize')
      .pipe(
        throttle(() => interval(300), {
          trailing: true,
        })
      )
      .subscribe(this._resize.bind(this));
  }

  _resize() {
    const renderer = this.renderer;
    const aspect = window.innerWidth / window.innerHeight;
    const camera = this.camera;
    const d = this._state.cameraDistance;

    camera.left = -d * aspect;
    camera.right = d * aspect;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
  }

  _addGUI() {
    const gui = new GUI();
    const state = this._state;

    const lightingFolder = gui.addFolder('lighting');
    const lights = this._lights;
    const mainLight = lights.find((v) => v.name === 'main_light_cs');
    const ambientLight = lights.find((v) => v.name === 'ambient');
    const ambientTotal = state.ambientTotal;

    lightingFolder.open();
    lightingFolder.add(state, 'ambient', 0, ambientTotal, 0.01).onChange((v) => {
      ambientLight.intensity = v;
      mainLight.intensity = Math.max(0, ambientTotal - v);
    });

    const camera = this.camera;
    const cameraFolder = gui.addFolder('camera');
    const aspect = window.innerWidth / window.innerHeight;
    cameraFolder.open();
    cameraFolder.add(state, 'cameraDistance', 10, 100, 1).onChange((v) => {
      camera.left = -v * aspect;
      camera.right = v * aspect;
      camera.top = v;
      camera.bottom = -v;
      camera.updateProjectionMatrix();
    });
  }

  _getOrbitControl(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    // controls.enableRotate = false;

    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI / 3;
    controls.minPolarAngle = Math.PI / 9;
    return controls;
  }

  _setupGround(scene) {
    const ground = new Mesh(
      new PlaneGeometry(200, 200),
      new MeshLambertMaterial({
        color: 0xc5c5c5,
      })
    );
    ground.receiveShadow = true;
    ground.rotateX(-Math.PI / 2);
    ground.position.y = -0.1;
    scene.add(ground);
    this._registry.set(ground.id, new SceneMesh(ground));
  }

  _setupEnvLighting(scene) {
    const { ambient, ambientTotal } = this._state;

    const ambientLight = new AmbientLight(0xffffff, ambient); // soft white light
    ambientLight.name = 'ambient';
    scene.add(ambientLight);
    this._lights.push(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, Math.max(0, ambientTotal - ambient));
    directionalLight.name = 'main_light_cs';
    directionalLight.position.set(-2, 30, 2);
    directionalLight.castShadow = true;
    // directionalLight.shadow.radius = 40;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;

    // casting shadow frustum
    const radius = 70;
    const shadowCamera = new OrthographicCamera(-radius, radius, radius, -radius, 0.1, 100);
    directionalLight.shadow.camera = shadowCamera;

    this.camera.add(directionalLight);
    this._lights.push(directionalLight);
    scene.add(directionalLight);

    const pointLight1 = new PointLight(0xffffff, 0.35, 100);
    pointLight1.name = 'point_light_1';
    pointLight1.position.set(10, 20, 20);
    scene.add(pointLight1);
    this._lights.push(pointLight1);

    const pointLight2 = new PointLight(0xffffff, 0.1, 60);
    pointLight2.name = 'point_light_2';
    pointLight2.position.set(-40, 10, 20);
    scene.add(pointLight2);
    this._lights.push(pointLight2);

    // const helper = new DirectionalLightHelper(directionalLight, 5, 0xff0000);
    // scene.add(helper);
    // const directionalCameraHelper = new CameraHelper(directionalLight.shadow.camera);
    // scene.add(directionalCameraHelper);
    // const pointLight1Helper = new PointLightHelper(pointLight1, 2, 0xff0000);
    // scene.add(pointLight1Helper);
    // const pointLight2Helper = new PointLightHelper(pointLight2, 2, 0x00ff00);
    // scene.add(pointLight2Helper);
  }

  _pickMouseMove(event) {
    const $root = this._$root;

    this._mouse.x = (event.clientX / $root.clientWidth) * 2 - 1;
    this._mouse.y = -(event.clientY / $root.clientHeight) * 2 + 1;
  }

  _pickObject() {
    const raycaster = this._raycaster;
    const camera = this.camera;
    const mouse = this._mouse;
    const scene = this.scene;
    const pick_material = this._selectedMaterial;
    const selected = this._selected;
    const registry = this._registry;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const sm = registry.get(intersect.object.id);

      if (!sm || !sm.selectable) {
        selected.reset();
      } else {
        selected.setSelected(sm, pick_material);
      }
    } else {
      selected.reset();
    }
  }

  _onMouseMove(event) {
    const cbs = this._mouseMoveCallbacks;

    for (let cb of cbs) {
      cb(event, this._selected);
    }
  }

  _save(obj, filename) {
    const $save = this._$save;
    $save.href = URL.createObjectURL(obj);
    $save.download = filename;
    $save.click();
  }

  exportScene() {
    const save = this._save;
    this._exporter.parse(
      scene,
      function (data) {
        save(new Blob([data], { type: 'application/octet-stream' }), 'scene.glb');
      },
      {
        binary: true,
      }
    );
  }

  loadObj(path, cb, meta) {
    const scene = this.scene;
    const registry = this._registry;
    const context = this;
    const objLoader = this._objLoader;

    return new Promise((res, rej) => {
      objLoader.load(
        path,
        function (object) {
          object.traverse(function (child) {
            if (child instanceof Mesh) {
              const sm = new SceneMesh(child, meta);
              cb(sm, context);
              registry.set(child.id, sm);
              scene.add(child);
            }
          });
          res();
        },
        function (xhr) {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        function (error) {
          rej(`failed to load ${path}:`, error);
        }
      );
    });
  }

  loadGltf(path, cb) {
    const scene = this.scene;
    const registry = this._registry;
    const context = this;
    const gltfLoader = this._gltfLoader;
    const mixers = this._mixers;

    return new Promise((res, rej) => {
      gltfLoader.load(
        path,
        function (gltf) {
          gltf.scene.traverse((child) => {
            if (child instanceof Mesh) {
              const sm = new SceneMesh(child, {
                name: child.name,
              });
              cb(sm, context);
              registry.set(child.id, sm);
            }
          });
          if (gltf.animations.length > 0) {
            const mixer = new AnimationMixer(gltf.scene);
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play();
            });
            mixers.push(mixer);
          }
          scene.add(...gltf.scene.children);
          res();
        },
        function (xhr) {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        function (error) {
          rej(`failed to load ${path}:`, error);
        }
      );
    });
  }

  addMesh(mesh, cb, meta) {
    const sm = new SceneMesh(mesh, meta);
    cb(sm);
    this._registry.set(mesh.id, sm);
    this.scene.add(mesh);
  }

  onMouseMove(fn) {
    this._mouseMoveCallbacks.push(fn);
  }

  setSelectedMaterial(material) {
    this._selectedMaterial = material;
  }

  run() {
    const renderer = this.renderer;
    const camera = this.camera;
    const scene = this.scene;
    const stats = new Stats();
    const clock = new Clock();
    const mixers = this._mixers;
    const controls = this._getOrbitControl(camera, renderer);
    const { rotationSpeed } = this._state;

    document.body.appendChild(stats.dom);

    const cameraRotateAxis = new Vector3(1, 1, 1);
    cameraRotateAxis.normalize();

    camera.updateProjectionMatrix();
    const animate = () => {
      stats.begin();
      this._pickObject();

      camera.position.applyAxisAngle(cameraRotateAxis, rotationSpeed);
      controls.update();

      const delta = clock.getDelta();
      mixers.forEach((mixer) => {
        mixer.update(delta);
      });
      renderer.render(scene, camera);
      stats.end();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

export default Core;

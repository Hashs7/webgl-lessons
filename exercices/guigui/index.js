import * as THREE from 'three/src/Three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const SCENE_COLOR = 0x111111;

let scene, camera, renderer, controls;
let plane, cubeFarLeft, cubeFarRight;

const createGeometry = () => {
    let geometry = new THREE.PlaneGeometry(50, 50);
    let material = new THREE.MeshBasicMaterial({
        color: 0x693421,
        side: THREE.DoubleSide,
    });
    plane = new THREE.Mesh(geometry, material);
    plane.rotateX(Math.PI / 2);

    geometry = new THREE.BoxGeometry(1, 1,1);
    material = new THREE.MeshBasicMaterial({
        color: 0xaa0000,
    });
    cubeFarLeft = new THREE.Mesh(geometry, material);
    cubeFarLeft.position.set(20, 1, -15);

    scene.add(plane);
    scene.add(cubeFarLeft);
};

const init = () => {
    console.clear();

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_COLOR);

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        1000,
    );
    camera.position.z = 30;
    camera.position.y = 10;

    createGeometry();

    // SOUND
    const listener = new THREE.AudioListener();
    camera.add(listener);

    let sound = new THREE.PositionalAudio(listener);

    let audioLoader = new THREE.AudioLoader();
    audioLoader.load( '../bell.mp3', ( buffer ) => {
        sound.setBuffer( buffer );
        sound.setRefDistance( 20 );
        sound.play();
    });

    cubeFarLeft.add(sound);


    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    document.body.appendChild(renderer.domElement);
};

const mainLoop = () => {
    controls.update();

    renderer.render(scene, camera);
    requestAnimationFrame(mainLoop);
};

init();
mainLoop();

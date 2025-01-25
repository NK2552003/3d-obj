import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, pointLight;
let mouseX = 0; // Store mouseX globally
let lastMouseMoveTime = 0; // Track last mouse move time


const englishCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()+=:;?/|"; 
const usedPositions = [];
const maxAttempts = 300;

// Array of 50 specific colors
const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#F1C40F", "#E67E22",
    "#E74C3C", "#8E44AD", "#3498DB", "#2ECC71", "#1ABC9C",
    "#9B59B6", "#34495E", "#16A085", "#27AE60", "#2980B9",
    "#8E44AD", "#F39C12", "#D35400", "#C0392B", "#7F8C8D",
    "#2C3E50", "#95A5A6", "#F1C40F", "#E67E22", "#D35400",
    "#C0392B", "#8E44AD", "#2980B9", "#27AE60", "#16A085",
    "#FF5733", "#33FF57", "#3357FF", "#F1C40F", "#E67E22",
    "#E74C3C", "#8E44AD", "#3498DB", "#2ECC71", "#1ABC9C",
    "#9B59B6", "#34495E", "#16A085", "#27AE60", "#2980B9",
    "#8E44AD", "#F39C12", "#D35400", "#C0392B", "#7F8C8D",
    "#2C3E50", "#95A5A6", "#F1C40F", "#E67E22", "#D35400"
];

function generateRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkOverlap(x, y, size) {
    for (let pos of usedPositions) {
        let distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        if (distance < (pos.size + size) / 2) {
            return true; // Overlaps
        }
    }
    return false; // No overlap
}

function createRandomCharacter(selectedFont) {
    const char = document.createElement("div");
    char.className = "char";

    let characters;


if (selectedFont === "Distrela") {
        characters = englishCharacters;
    }

    char.innerText = characters[generateRandom(0, characters.length - 1)];

    const size = generateRandom(20, 100);
    char.style.fontSize = `${size}px`;
    char.style.fontFamily = selectedFont;

    // Select a random color from the colors array
    const randomColor = colors[generateRandom(0, colors.length - 1)];
    const randomOpacity = Math.random() * 0.5 + 0.2; 
    char.style.color = randomColor;
    char.style.opacity = randomOpacity;

    let x, y, attempts = 0;
    do {
        x = generateRandom(0, window.innerWidth - size);
        y = generateRandom(0, window.innerHeight - size);
        attempts++;
    } while (checkOverlap(x, y, size) && attempts < maxAttempts);

    if (attempts < maxAttempts) {
        usedPositions.push({ x, y, size });

        char.style.left = `${x}px`;
        char.style.top = `${y}px`;
        char.style.transform = `rotate(${generateRandom(0, 360)}deg)`;

        document.body.appendChild(char);
    } else {
        console.log("Skipped character due to overcrowding");
    }
}

function generateCharacters() {
    const selectedFont = "Distrela"; // Set a default font

    document.querySelectorAll(".char").forEach(function (char) {
        char.remove();
    });
    usedPositions.length = 0;

    const charCount = 100; // Set a default character count

    for (let i = 0; i < charCount; i++) {
        createRandomCharacter(selectedFont);
    }
}

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Append the renderer to the section with class name .section1
    const section = document.querySelector('.section1');
    if (section) {
        section.appendChild(renderer.domElement);
    } else {
        console.error('Section with class .section1 not found');
    }

    // Camera position
    camera.position.z = 5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; // Disable zoom
    controls.enablePan = false; // Disable up and down movement

    // Load 3D Model
    const loader = new GLTFLoader();
    loader.load(
        'base_basic_shaded.glb',
        function (gltf) {
            model = gltf.scene;
            scene.add(model);

            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            // Manually set the position and rotation of the model
            model.position.set(0, -2.5, 0); // Set x, y, z coordinates
            model.rotation.set(0, -Math.PI / 7, 0);

            // Scale the model to fit the scene
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4 / maxDim;
            model.scale.multiplyScalar(scale);

            // Generate random characters
            generateCharacters();
        },
        undefined,
        function (error) {
            console.error('An error occurred loading the model:', error);
        }
    );

    // Event listener for mouse movement
    document.addEventListener('mousemove', onMouseMove);

    // Window resize handler
    window.addEventListener('resize', onWindowResize);
}
function onMouseMove(event) {
    // Throttle the mouse move event
    const now = Date.now();
    if (now - lastMouseMoveTime < 16) return; // Throttle to ~60 FPS
    lastMouseMoveTime = now;

    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;

    // Update point light position
    pointLight.position.set(mouseX * 5, 2, 2); // Keep the light at a fixed height

    // Add subtle horizontal rotation to the model
    if (model) {
        const rotationSpeed = 0.05; // Adjust this value for more or less rotation
        model.rotation.y += (mouseX * rotationSpeed);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
animate();
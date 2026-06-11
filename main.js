import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// 1. GESTION AUDIO
// ==========================================
const bgMusic = new Audio('assets/music.mp3');
bgMusic.loop = true; bgMusic.volume = 0.4;
const sfxCoin = new Audio('assets/coin.mp3'); sfxCoin.volume = 0.8;
const sfxBoom = new Audio('assets/boom.mp3'); sfxBoom.volume = 0.9;

function playSound(audioElement, pitch = 1.0) {
    audioElement.currentTime = 0;
    audioElement.playbackRate = pitch;
    audioElement.play().catch(e => console.log("Audio bloqué", e));
}

// ==========================================
// 2. RÉCUPÉRATION DU DOM
// ==========================================
const startScreen = document.getElementById('start-screen');
const rulesModal = document.getElementById('rules-modal');
const uiContainer = document.getElementById('ui-container');
const scoreDisplay = document.getElementById('score-display');
const coinCountDisplay = document.getElementById('coin-count');
const boostBar = document.getElementById('boost-bar');
const diveTimerDisplay = document.getElementById('dive-timer');
const comboText = document.getElementById('combo-text');
const comboBarFill = document.getElementById('combo-bar-fill');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const speedLines = document.getElementById('speed-lines');
const floatingTextsContainer = document.getElementById('floating-texts-container');
const highScoreDisplay = document.getElementById('high-score-display');
const countdownContainer = document.getElementById('countdown-container');
const countdownText = document.getElementById('countdown-text');

// ==========================================
// 3. INITIALISATION DE THREE.JS ET CAMÉRA
// ==========================================
const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6CB4EE');
scene.fog = new THREE.Fog('#6CB4EE', 40, 160);

// CAMÉRA RAPPROCHÉE ET IMMERSIVE
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8); 

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ==========================================
// 4. ÉCLAIRAGE VIBRANT ET BEAUX EFFETS
// ==========================================
// Lumière ambiante douce
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// Soleil directionnel chaud
const dirLight = new THREE.DirectionalLight(0xffddaa, 1.3);
dirLight.position.set(5, 15, -20);
scene.add(dirLight);

// Lumière hémisphérique pour enrichir les ombres
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x99aa99, 0.6);
scene.add(hemiLight);

const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFD700, fog: false }));
sun.position.set(0, 40, -150);
scene.add(sun);

// ==========================================
// 5. MATÉRIAUX ET GÉOMÉTRIES DE BASE
// ==========================================
const sandMat = new THREE.MeshStandardMaterial({ color: 0xE6C280, roughness: 1 });
const rockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
const mountainMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 1 });
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
const bonusMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xaa8800, roughness: 0.2, metalness: 1 });
const mineMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
const pearlMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088ff, roughness: 0.1, metalness: 0.8 });

const baseEdgeGeo = new THREE.BoxGeometry(1, 1, 1);
const baseMountainGeo = new THREE.ConeGeometry(1, 1, 5);
const basePuffGeo = new THREE.DodecahedronGeometry(1);
const bonusGeo = new THREE.OctahedronGeometry(0.4);
const mineGeo = new THREE.IcosahedronGeometry(0.5, 0);
const pearlGeo = new THREE.SphereGeometry(0.3, 16, 16);

// L'Eau et le Fond
const waterTexture = new THREE.TextureLoader().load('assets/Textures/waternormals.jpg');
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
waterTexture.repeat.set(2, 10);

const desert = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), sandMat);
desert.rotation.x = -Math.PI / 2;
desert.position.y = -1.2;
scene.add(desert);

const riverbed = new THREE.Mesh(new THREE.PlaneGeometry(16, 200), new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 1 }));
riverbed.rotation.x = -Math.PI / 2;
riverbed.position.y = -1.1;
scene.add(riverbed);

const water = new THREE.Mesh(new THREE.PlaneGeometry(16, 200), new THREE.MeshStandardMaterial({ color: 0x00bfff, transparent: true, opacity: 0.8, normalMap: waterTexture, side: THREE.DoubleSide }));
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Texture de l'écume
function createSmoothParticle() {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d'); const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(canvas);
}
const smoothWakeTexture = createSmoothParticle();
const baseWakeGeo = new THREE.PlaneGeometry(1.5, 1.5);
const baseWakeMat = new THREE.MeshBasicMaterial({ map: smoothWakeTexture, color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });

// ==========================================
// 6. VARIABLES DU JEU ET HIGH SCORE
// ==========================================
const START_SPEED = 0.2;
const ABSOLUTE_MAX_SPEED = 0.45;
let currentBaseSpeed = START_SPEED;
let currentSpeed = currentBaseSpeed;

let gameStarted = false, isPaused = false, isGameOver = false, isCountingDown = false;
let score = 0, coinsCollected = 0, reviveCost = 2, lastMilestone = 0;
let comboMultiplier = 1, comboTimer = 0;
let boostEnergy = 100, boostState = 'READY'; 
let targetX = 0, jumpVelocity = 0, jumpOffset = 0, currentLerpY = 0.5, cameraShake = 0;
let isDiving = false, canDive = true, diveTimeLeft = 5.0, diveCooldown = 0.0;

let obsTimer=0, decTimer=0, scenTimer=0, bonTimer=0, wakeTimer=0, mineTimer=0, pearlTimer=0;

let savedHighScore = localStorage.getItem('boatRunHighScore') || 0;
highScoreDisplay.innerText = Math.floor(savedHighScore);

const boatBox = new THREE.Box3();
const itemBox = new THREE.Box3();

// ==========================================
// 7. CHARGEMENT DES ASSETS (.GLB)
// ==========================================
const boat = new THREE.Group();
scene.add(boat);
const loader = new GLTFLoader();
const colormap = new THREE.TextureLoader().load('assets/Textures/colormap.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace; // Pour des couleurs riches !
});
colormap.flipY = false;
const boatMat = new THREE.MeshStandardMaterial({ map: colormap, roughness: 0.8, metalness: 0.2 });

loader.load('assets/bateau.glb', (gltf) => {
    gltf.scene.scale.set(0.15, 0.15, 0.15); gltf.scene.rotation.y = Math.PI;
    gltf.scene.traverse(c => { if (c.isMesh) c.material = boatMat; }); boat.add(gltf.scene);
});

let obstacleTemplate = null;
loader.load('assets/obstacle.glb', (gltf) => {
    obstacleTemplate = gltf.scene; obstacleTemplate.scale.set(0.5, 0.5, 0.5);
    obstacleTemplate.traverse(c => { if (c.isMesh) c.material = boatMat; });
});

const decorTemplates = [];
loader.load('assets/decor1.glb', (gltf) => {
    const model = gltf.scene; model.scale.set(1.5, 1.5, 1.5);
    model.traverse((child) => { if (child.isMesh) child.material = boatMat; }); decorTemplates.push(model);
});
loader.load('assets/decor2.glb', (gltf) => {
    const model = gltf.scene; model.scale.set(1.5, 1.5, 1.5);
    model.traverse((child) => { if (child.isMesh) child.material = boatMat; }); decorTemplates.push(model);
});

// ==========================================
// 8. FONCTIONS DE GAME FEEL ET DÉCOMPTE
// ==========================================
function triggerScreenShake(intensity) { cameraShake = intensity; }

function spawnFloatingText(text, color) {
    const el = document.createElement('div'); el.className = 'floating-score'; el.innerText = text; el.style.color = color;
    el.style.transform = `translate(calc(-50% + ${(Math.random() - 0.5) * 100}px), -50%)`;
    floatingTextsContainer.appendChild(el); setTimeout(() => el.remove(), 800);
}

function updateComboUI() {
    if (comboMultiplier <= 1) {
        comboText.style.display = 'none'; document.getElementById('combo-bar-bg').style.display = 'none'; comboText.classList.remove('shake-hard'); return;
    }
    comboText.style.display = 'block'; document.getElementById('combo-bar-bg').style.display = 'block'; comboText.innerText = `x${comboMultiplier}`;
    let color = "#FFFFFF"; comboText.classList.remove('shake-hard');
    if (comboMultiplier === 2) color = "#00FF00"; else if (comboMultiplier === 3) color = "#00BFFF"; else if (comboMultiplier === 4) color = "#FF00FF"; else if (comboMultiplier >= 5) { color = "#FF4500"; comboText.classList.add('shake-hard'); }
    comboText.style.color = color; comboBarFill.style.backgroundColor = color;
    comboText.style.transform = "scale(1.5)"; setTimeout(() => { comboText.style.transform = "scale(1)"; }, 100);
}

let countInterval;
function startCountdown() {
    if (countInterval) clearInterval(countInterval);
    isCountingDown = true; gameStarted = true;
    countdownContainer.style.display = 'flex'; countdownText.className = '';
    
    let count = 3; countdownText.innerText = count; countdownText.style.animation = 'none'; void countdownText.offsetWidth; countdownText.style.animation = 'neonPulse 1s ease-in-out infinite';

    countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count; countdownText.style.animation = 'none'; void countdownText.offsetWidth; countdownText.style.animation = 'neonPulse 1s ease-in-out infinite';
        } else if (count === 0) {
            countdownText.innerText = "GO !"; countdownText.className = 'neon-go'; countdownText.style.animation = 'none'; void countdownText.offsetWidth; countdownText.style.animation = 'explodeGo 1.5s forwards';
        } else {
            clearInterval(countInterval); countdownContainer.style.display = 'none'; isCountingDown = false;
        }
    }, 1000);
}

// ==========================================
// 9. GÉNÉRATION DES DÉCORS ET PIÈGES
// ==========================================
const obstacles=[], scenery=[], bonuses=[], decorations=[], wakes=[], pearls=[], bubbles=[], underwaterEffects=[];

function spawnObstacle() { if (!obstacleTemplate) return; const o = obstacleTemplate.clone(); o.position.set((Math.random() - 0.5) * 8, 0, -120); scene.add(o); obstacles.push(o); }
function spawnMine() { const m = new THREE.Mesh(mineGeo, mineMat); m.position.set((Math.random() - 0.5) * 8, -0.8, -120); scene.add(m); obstacles.push(m); }
function spawnBonus() { const b = new THREE.Mesh(bonusGeo, bonusMat); b.position.set((Math.random() - 0.5) * 8, 0.4, -120); scene.add(b); bonuses.push(b); }
function spawnPearl() { const p = new THREE.Mesh(pearlGeo, pearlMat); p.position.set((Math.random() - 0.5) * 8, -0.8, -120); scene.add(p); pearls.push(p); }

function spawnDecoration(startZ = -120) {
    if (decorTemplates.length === 0) return; const template = decorTemplates[Math.floor(Math.random() * decorTemplates.length)]; const decor = template.clone();
    const isLeftBank = Math.random() > 0.5; const randomX = isLeftBank ? -(8.5 + Math.random() * 4) : (8.5 + Math.random() * 4);
    decor.position.set(randomX, 0.2, startZ); decor.rotation.y = Math.random() * Math.PI * 2; scene.add(decor); decorations.push(decor);
}

function spawnScenery(startZ = -120) {
    const isRock = Math.random() > 0.7; const edge = new THREE.Mesh(baseEdgeGeo, isRock ? rockMat : sandMat);
    edge.scale.set(4 + Math.random() * 5, 8, 6 + Math.random() * 8); edge.userData.isBank = true; const sideMultiplier = Math.random() > 0.5 ? -1 : 1;
    edge.position.set((8.5 * sideMultiplier) + (Math.random() * 2 * sideMultiplier), -3, startZ); edge.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    scene.add(edge); scenery.push(edge);

    if (Math.random() > 0.5) { const mountain = new THREE.Mesh(baseMountainGeo, mountainMat); mountain.scale.set(8 + Math.random() * 12, 15 + Math.random() * 25, 8 + Math.random() * 12); mountain.position.set((25 + Math.random() * 10) * sideMultiplier, -2, startZ - 10); mountain.rotation.y = Math.random() * Math.PI; scene.add(mountain); scenery.push(mountain); }
}

function spawnWake() {
    if (isDiving || jumpOffset > 0) return;
    const wake = new THREE.Mesh(baseWakeGeo, baseWakeMat.clone());
    wake.rotation.x = -Math.PI / 2; wake.position.set(boat.position.x + (Math.random() - 0.5) * 0.4, 0.02, boat.position.z + 1.2);
    scene.add(wake); wakes.push(wake);
}

const bubbleGeo = new THREE.SphereGeometry(0.15, 8, 8);
const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 0.8, transparent: true, roughness: 0.1 });
function spawnSplashBubble(isTakeoff) {
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat); const offsetX = (Math.random() - 0.5) * 2; const offsetZ = (Math.random() - 0.5) * 2; const offsetY = isTakeoff ? 0 : jumpOffset;
    bubble.position.set(boat.position.x + offsetX, offsetY, boat.position.z + offsetZ); bubble.userData = { vx: (Math.random() - 0.5) * 0.1, vy: Math.random() * 0.1 + 0.05, vz: (Math.random() - 0.5) * 0.1 }; scene.add(bubble); bubbles.push(bubble);
}

function spawnUnderwaterEffect() {
    if (!isDiving) return;
    if (Math.random() > 0.4) {
        const line = new THREE.Mesh(speedLineGeo, speedLineMat); line.rotation.x = Math.PI / 2; line.position.set((Math.random() - 0.5) * 20, -0.5 + (Math.random() - 0.5) * 2, -30 - Math.random() * 20); line.userData.isLine = true; scene.add(line); underwaterEffects.push(line);
    } else {
        const bub = new THREE.Mesh(bubbleGeo, bubbleMat); bub.position.set((Math.random() - 0.5) * 20, -1.5 + Math.random(), -30 - Math.random() * 20); bub.userData.isLine = false; scene.add(bub); underwaterEffects.push(bub);
    }
}

// ==========================================
// 10. GESTION DES CONTRÔLES ET ÉVÈNEMENTS
// ==========================================
const handleMove = (dir) => { targetX += dir * 1.5; targetX = Math.max(-4, Math.min(4, targetX)); };
const handleJump = () => { if (jumpOffset === 0 && !isDiving && boostEnergy >= 15) { jumpVelocity = 0.15; boostEnergy -= 15; for (let i = 0; i < 15; i++) spawnSplashBubble(true); if (boostEnergy <= 0) boostState = 'COOLDOWN'; } };
const handleDive = (start) => { if (canDive) isDiving = start; };
const handleBoost = () => { if (boostState === 'READY') boostState = 'ACTIVE'; };

window.addEventListener('keydown', (e) => {
    if (!gameStarted || isPaused || isGameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') handleMove(-1);
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleMove(1);
    if (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') handleJump();
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleDive(true);
    if (e.code === 'Space') handleBoost();
});
window.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleDive(false); });

document.getElementById('btn-play').onclick = () => { startScreen.style.display = 'none'; uiContainer.style.display = 'block'; bgMusic.play().catch(e => console.log(e)); clock.getDelta(); startCountdown(); };
document.getElementById('btn-rules').onclick = () => rulesModal.classList.remove('modal-hidden');
document.getElementById('btn-close-rules').onclick = () => rulesModal.classList.add('modal-hidden');
document.getElementById('pause-btn').onclick = () => { if (isGameOver || isCountingDown) return; isPaused = !isPaused; document.getElementById('pause-btn').innerText = isPaused ? "▶" : "⏸"; if (isPaused) { bgMusic.pause(); } else { clock.getDelta(); bgMusic.play(); } };
document.getElementById('btn-replay').onclick = () => { gameOverScreen.style.display = 'none'; resetGame(); isGameOver = false; bgMusic.play(); clock.getDelta(); startCountdown(); };
document.getElementById('btn-revive').onclick = () => {
    if (coinsCollected >= reviveCost) {
        coinsCollected -= reviveCost; coinCountDisplay.innerText = coinsCollected; reviveCost *= 2; gameOverScreen.style.display = 'none';
        for (let i = obstacles.length - 1; i >= 0; i--) { if (obstacles[i].position.z > -30 && obstacles[i].position.z < 10) { scene.remove(obstacles[i]); obstacles.splice(i, 1); } }
        boostEnergy = Math.max(30, boostEnergy); isGameOver = false; bgMusic.play(); clock.getDelta();
    }
};
document.getElementById('btn-home').onclick = () => location.reload();

document.getElementById('mobile-ctrl-left').ontouchstart = (e) => { e.preventDefault(); handleMove(-1); };
document.getElementById('mobile-ctrl-right').ontouchstart = (e) => { e.preventDefault(); handleMove(1); };
document.getElementById('btn-mobile-jump').ontouchstart = (e) => { e.preventDefault(); handleJump(); };
document.getElementById('btn-mobile-dive').ontouchstart = (e) => { e.preventDefault(); handleDive(true); };
document.getElementById('btn-mobile-dive').ontouchend = (e) => { e.preventDefault(); handleDive(false); };
document.getElementById('btn-mobile-boost').ontouchstart = (e) => { e.preventDefault(); handleBoost(); };

// ==========================================
// 11. GESTION DE LA PARTIE ET ANIMATION
// ==========================================
function resetGame() {
    const allArrays = [obstacles, decorations, bonuses, pearls, wakes, scenery, bubbles, underwaterEffects];
    allArrays.forEach(arr => { arr.forEach(obj => { scene.remove(obj); if (obj.material && obj.material.dispose && arr === wakes) { obj.material.dispose(); } }); arr.length = 0; });
    
    floatingTextsContainer.innerHTML = ''; targetX = 0; boat.position.x = 0; isDiving = false; currentBaseSpeed = START_SPEED;
    obsTimer = 0; decTimer = 0; scenTimer = 0; bonTimer = 0; wakeTimer = 0; mineTimer = 0; pearlTimer = 0;
    
    score = 0; lastMilestone = 0; coinsCollected = 0; coinCountDisplay.innerText = "0"; reviveCost = 2; comboMultiplier = 1; comboTimer = 0; updateComboUI();
    scoreDisplay.innerText = "0"; scoreDisplay.style.color = "white"; boostEnergy = 100; boostState = 'READY'; canDive = true; diveTimeLeft = 5.0; diveCooldown = 0.0;
    
    for (let i = 0; i < 8; i++) { const zPos = -15 - (i * 15); spawnScenery(zPos); spawnDecoration(zPos); }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    const time = performance.now() * 0.002;
    const bobbing = Math.sin(time) * 0.08;
    const rocking = Math.cos(time * 0.8) * 0.05;
    const pitching = Math.sin(time * 1.2) * 0.03;

    if (!gameStarted) {
        waterTexture.offset.y -= 0.005; boat.position.y = 0.5 + bobbing; boat.rotation.z = rocking; boat.rotation.x = pitching; renderer.render(scene, camera); return;
    }
    if (isPaused || isGameOver) { renderer.render(scene, camera); return; }

    // Score et Combo
    score += currentSpeed * 2; scoreDisplay.innerText = Math.floor(score);
    currentBaseSpeed = Math.min(0.2 + (score * 0.00001), 0.45);
    
    if (comboMultiplier > 1) { comboTimer -= delta * 35; comboBarFill.style.width = Math.max(0, comboTimer) + '%'; if (comboTimer <= 0) { comboMultiplier = 1; updateComboUI(); } }

    // Boost
    if (boostState === 'ACTIVE') { currentSpeed = THREE.MathUtils.lerp(currentSpeed, currentBaseSpeed * 1.6, 0.05); boostEnergy -= 0.2; speedLines.style.opacity = 1; camera.fov = 85; if (boostEnergy <= 0) boostState = 'COOLDOWN'; } 
    else { currentSpeed = THREE.MathUtils.lerp(currentSpeed, currentBaseSpeed, 0.05); speedLines.style.opacity = 0; camera.fov = 75; boostEnergy = Math.min(100, boostEnergy + (boostState === 'COOLDOWN' ? 0.05 : 0.1)); if (boostEnergy >= 100) boostState = 'READY'; }
    boostBar.style.height = boostEnergy + '%';

    // O2 Plongée
    if (isDiving && canDive) { diveTimeLeft -= delta; if (diveTimeLeft <= 0) { isDiving = false; canDive = false; diveCooldown = 15; } } 
    else if (!canDive) { diveCooldown -= delta; if (diveCooldown <= 0) { canDive = true; } } 
    else { diveTimeLeft = 5; }
    diveTimerDisplay.innerText = canDive ? diveTimeLeft.toFixed(1) + 's' : Math.ceil(diveCooldown) + 's';

    // Déplacement Bateau
    boat.position.x = THREE.MathUtils.lerp(boat.position.x, targetX, 0.1);
    let jumpPitch = 0;
    if (jumpVelocity !== 0 || jumpOffset > 0) { jumpOffset += jumpVelocity; jumpVelocity -= 0.005; jumpPitch = -jumpVelocity * 3.5; if (jumpOffset <= 0) { jumpOffset = 0; jumpVelocity = 0; jumpPitch = 0; for (let i = 0; i < 15; i++) spawnSplashBubble(true); } }
    
    let targetYBase = isDiving ? -0.8 : 0.5;
    currentLerpY = THREE.MathUtils.lerp(currentLerpY, targetYBase + bobbing, 0.1);
    boat.position.y = currentLerpY + jumpOffset;
    
    const diffX = targetX - boat.position.x;
    const targetYaw = Math.max(-0.6, Math.min(0.6, diffX * -0.25));
    const targetRoll = Math.max(-0.4, Math.min(0.4, diffX * -0.15));
    
    boat.rotation.y = THREE.MathUtils.lerp(boat.rotation.y, 0 + targetYaw, 0.15);
    boat.rotation.z = THREE.MathUtils.lerp(boat.rotation.z, rocking + targetRoll, 0.15);
    boat.rotation.x = THREE.MathUtils.lerp(boat.rotation.x, pitching + jumpPitch, 0.15);

    waterTexture.offset.y -= currentSpeed * 0.02;

    // Déplacement Objets & Collisions
    const arraysToMove = [obstacles, bonuses, pearls, scenery, decorations, wakes];
    arraysToMove.forEach(arr => {
        for (let i = arr.length - 1; i >= 0; i--) {
            const item = arr[i];
            item.position.z += currentSpeed * 60 * delta;
            
            if (arr === wakes) { item.scale.x += 0.03; item.scale.y += 0.03; item.material.opacity -= 0.01; if (item.material.opacity <= 0) item.position.z = 20; }
            
            if (item.position.z > 15) { scene.remove(item); if (item.material && item.material.dispose && arr === wakes) item.material.dispose(); arr.splice(i, 1); continue; }
            
            boatBox.setFromObject(boat); if (isDiving) boatBox.max.y = -0.1;
            itemBox.setFromObject(item);
            if (arr === scenery && item.userData.isBank) { itemBox.expandByScalar(-1); } else { itemBox.expandByScalar(-0.1); }
            
            if (boatBox.intersectsBox(itemBox)) {
                if (arr === obstacles) {
                    const isMine = item.position.y < -0.2;
                    if (isDiving && !isMine) continue; 
                    if (!isDiving && isMine) continue;
                    
                    isGameOver = true; bgMusic.pause(); playSound(sfxBoom); triggerScreenShake(0.6);
                    gameOverScreen.style.display = 'flex'; finalScoreDisplay.innerText = "Score: " + Math.floor(score);
                    if (score > savedHighScore) { savedHighScore = score; localStorage.setItem('boatRunHighScore', savedHighScore); }
                    document.getElementById('revive-cost-text').innerText = reviveCost; document.getElementById('btn-revive').style.display = coinsCollected >= reviveCost ? 'flex' : 'none';
                } else if (arr === bonuses) {
                    if (isDiving) continue; 
                    comboMultiplier = Math.min(5, comboMultiplier + 1); comboTimer = 100; updateComboUI();
                    const pts = 100 * comboMultiplier; score += pts; coinsCollected++; coinCountDisplay.innerText = coinsCollected;
                    playSound(sfxCoin, 1 + (comboMultiplier * 0.15)); spawnFloatingText(`+${pts}`, comboText.style.color || "#FFF");
                    boostEnergy = Math.min(100, boostEnergy + 20); if (boostEnergy === 100 && boostState === 'COOLDOWN') boostState = 'READY';
                    scene.remove(item); arr.splice(i, 1);
                } else if (arr === pearls) {
                    if (!isDiving) continue; 
                    diveTimeLeft = Math.min(5.0, diveTimeLeft + 1.5); diveTimerDisplay.innerText = diveTimeLeft.toFixed(1) + 's';
                    document.getElementById('dive-container').style.borderColor = "#00FF00"; setTimeout(() => { document.getElementById('dive-container').style.borderColor = "aqua"; }, 300);
                    const pts = 200 * comboMultiplier; score += pts; playSound(sfxCoin, 2.0); spawnFloatingText(`+1.5s O₂`, "#00FFFF");
                    scene.remove(item); arr.splice(i, 1);
                } else if (arr === scenery && item.userData.isBank) {
                    targetX = boat.position.x + (boat.position.x < 0 ? 1.5 : -1.5); targetX = Math.max(-4, Math.min(4, targetX)); currentSpeed = START_SPEED * 0.4; jumpVelocity = 0.08; triggerScreenShake(0.2);
                }
            }
        }
    });

    // Particules
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.position.x += b.userData.vx; b.position.y += b.userData.vy; b.position.z += b.userData.vz + currentSpeed; b.scale.setScalar(b.scale.x * 0.92); if (b.scale.x < 0.1 || b.position.y > 5) { scene.remove(b); bubbles.splice(i, 1); } }
    if (cameraShake > 0) { camera.position.x = THREE.MathUtils.lerp(camera.position.x, (Math.random() - 0.5) * cameraShake, 0.5); camera.position.y += (Math.random() - 0.5) * cameraShake; cameraShake -= 0.02; if (cameraShake < 0) cameraShake = 0; }
    
    // CAMÉRA RAPPROCHÉE (Suit le plongeon)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, isDiving ? 1.5 : 4, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, isDiving ? 6 : 8, 0.08);
    // On force la caméra à regarder devant elle, pour ne pas révéler les bords
    camera.lookAt(0, 1, -5); 
    
    camera.updateProjectionMatrix();

    if (isDiving) { scene.background.setHex(0x005577); scene.fog.color.setHex(0x005577); scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 5, 0.1); scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 60, 0.1); if (Math.random() > 0.8) spawnUnderwaterEffect(); } 
    else { scene.background.setHex(0x6CB4EE); scene.fog.color.setHex(0x6CB4EE); scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 40, 0.1); scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 160, 0.1); }

    for (let i = underwaterEffects.length - 1; i >= 0; i--) { const ef = underwaterEffects[i]; ef.position.z += currentSpeed * (ef.userData.isLine ? 4 : 1.2); if (!ef.userData.isLine) ef.position.y += 0.05; if (ef.position.z > camera.position.z + 5) { scene.remove(ef); underwaterEffects.splice(i, 1); } }

    // Spawners
    let spawnRateModifier = boostState === 'ACTIVE' ? 2 : 1;
    scenTimer += spawnRateModifier; decTimer += spawnRateModifier; wakeTimer += 1;
    
    if (scenTimer >= 10) { spawnScenery(); scenTimer = 0; }
    if (decTimer >= 20) { spawnDecoration(); decTimer = 0; }
    if (wakeTimer >= 5) { spawnWake(); wakeTimer = 0; }

    if (!isCountingDown) {
        obsTimer += spawnRateModifier; mineTimer += spawnRateModifier; bonTimer += spawnRateModifier; pearlTimer += spawnRateModifier;
        let currentObsInterval = Math.max(25, 60 - Math.floor(score / 500));
        
        if (obsTimer >= currentObsInterval) { spawnObstacle(); obsTimer = 0; }
        if (mineTimer >= currentObsInterval * 3) { spawnMine(); mineTimer = 0; }
        if (bonTimer >= 300) { spawnBonus(); bonTimer = 0; }
        if (pearlTimer >= 400) { spawnPearl(); pearlTimer = 0; }
    }

    renderer.render(scene, camera);
}

for (let i = 0; i < 8; i++) { const zPos = -15 - (i * 15); spawnScenery(zPos); spawnDecoration(zPos); }
animate();

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
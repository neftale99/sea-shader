import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import waterVertexShader from './Shaders/Water/vertex.glsl'
import waterFragmentShader from './Shaders/Water/fragment.glsl'
import overlayVertexShader from './Shaders/Overlay/vertex.glsl'
import overlayFragmentShader from './Shaders/Overlay/fragment.glsl'


/**
 * Loaders
 */
// Loading
const loaderElement = document.querySelector('.loading')
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        gsap.delayedCall(1, () => {

            loaderElement.style.display = 'none'

            gsap.to(
                overlayMaterial.uniforms.uAlpha, 
                { duration: 1.5, value: 0, delay: 0.5 }
            )

            window.setTimeout(() => {
                initGUI()
            }, 2000)
        })
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => 
    {
        loaderElement.style.display = 'block'
    }
)

// Texture
const textureLoader = new THREE.TextureLoader(loadingManager)

// Draco
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('draco/')

// GLTF
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)


/**
 * Base
 */
// Debug
const debugObject = {}
// gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Axes helper
// const axesHelper = new THREE.AxesHelper()
// axesHelper.position.y += 0.25
// scene.add(axesHelper)

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    uniforms: {
        uAlpha: new THREE.Uniform(1)
    },
    transparent: true,
    depthWrite: false,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(4, 4, 812, 812)
waterGeometry.deleteAttribute('normal')

// Colors
debugObject.depthColor = '#940000'
debugObject.surfaceColor = '#113c92'

// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },
        uBigWavesElevation: { value: 0.2 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uBigWavesSpeed: { value: 0.75 },
        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0.554 },
        uColorMultiplier: { value: 2.395 },
        uSmallWavesElevation: { value: 0.15 },
        uSmallWavesFrequency: { value: 2 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallIterations: { value: 4 },
        uShipPosition: { value: new THREE.Vector3(0, 0, 0) },
        uShipRadius: { value: 5.0 } 
    }
})

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = - Math.PI * 0.5
scene.add(water)

/**
 * Model
 */
// Material
const bakedTexture = textureLoader.load('/Model/ship.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Ship
let ship

gltfLoader.load(
    'Model/ship.glb',
    (gltf) =>
    {
        ship = gltf.scene
        ship.scale.set(0.1, 0.1, 0.1)
        scene.add(ship)

        const baked = gltf.scene.children.find((child) => child.name === 'Ship')

        baked.material = bakedMaterial
    }
)

// Waves model
function calculateWaveElevation(position, time) 
{
    const bigWavesElevation = waterMaterial.uniforms.uBigWavesElevation.value
    const bigWavesFrequency = waterMaterial.uniforms.uBigWavesFrequency.value
    const bigWavesSpeed = waterMaterial.uniforms.uBigWavesSpeed.value

    // bigWaves
    let elevation = 
        Math.sin(position.x * bigWavesFrequency.x + time * bigWavesSpeed) * 
        Math.sin(position.z * bigWavesFrequency.y + time * bigWavesSpeed) * 
        bigWavesElevation

    return elevation
}

/**
 * Light
 */
// const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.normalBias = 0.05
// directionalLight.position.set(9, 5,  4)
// scene.add(directionalLight)

/**
 * Tweaks
 */
function initGUI()
{
    const gui = new GUI({ width: 300 })

    gui 
    .addColor(debugObject, 'depthColor')
    .name('Depth Color')
    .onChange(() => 
    { 
        waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor) 
    })

    gui 
        .addColor(debugObject, 'surfaceColor')
        .name('Surface Color')
        .onChange(() => 
        { 
            waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor) 
        })

    gui
        .add(waterMaterial.uniforms.uBigWavesElevation, 'value')
        .min(0.16)
        .max(0.3)
        .step(0.001)
        .name('WavesElevation')

    gui
        .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x')
        .min(0)
        .max(10)
        .step(0.001)
        .name('WavesFrequencyX')

    gui
        .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y')
        .min(0)
        .max(2)
        .step(0.001)
        .name('WavesFrequencyY')

    gui
        .add(waterMaterial.uniforms.uBigWavesSpeed, 'value')
        .min(0)
        .max(2)
        .step(0.001)
        .name('WavesSpeed')

    gui 
        .add(waterMaterial.uniforms.uColorOffset, 'value')
        .min(0)
        .max(1)
        .step(0.001)
        .name('ColorOffset')

    gui 
        .add(waterMaterial.uniforms.uColorMultiplier, 'value')
        .min(0)
        .max(15)
        .step(0.001)
        .name('ColorMultiplier')

    gui 
        .add(waterMaterial.uniforms.uSmallWavesElevation, 'value')
        .min(0)
        .max(0.5)
        .step(0.001)
        .name('SmallWavesElevation')

    gui 
        .add(waterMaterial.uniforms.uSmallWavesFrequency, 'value')
        .min(0)
        .max(20)
        .step(0.001)
        .name('SmallWavesFrequency')

    gui 
        .add(waterMaterial.uniforms.uSmallWavesSpeed, 'value')
        .min(0)
        .max(5)
        .step(0.001)
        .name('SmallWavesSpeed')

    gui 
        .add(waterMaterial.uniforms.uSmallIterations, 'value')
        .min(0)
        .max(8)
        .step(1)
        .name('SmallIterations')
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)

controls.minPolarAngle = Math.PI / 6
controls.maxPolarAngle = Math.PI / 2

controls.minAzimuthAngle = - Math.PI 
controls.maxAzimuthAngle = Math.PI

controls.minDistance = 1
controls.maxDistance = 12

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.7
renderer.setClearColor('black')
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const shipOffset = - 0.3
const oscillationAmplitude = 0.2 // Amplitud del movimiento lateral
const oscillationFrequency = 1 // Frecuencia del movimiento lateral

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime;

    // Model
    if (ship) {
        const shipPosition = ship.position
        const elevation = calculateWaveElevation(shipPosition, elapsedTime)
        ship.position.y = elevation + shipOffset
        ship.rotation.z = Math.sin(elapsedTime * oscillationFrequency) * oscillationAmplitude
        waterMaterial.uniforms.uShipPosition.value.set(shipPosition.x, shipPosition.y, shipPosition.z)
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
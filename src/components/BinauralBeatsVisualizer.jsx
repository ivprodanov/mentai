import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// Helper function to create a visually appealing material
const createIcosahedronMaterial = () => {
    return new THREE.MeshLambertMaterial({
        color: 0xffffff,
        wireframe: true,
    });
};

const BinauralBeatPlayer = () => {
    // State management
    const [isPlaying, setIsPlaying] = useState(false);
    const [baseFrequency, setBaseFrequency] = useState(144.72); // Sun, cosmic octave
    const [binauralFrequency, setBinauralFrequency] = useState(7.83); // Schumann Resonance

    // Refs for audio components and visualization
    const audioContextRef = useRef(null);
    const leftChannelRef = useRef(null);
    const rightChannelRef = useRef(null);
    const analyserRef = useRef(null);
    const mountRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const visualizerElementsRef = useRef({});

    // Function to initialize the audio context
    const initializeAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = context;

                // Create the analyser node for visualization
                const analyser = context.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.9;
                analyserRef.current = analyser;

            } catch (e) {
                console.error("Web Audio API is not supported in this browser", e);
                alert("Web Audio API is not supported in this browser");
            }
        }
    }, []);

    // Function to start audio playback
    const play = useCallback(() => {
        initializeAudio();
        const context = audioContextRef.current;
        if (!context) return;

        // Stop any existing audio
        if (leftChannelRef.current) leftChannelRef.current.stop();
        if (rightChannelRef.current) rightChannelRef.current.stop();

        // Create oscillators for left and right channels
        const left = context.createOscillator();
        const right = context.createOscillator();
        const merger = context.createChannelMerger(2);

        left.frequency.setValueAtTime(baseFrequency - binauralFrequency / 2, context.currentTime);
        right.frequency.setValueAtTime(baseFrequency + binauralFrequency / 2, context.currentTime);

        left.type = 'sine';
        right.type = 'sine';

        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0.5, context.currentTime); // Set volume

        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        merger.connect(gainNode);
        gainNode.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);

        left.start();
        right.start();

        leftChannelRef.current = left;
        rightChannelRef.current = right;
        setIsPlaying(true);
    }, [baseFrequency, binauralFrequency, initializeAudio]);

    // Function to stop audio playback
    const stop = useCallback(() => {
        if (leftChannelRef.current) {
            leftChannelRef.current.stop();
            leftChannelRef.current = null;
        }
        if (rightChannelRef.current) {
            rightChannelRef.current.stop();
            rightChannelRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    // Toggle play/stop
    const togglePlay = () => {
        if (isPlaying) {
            stop();
        } else {
            play();
        }
    };
    
    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            stop();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [stop]);

    // Three.js visualizer setup
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xaaaaaa);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 0, 10);
        scene.add(pointLight);

        // Post-processing for bloom effect
        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // Create the icosahedron
        const geometry = new THREE.IcosahedronGeometry(2, 1);
        const material = createIcosahedronMaterial();
        const icosahedron = new THREE.Mesh(geometry, material);
        scene.add(icosahedron);
        
        visualizerElementsRef.current = { scene, camera, renderer, icosahedron, composer };

        // Animation loop
        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);

            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                const lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
                const upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);

                const lowerAvg = lowerHalfArray.reduce((acc, val) => acc + val, 0) / lowerHalfArray.length;
                const upperAvg = upperHalfArray.reduce((acc, val) => acc + val, 0) / upperHalfArray.length;

                const lowerMax = Math.max(...lowerHalfArray);
                const upperMax = Math.max(...upperHalfArray);

                const lowerAvgFr = lowerAvg / lowerHalfArray.length;
                const upperAvgFr = upperAvg / upperHalfArray.length;
                const lowerMaxFr = lowerMax / lowerHalfArray.length;
                const upperMaxFr = upperMax / upperHalfArray.length;
                
                // Deform the icosahedron based on audio data
                const { position } = icosahedron.geometry.attributes;
                const originalPositions = icosahedron.geometry.userData.originalPositions;
                if (!originalPositions) {
                    icosahedron.geometry.userData.originalPositions = position.clone();
                }

                for (let i = 0; i < position.count; i++) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(icosahedron.geometry.userData.originalPositions, i);
                    const offset = icosahedron.geometry.parameters.radius;
                    const amp = 0.5;
                    const time = window.performance.now();
                    vertex.normalize();
                    const rf = 0.00001;
                    const distance = (offset + lowerMaxFr) + noise.noise3D(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * upperAvgFr;
                    vertex.multiplyScalar(distance);
                    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                position.needsUpdate = true;
            }
            
            icosahedron.rotation.x += 0.001;
            icosahedron.rotation.y += 0.001;

            composer.render();
        };
        
        // Perlin noise for smooth deformation
        const noise = {
            noise3D: (x, y, z) => {
                const p = new Array(512)
                const permutation = [ 151,160,137,91,90,15,
                131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
                190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
                88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
                77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
                102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
                135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
                5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
                223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
                129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
                251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
                49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
                138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
                for (let i=0; i < 256 ; i++) p[256+i] = p[i] = permutation[i];

                const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
                const lerp = (t, a, b) => a + t * (b - a);
                const grad = (hash, x, y, z) => {
                    const h = hash & 15;
                    const u = h < 8 ? x : y;
                    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
                    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
                };
                
                const X = Math.floor(x) & 255;
                const Y = Math.floor(y) & 255;
                const Z = Math.floor(z) & 255;
                x -= Math.floor(x);
                y -= Math.floor(y);
                z -= Math.floor(z);
                const u = fade(x);
                const v = fade(y);
                const w = fade(z);
                const A = p[X] + Y;
                const AA = p[A] + Z;
                const AB = p[A + 1] + Z;
                const B = p[X + 1] + Y;
                const BA = p[B] + Z;
                const BB = p[B + 1] + Z;

                return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)), lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
                                lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)), lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
            }
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            const { clientWidth, clientHeight } = currentMount;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
            composer.setSize(clientWidth, clientHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center font-sans">
            <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0"></div>
            <div className="relative z-10 p-8 bg-black bg-opacity-50 rounded-lg shadow-2xl text-center backdrop-blur-sm">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wider">Binaural Beats Generator</h1>
                <p className="text-lg text-gray-300 mb-8">Experience deep relaxation and focus.</p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                    <div className="flex flex-col items-center">
                        <label htmlFor="base-freq" className="text-lg mb-2">Base Frequency (Hz)</label>
                        <input
                            id="base-freq"
                            type="range"
                            min="30"
                            max="500"
                            step="0.01"
                            value={baseFrequency}
                            onChange={(e) => setBaseFrequency(parseFloat(e.target.value))}
                            className="w-64 accent-cyan-400"
                        />
                        <span className="mt-2 text-cyan-400 font-mono">{baseFrequency.toFixed(2)} Hz</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="binaural-freq" className="text-lg mb-2">Binaural Beat (Hz)</label>
                        <input
                            id="binaural-freq"
                            type="range"
                            min="0.5"
                            max="30"
                            step="0.01"
                            value={binauralFrequency}
                            onChange={(e) => setBinauralFrequency(parseFloat(e.target.value))}
                            className="w-64 accent-pink-400"
                        />
                        <span className="mt-2 text-pink-400 font-mono">{binauralFrequency.toFixed(2)} Hz</span>
                    </div>
                </div>

                <button
                    onClick={togglePlay}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300"
                >
                    {isPlaying ? 'Stop' : 'Play'}
                </button>

                <div className="mt-8 text-left max-w-md mx-auto text-gray-400 text-sm">
                    <p><strong className="text-white">Left Ear:</strong> {(baseFrequency - binauralFrequency / 2).toFixed(2)} Hz</p>
                    <p><strong className="text-white">Right Ear:</strong> {(baseFrequency + binauralFrequency / 2).toFixed(2)} Hz</p>
                </div>
            </div>
        </div>
    );
};

export default BinauralBeatPlayer;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// --- Frequency Presets based on Mood ---
const moodFrequencies = {
    1: { base: 136.1, binaural: 13, label: "Stress Relief" }, // Anxious -> Beta waves for focus
    2: { base: 141.27, binaural: 15, label: "Energy Boost" }, // Sad -> Beta waves for energy
    3: { base: 126.22, binaural: 10, label: "Calm Focus" }, // Neutral -> Alpha waves
    4: { base: 221.23, binaural: 7.83, label: "Relaxation" }, // Good -> Theta waves (Schumann)
    5: { base: 194.18, binaural: 4, label: "Deep Meditation" }, // Excellent -> Theta/Delta waves
};

// --- Star Rating Component ---
const Star = ({ filled, onClick }) => (
    <svg
        onClick={onClick}
        className={`w-10 h-10 sm:w-12 sm:h-12 cursor-pointer transition-all duration-200 transform hover:scale-110 ${filled ? 'text-yellow-400' : 'text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

// --- Home Screen Component ---
const MoodSelector = ({ onMoodSelect }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md md:max-w-2xl p-6 sm:p-8 bg-opacity-50 rounded-2xl shadow-2xl text-center backdrop-blur-sm">
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">How are you feeling?</h1>
                <p className="text-gray-300 mb-8 text-lg">Select a rating to begin a session.</p>
                <div className="flex justify-center items-center gap-2 sm:gap-4 mb-8" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} onMouseEnter={() => setHoverRating(star)}>
                            <Star
                                filled={hoverRating >= star || rating >= star}
                                onClick={() => {
                                    setRating(star);
                                    onMoodSelect(moodFrequencies[star]);
                                }}
                            />
                        </div>
                    ))}
                </div>
                <p className="text-cyan-300 h-6 text-xl transition-opacity duration-300">
                    {hoverRating > 0 ? moodFrequencies[hoverRating].label : (rating > 0 ? moodFrequencies[rating].label : ' ')}
                </p>
            </div>
        </div>
    );
};


// --- Binaural Player Component (Adapted from previous version) ---
const BinauralBeatPlayer = ({ initialFrequencies, onBack }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [baseFrequency, setBaseFrequency] = useState(initialFrequencies.base);
    const [binauralFrequency, setBinauralFrequency] = useState(initialFrequencies.binaural);

    const audioContextRef = useRef(null);
    const leftChannelRef = useRef(null);
    const rightChannelRef = useRef(null);
    const analyserRef = useRef(null);
    const mountRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    const initializeAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = context;
                const analyser = context.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.9;
                analyserRef.current = analyser;
            } catch (e) {
                console.error("Web Audio API is not supported in this browser", e);
            }
        }
    }, []);

    const play = useCallback(() => {
        initializeAudio();
        const context = audioContextRef.current;
        if (!context) return;
        if (context.state === 'suspended') {
            context.resume();
        }

        if (leftChannelRef.current) leftChannelRef.current.stop();
        if (rightChannelRef.current) rightChannelRef.current.stop();

        const left = context.createOscillator();
        const right = context.createOscillator();
        const merger = context.createChannelMerger(2);
        const gainNode = context.createGain();

        left.frequency.setValueAtTime(baseFrequency - binauralFrequency / 2, context.currentTime);
        right.frequency.setValueAtTime(baseFrequency + binauralFrequency / 2, context.currentTime);
        left.type = 'sine';
        right.type = 'sine';
        gainNode.gain.setValueAtTime(0.5, context.currentTime);

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

    const stop = useCallback(() => {
        if (leftChannelRef.current) leftChannelRef.current.stop();
        if (rightChannelRef.current) rightChannelRef.current.stop();
        leftChannelRef.current = null;
        rightChannelRef.current = null;
        setIsPlaying(false);
    }, []);

    const togglePlay = () => isPlaying ? stop() : play();

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

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xaaaaaa);
        scene.add(ambientLight);

        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.2;
        bloomPass.radius = 0.5;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        const geometry = new THREE.IcosahedronGeometry(2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: true });
        const icosahedron = new THREE.Mesh(geometry, material);
        scene.add(icosahedron);
        
        // Perlin noise function (remains the same)
        const noise = {
            noise3D: (x, y, z) => {
                const p = new Array(512);
                const permutation = [ 151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
                for (let i=0; i < 256 ; i++) p[256+i] = p[i] = permutation[i];
                const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (t, a, b) => a + t * (b - a), grad = (hash, x, y, z) => { const h = hash & 15, u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); };
                const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255; x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
                const u = fade(x), v = fade(y), w = fade(z);
                const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
                return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)), lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))), lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)), lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
            }
        };

        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);
            if (analyserRef.current && isPlaying) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const lowerHalfArray = dataArray.slice(0, dataArray.length / 2);
                const upperHalfArray = dataArray.slice(dataArray.length / 2, dataArray.length);
                const lowerAvg = lowerHalfArray.reduce((acc, v) => acc + v, 0) / lowerHalfArray.length;
                const upperAvg = upperHalfArray.reduce((acc, v) => acc + v, 0) / upperHalfArray.length;
                const lowerMax = Math.max(...lowerHalfArray);
                const lowerMaxFr = lowerMax / lowerHalfArray.length;
                const upperAvgFr = upperAvg / upperHalfArray.length;

                const { position } = icosahedron.geometry.attributes;
                if (!icosahedron.geometry.userData.originalPositions) {
                    icosahedron.geometry.userData.originalPositions = position.clone();
                }
                for (let i = 0; i < position.count; i++) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(icosahedron.geometry.userData.originalPositions, i);
                    const offset = icosahedron.geometry.parameters.radius;
                    vertex.normalize();
                    const distance = (offset + lowerMaxFr) + noise.noise3D(vertex.x + performance.now() * 0.00007, vertex.y + performance.now() * 0.00008, vertex.z + performance.now() * 0.00009) * 0.5 * upperAvgFr;
                    vertex.multiplyScalar(distance);
                    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                position.needsUpdate = true;
            }
            icosahedron.rotation.x += 0.001;
            icosahedron.rotation.y += 0.001;
            composer.render();
        };
        animate();

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            composer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, [isPlaying]);

    return (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl p-4 sm:p-8 bg-opacity-60 rounded-lg shadow-2xl text-center backdrop-blur-sm">
                <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 tracking-wider">{initialFrequencies.label}</h1>
                
                <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 my-8">
                    <div className="w-full max-w-xs sm:max-w-sm">
                        <label htmlFor="base-freq" className="text-lg mb-2 block">Base Frequency</label>
                        <input id="base-freq" type="range" min="30" max="500" step="0.01" value={baseFrequency} onChange={(e) => setBaseFrequency(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                        <span className="mt-2 text-cyan-400 font-mono">{baseFrequency.toFixed(2)} Hz</span>
                    </div>
                    <div className="w-full max-w-xs sm:max-w-sm">
                        <label htmlFor="binaural-freq" className="text-lg mb-2 block">Binaural Beat</label>
                        <input id="binaural-freq" type="range" min="0.5" max="30" step="0.01" value={binauralFrequency} onChange={(e) => setBinauralFrequency(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-400" />
                        <span className="mt-2 text-pink-400 font-mono">{binauralFrequency.toFixed(2)} Hz</span>
                    </div>
                </div>

                <button onClick={togglePlay} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300">
                    {isPlaying ? 'Stop' : 'Play'}
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'player'
    const [selectedFrequencies, setSelectedFrequencies] = useState(null);
    const mountRef = useRef(null); // This ref is for the background canvas

    const handleMoodSelect = (frequencies) => {
        setSelectedFrequencies(frequencies);
        setCurrentPage('player');
    };

    const handleBack = () => {
        setCurrentPage('home');
        setSelectedFrequencies(null);
    };
    
    // This useEffect handles the background canvas, which is always present
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);
        
        const geometry = new THREE.IcosahedronGeometry(2.5, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, wireframe: true });
        const backgroundShape = new THREE.Mesh(geometry, material);
        scene.add(backgroundShape);

        const animate = () => {
            requestAnimationFrame(animate);
            backgroundShape.rotation.x += 0.0005;
            backgroundShape.rotation.y += 0.0005;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
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
        <main className="bg-gray-900 font-sans text-white">
            <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-50"></div>
            
            {currentPage === 'home' && <MoodSelector onMoodSelect={handleMoodSelect} />}
            {currentPage === 'player' && selectedFrequencies && (
                <BinauralBeatPlayer initialFrequencies={selectedFrequencies} onBack={handleBack} />
            )}
        </main>
    );
}

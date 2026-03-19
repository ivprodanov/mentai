import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Preset Chart Data ---
const presets = [
    { 
        id: 'sleep', 
        label: "Deep Sleep", 
        desc: "Delta Waves (2 Hz)",
        base: 100, 
        binaural: 2, 
        theme: { bg: "from-blue-900 to-gray-950", wave: "#60a5fa", text: "text-blue-400" } 
    },
    { 
        id: 'meditate', 
        label: "Meditation", 
        desc: "Theta Waves (4 Hz)",
        base: 194.18, 
        binaural: 4, 
        theme: { bg: "from-violet-900 to-gray-950", wave: "#a78bfa", text: "text-violet-400" } 
    },
    { 
        id: 'relax', 
        label: "Relaxation", 
        desc: "Alpha Waves (7.5 Hz)",
        base: 221.23, 
        binaural: 7.5, 
        theme: { bg: "from-emerald-900 to-gray-950", wave: "#34d399", text: "text-emerald-400" } 
    },
    { 
        id: 'focus', 
        label: "Concentration", 
        desc: "Beta Waves (15 Hz)",
        base: 140, 
        binaural: 15, 
        theme: { bg: "from-amber-900 to-gray-950", wave: "#fbbf24", text: "text-amber-400" } 
    },
    { 
        id: 'energy', 
        label: "Energy Boost", 
        desc: "Gamma Waves (30 Hz)",
        base: 141.27, 
        binaural: 30, 
        theme: { bg: "from-rose-900 to-gray-950", wave: "#fb7185", text: "text-rose-400" } 
    },
    { 
        id: 'creative', 
        label: "Creative Flow", 
        desc: "Theta/Alpha Border (7.0 Hz)",
        base: 207.36, // Harmonic base frequency
        binaural: 7.0, 
        theme: { bg: "from-fuchsia-900 to-gray-950", wave: "#e879f9", text: "text-fuchsia-400" } 
    },
    { 
        id: 'stress', 
        label: "Stress Relief", 
        desc: "Low Alpha Waves (8.5 Hz)",
        base: 174, // Solfeggio frequency traditionally used for tension release
        binaural: 8.5, 
        theme: { bg: "from-teal-900 to-gray-950", wave: "#2dd4bf", text: "text-teal-400" } 
    },
    { 
        id: 'lucid', 
        label: "Lucid Dreaming", 
        desc: "Mid Theta Waves (5.5 Hz)",
        base: 136.1, // "Ohm" frequency, very grounding for sleep transitions
        binaural: 5.5, 
        theme: { bg: "from-indigo-900 to-gray-950", wave: "#818cf8", text: "text-indigo-400" } 
    },
    { 
        id: 'study', 
        label: "Memory & Study", 
        desc: "Mid Beta Waves (18 Hz)",
        base: 180, 
        binaural: 18, 
        theme: { bg: "from-cyan-900 to-gray-950", wave: "#22d3ee", text: "text-cyan-400" } 
    },
    { 
        id: 'peak', 
        label: "Peak Cognition", 
        desc: "High Gamma Waves (40 Hz)",
        base: 250, 
        binaural: 40, 
        theme: { bg: "from-orange-900 to-gray-950", wave: "#fb923c", text: "text-orange-400" } 
    }
];

// --- Ambient Sound Options ---
// --- Ambient Sound Options ---
const ambientTracks = [
    { 
        id: 'none', 
        label: 'No Background', 
        file: null,
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        )
    },
    { 
        id: 'rain', 
        label: 'Rain', 
        file: '/audio/rain.mp3',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14.5a4.5 4.5 0 00-4-4.43V10a5 5 0 00-10 0v.07A4.5 4.5 0 006 19h11a4.5 4.5 0 002-4.5zM12 21v-3m-4 3v-3m8 3v-3" />
            </svg>
        )
    },
    { 
        id: 'wind', 
        label: 'Ocean Waves', 
        file: '/audio/ocean.mp3',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15c3 0 3-3 6-3s3 3 6 3 3-3 6-3v2c-3 0-3 3-6 3s-3-3-6-3-3 3-6 3v-2zm0 4c3 0 3-3 6-3s3 3 6 3 3-3 6-3v2c-3 0-3 3-6 3s-3-3-6-3-3 3-6 3v-2z" />
            </svg>
        )
    },
    { 
        id: 'brown', 
        label: 'Chirping Birds', 
        file: '/audio/birds.mp3',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    }
];

// --- Formatted Time Helper ---
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- Preset Chart Screen ---
const PresetChart = ({ onSelect }) => {
    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 py-12">
            <div className="text-center mb-12">
                <Logo />
                <p className="text-gray-400 text-sm sm:text-base font-medium tracking-[0.2em] uppercase mt-4">
                    Ride the binaural tide
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {presets.map((preset) => (
                    <button 
                        key={preset.id}
                        onClick={() => onSelect(preset)}
                        className={`group relative overflow-hidden flex flex-col items-start p-6 rounded-3xl bg-gray-900 bg-opacity-60 border border-gray-700 hover:border-gray-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl text-left backdrop-blur-sm`}
                    >
                        {/* Subtle color glow effect on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${preset.theme.bg} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">{preset.label}</h2>
                        <p className={`${preset.theme.text} font-mono text-sm mb-4 relative z-10`}>{preset.desc}</p>
                        
                        <div className="flex gap-4 w-full mt-auto pt-4 border-t border-gray-800 relative z-10">
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wider">Base</span>
                                <span className="text-gray-300">{preset.base} Hz</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 uppercase tracking-wider">Binaural</span>
                                <span className="text-gray-300">{preset.binaural} Hz</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            <AboutSection />
        </div>
    );
};

// --- Binaural Player Component ---
const BinauralBeatPlayer = ({ activePreset, onBack, onPresetChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [copied, setCopied] = useState(false);
    // Sliders state
    const [baseFrequency, setBaseFrequency] = useState(activePreset.base);
    const [binauralFrequency, setBinauralFrequency] = useState(activePreset.binaural);
    const [volume, setVolume] = useState(0.5);
    const [timerMinutes, setTimerMinutes] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    const [selectedAmbient, setSelectedAmbient] = useState(ambientTracks[0]);
    const [ambientVolume, setAmbientVolume] = useState(0.3); // Default to 30% volume
    const ambientAudioRef = useRef(null);

    // Audio Refs
    const audioContextRef = useRef(null);
    const masterGainRef = useRef(null);
    const leftChannelRef = useRef(null);
    const rightChannelRef = useRef(null);
    const analyserRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    // Update local state when preset changes via the mini-menu
    useEffect(() => {
        setBaseFrequency(activePreset.base);
        setBinauralFrequency(activePreset.binaural);
    }, [activePreset]);

    const handleShare = () => {
        // Construct the URL with current slider values
        const url = `${window.location.origin}${window.location.pathname}?base=${baseFrequency}&beat=${binauralFrequency}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        });
    };

    const initializeAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = context;
                const analyser = context.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;
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
        if (context.state === 'suspended') context.resume();

        if (leftChannelRef.current) leftChannelRef.current.stop();
        if (rightChannelRef.current) rightChannelRef.current.stop();

        const left = context.createOscillator();
        const right = context.createOscillator();
        const merger = context.createChannelMerger(2);
        
        const gainNode = context.createGain();
        masterGainRef.current = gainNode;
        gainNode.gain.setValueAtTime(volume, context.currentTime);

        left.frequency.setValueAtTime(baseFrequency - binauralFrequency / 2, context.currentTime);
        right.frequency.setValueAtTime(baseFrequency + binauralFrequency / 2, context.currentTime);
        left.type = 'sine';
        right.type = 'sine';

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
        
        if (timerMinutes > 0) {
            setRemainingSeconds(timerMinutes * 60);
        }

        
        // NEW: Play ambient audio if one is selected
        if (ambientAudioRef.current && selectedAmbient.file) {
            ambientAudioRef.current.play().catch(e => console.warn("Audio autoplay blocked", e));
        }
        
        if (timerMinutes > 0) {
            setRemainingSeconds(timerMinutes * 60);
        }
    }, [baseFrequency, binauralFrequency, volume, timerMinutes, selectedAmbient, initializeAudio]);

    const stop = useCallback(() => {
        if (leftChannelRef.current) leftChannelRef.current.stop();
        if (rightChannelRef.current) rightChannelRef.current.stop();
        leftChannelRef.current = null;
        rightChannelRef.current = null;
        setIsPlaying(false);
        setRemainingSeconds(0);

        if (ambientAudioRef.current) {
            ambientAudioRef.current.pause();
        }
    }, []);

    const togglePlay = () => isPlaying ? stop() : play();

    // Smoothly update frequencies while playing
    useEffect(() => {
        if (isPlaying && leftChannelRef.current && rightChannelRef.current && audioContextRef.current) {
            const time = audioContextRef.current.currentTime;
            // setTargetAtTime glides the pitch smoothly rather than jumping abruptly
            leftChannelRef.current.frequency.setTargetAtTime(baseFrequency - binauralFrequency / 2, time, 0.1);
            rightChannelRef.current.frequency.setTargetAtTime(baseFrequency + binauralFrequency / 2, time, 0.1);
        }
    }, [baseFrequency, binauralFrequency, isPlaying]);

    // Handle Volume Changes Smoothly
    useEffect(() => {
        if (masterGainRef.current && audioContextRef.current) {
            masterGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.05);
        }
    }, [volume]);

    // Sleep Timer Countdown
    // Effect: Sleep Timer Countdown & Fade Out
    useEffect(() => {
        let interval;
        const FADE_SECONDS = 10; // Start the fade-out 10 seconds before stopping

        if (isPlaying && timerMinutes > 0 && remainingSeconds > 0) {
            interval = setInterval(() => {
                setRemainingSeconds(prev => {
                    const nextSec = prev - 1;

                    // --- THE FADE OUT LOGIC ---
                    if (nextSec === FADE_SECONDS) {
                        
                        // 1. Fade the Binaural Beat (Web Audio API)
                        if (masterGainRef.current && audioContextRef.current) {
                            const currentTime = audioContextRef.current.currentTime;
                            // Anchor the current volume, then ramp down to 0 over 10 seconds
                            masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, currentTime);
                            masterGainRef.current.gain.linearRampToValueAtTime(0.001, currentTime + FADE_SECONDS);
                        }
                    }

                    // 2. Fade the Ambient Background (HTML5 Audio)
                    // We step the volume down incrementally during the last 10 seconds
                    if (nextSec <= FADE_SECONDS && nextSec > 0) {
                        if (ambientAudioRef.current) {
                            // Calculate how much to drop the volume each second
                            const stepDown = ambientVolume / FADE_SECONDS;
                            // Ensure it doesn't drop below 0 to prevent errors
                            const newVol = Math.max(0, ambientAudioRef.current.volume - stepDown);
                            ambientAudioRef.current.volume = newVol;
                        }
                    }

                    // --- STOP LOGIC ---
                    if (nextSec <= 0) {
                        stop(); 
                        return 0;
                    }
                    return nextSec;
                });
            }, 1000); // Runs once every second
        }
        
        return () => clearInterval(interval);
    }, [isPlaying, timerMinutes, remainingSeconds, ambientVolume, stop]);

    // Cleanup Effect
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

    // Canvas Reactive Sine Wave Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const handleResize = () => {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const draw = () => {
            animationFrameIdRef.current = requestAnimationFrame(draw);
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            ctx.clearRect(0, 0, width, height);

            ctx.lineWidth = 4;
            // Use the active preset's wave color
            ctx.strokeStyle = activePreset.theme.wave; 
            ctx.shadowBlur = 20;
            ctx.shadowColor = activePreset.theme.wave;
            ctx.lineJoin = 'round';
            ctx.beginPath();

            if (analyserRef.current && isPlaying) {
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteTimeDomainData(dataArray);

                const sliceWidth = width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * (height / 2);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
            } else {
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
            }

            ctx.stroke();
        };
        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameIdRef.current);
        };
    }, [isPlaying, activePreset]);

    // Effect: Handle Ambient Track Changes
    useEffect(() => {
        if (selectedAmbient.file) {
            if (!ambientAudioRef.current) {
                ambientAudioRef.current = new Audio(selectedAmbient.file);
                ambientAudioRef.current.loop = true; // Make sure it loops endlessly!
            } else {
                ambientAudioRef.current.src = selectedAmbient.file;
            }
            
            ambientAudioRef.current.volume = ambientVolume;
            
            // If the session is already running, start playing the new track immediately
            if (isPlaying) {
                ambientAudioRef.current.play().catch(e => console.warn(e));
            }
        } else {
            // If "None" is selected, pause and clear
            if (ambientAudioRef.current) {
                ambientAudioRef.current.pause();
            }
        }
    }, [selectedAmbient]);

    // Effect: Handle Ambient Volume Slider
    useEffect(() => {
        if (ambientAudioRef.current) {
            ambientAudioRef.current.volume = ambientVolume;
        }
    }, [ambientVolume]);

    return (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -z-10"></canvas>

           <div class="w-full max-w-md md:max-w-2xl lg:max-w-4xl p-6 sm:p-8 bg-white/10 rounded-3xl shadow-2xl border border-white/20 text-center backdrop-blur-xl">
                
                {/* Header & Back Button */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2" title="Go Back">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    
                    <h1 className="text-3xl font-bold tracking-wider text-white">{activePreset.label}</h1>
                    
                    {/* NEW: Share Button */}
                    <button 
                        onClick={handleShare} 
                        className={`p-2 -mr-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                        title="Copy Link to these exact frequencies"
                    >
                        {copied ? (
                            <span>Copied!</span>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        )}
                    </button>
                </div>

                {/* Quick Preset Selector */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {presets.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onPresetChange(p)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activePreset.id === p.id ? 'bg-white text-gray-900 shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 text-left">
                    {/* Frequencies Controls */}
                    <div className="flex flex-col gap-6 bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700">
                        <div className="w-full">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3">Base Frequency</label>
                            <input type="range" min="30" max="500" step="1" value={baseFrequency} onChange={(e) => setBaseFrequency(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            <span className={`mt-2 ${activePreset.theme.text} font-mono text-lg block text-right transition-colors duration-500`}>{baseFrequency.toFixed(1)} Hz</span>
                        </div>
                        <div className="w-full">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3">Binaural Beat</label>
                            {/* UPDATED: Step is now 0.5 */}
                            <input type="range" min="0.5" max="40" step="0.5" value={binauralFrequency} onChange={(e) => setBinauralFrequency(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            <span className={`mt-2 ${activePreset.theme.text} font-mono text-lg block text-right transition-colors duration-500`}>{binauralFrequency.toFixed(1)} Hz</span>
                        </div>
                    </div>

                    {/* Environment Controls */}
                    {/* Environment Controls */}
                    <div className="flex flex-col gap-6 bg-gray-800 bg-opacity-40 p-6 rounded-2xl border border-gray-700">
                        
                        {/* Master & Ambient Volume */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="w-full">
                                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3">Beat Volume</label>
                                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" />
                            </div>
                            <div className="w-full">
                                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3">Ambience Vol</label>
                                <input type="range" min="0" max="1" step="0.01" value={ambientVolume} onChange={(e) => setAmbientVolume(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" disabled={!selectedAmbient.file} />
                            </div>
                        </div>

                        {/* Ambient Sound Selector */}
                        <div className="w-full">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3 text-center md:text-left">Background Sound</label>
                            <div className="flex justify-between md:justify-start gap-3">
                                {ambientTracks.map(track => (
                                    <button 
                                        key={track.id}
                                        title={track.label}
                                        onClick={() => setSelectedAmbient(track)}
                                        className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${selectedAmbient.id === track.id ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-105' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'}`}
                                    >
                                        {track.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Sleep Timer */}
                        <div className="w-full">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-3 text-center md:text-left">Sleep Timer</label>
                            <div className="flex justify-between gap-2">
                                {[0, 15, 30, 60].map(mins => (
                                    <button 
                                        key={mins}
                                        onClick={() => {
                                            setTimerMinutes(mins);
                                            if (isPlaying && mins > 0) setRemainingSeconds(mins * 60);
                                        }}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${timerMinutes === mins ? 'bg-white text-gray-900 shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        {mins === 0 ? 'Off' : `${mins}m`}
                                    </button>
                                ))}
                            </div>
                            {remainingSeconds > 0 && isPlaying && (
                                <p className={`mt-3 text-sm text-center font-mono ${activePreset.theme.text}`}>Stopping in {formatTime(remainingSeconds)}</p>
                            )}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={togglePlay} 
                    className="px-10 py-4 bg-white text-gray-950 font-extrabold text-xl rounded-full shadow-xl hover:scale-105 transition-all duration-300 w-full md:w-auto min-w-[250px]"
                >
                    {isPlaying ? 'Pause Session' : 'Begin Session'}
                </button>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [activePreset, setActivePreset] = useState(null);
    const bgCanvasRef = useRef(null);

    // NEW: Check for URL parameters on initial load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const baseParam = params.get('base');
        const beatParam = params.get('beat');

        if (baseParam && beatParam) {
            const base = parseFloat(baseParam);
            const beat = parseFloat(beatParam);
            
            // Validate that they are actual numbers
            if (!isNaN(base) && !isNaN(beat)) {
                setActivePreset({
                    id: 'shared',
                    label: "Shared Session",
                    desc: "Custom Frequencies via Link",
                    base: base,
                    binaural: beat,
                    // Give shared links a sleek, neutral slate theme
                    theme: { bg: "from-slate-900 to-gray-950", wave: "#cbd5e1", text: "text-slate-300" } 
                });
            }
        }
    }, []);

    // If no preset is selected, default to the gray background. Otherwise, use the preset's gradient.
    const bgClass = activePreset ? `bg-gradient-to-br ${activePreset.theme.bg}` : 'bg-gray-950';

    // Ambient background sine wave
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const handleResize = () => {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const draw = (timestamp) => {
            animationFrameId = requestAnimationFrame(draw);
            const time = timestamp * 0.0005; 
            
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            ctx.clearRect(0, 0, width, height);
            ctx.lineWidth = 1;
            
            // Subtle wave in the background
            ctx.strokeStyle = activePreset ? activePreset.theme.wave : 'rgba(255, 255, 255, 0.1)'; 
            ctx.globalAlpha = 0.15; // Keep it faint
            
            for(let i = 0; i < 3; i++) {
                ctx.beginPath();
                for (let x = 0; x <= width; x += 5) {
                    const y = Math.sin((x * 0.005) + time + (i * 2)) * 50 + (height / 2);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        };
        
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [activePreset]);

    return (
        <main className={`font-sans text-white min-h-screen relative transition-colors duration-1000 ${bgClass} selection:bg-white selection:text-black`}>
            {/* The background wave canvas */}
            <canvas ref={bgCanvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none mix-blend-screen"></canvas>
            
            {!activePreset ? (
                <PresetChart onSelect={setActivePreset} />
            ) : (
                <BinauralBeatPlayer 
                    activePreset={activePreset} 
                    onPresetChange={setActivePreset}
                    onBack={() => setActivePreset(null)} 
                />
            )}
        </main>
    );
}

// --- Educational Info Section ---
const AboutSection = () => (
    <div className="mt-24 max-w-5xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-md text-left text-gray-300 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-white tracking-wide">The Science of Sound</h2>
        <div className="space-y-6 leading-relaxed">
            <p className="text-lg">
                <strong className="text-cyan-400 font-semibold">Binaural beats</strong> are an auditory illusion created by your brain when you listen to two slightly different frequencies simultaneously. 
                For example, if you hear a 200 Hz tone in your left ear and a 210 Hz tone in your right ear, your brain compensates for the difference and perceives a third, rhythmic pulse exactly at <strong className="text-white">10 Hz</strong>.
            </p>
            <p className="text-lg">
                This triggers a biological process called <strong className="text-fuchsia-400 font-semibold">Brainwave Entrainment</strong>. As your brain processes this phantom beat, your actual brainwaves naturally begin to sync with that frequency. By targeting specific mathematical differences, we can gently guide the mind into optimal cognitive states.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-8 border-t border-white/10">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">The Frequency Bands</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3"><span className="text-blue-400 font-mono font-bold w-12 text-right">Delta</span> <span className="text-gray-500">(0.5 - 4 Hz)</span> Deep sleep, physical healing</li>
                        <li className="flex items-center gap-3"><span className="text-violet-400 font-mono font-bold w-12 text-right">Theta</span> <span className="text-gray-500">(4 - 8 Hz)</span> Meditation, creativity, REM sleep</li>
                        <li className="flex items-center gap-3"><span className="text-emerald-400 font-mono font-bold w-12 text-right">Alpha</span> <span className="text-gray-500">(8 - 14 Hz)</span> Calm focus, relaxation, stress relief</li>
                        <li className="flex items-center gap-3"><span className="text-amber-400 font-mono font-bold w-12 text-right">Beta</span> <span className="text-gray-500">(14 - 30 Hz)</span> Active concentration, high alertness</li>
                        <li className="flex items-center gap-3"><span className="text-rose-400 font-mono font-bold w-12 text-right">Gamma</span> <span className="text-gray-500">(30+ Hz)</span> Peak cognition, flow states, memory</li>
                    </ul>
                </div>
                
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                        Headphones Required
                    </h3>
                    <p className="text-sm text-gray-400">
                        Because binaural beats rely on isolating a distinct frequency in each ear to create the illusion inside your brain stem, <strong className="text-gray-200">stereo headphones or earbuds are strictly required</strong>. Playing these tones through standard device or laptop speakers will just sound like a dissonant hum and will not produce the desired neurological effect.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// --- Branding / Logo Component ---
const Logo = () => (
    <div className="flex items-center justify-center mb-4 select-none">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600">
                Tydal
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 ml-1">
                Wave
            </span>
        </h1>
    </div>
);
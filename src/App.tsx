/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Gamepad2, 
  Trophy, 
  RefreshCw,
  Volume2,
  ListMusic,
  Maximize2
} from 'lucide-react';

// --- Constants & Types ---

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;
const MIN_SPEED = 60;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Track {
  id: number;
  title: string;
  artist: string;
  cover: string;
  url: string;
}

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Drift",
    artist: "AI Synth Collective",
    cover: "https://picsum.photos/seed/neon-drift/400/400",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Cyber Pulse",
    artist: "Neural Network Beats",
    cover: "https://picsum.photos/seed/cyber-pulse/400/400",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Midnight Matrix",
    artist: "Data Stream Orchestrations",
    cover: "https://picsum.photos/seed/midnight-matrix/400/400",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// --- Components ---

const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="flex items-end gap-1 h-8 px-2">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-cyan-400 rounded-full"
          animate={{
            height: isPlaying ? [4, 16, 8, 24, 12, 28, 4] : 4
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // --- Music Logic ---
  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const skipTrack = (dir: 'next' | 'prev') => {
    if (dir === 'next') {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Check if food spawned on snake
      if (!currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setIsGameOver(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };
      const currentDir = nextDirection;
      setDirection(currentDir);

      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check Wall Collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      // Check Self Collision
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setIsGameOver(true);
        setGameStarted(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check Food Collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, nextDirection, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setNextDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setNextDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setNextDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setNextDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    if (gameStarted && !isGameOver) {
      const interval = setInterval(moveSnake, speed);
      return () => clearInterval(interval);
    }
  }, [gameStarted, isGameOver, moveSnake, speed]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="h-screen bg-background-dark text-slate-200 p-4 flex flex-col gap-4 font-sans overflow-hidden">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={() => skipTrack('next')}
      />

      {/* --- Responsive Header --- */}
      <header className="bg-surface-dark neon-border rounded-lg px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center">
            <span className="text-black font-black text-xl">S</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight neon-text text-cyan-400">
            NEON SYNTH-SNAKE 
            <span className="text-[10px] opacity-50 font-normal ml-3 tracking-widest uppercase hidden sm:inline">System v4.2.0-Live</span>
          </h1>
        </div>

        <div className="flex gap-8 text-[10px] font-mono uppercase tracking-widest hidden md:flex">
          <div className="flex flex-col items-end">
            <span className="text-gray-500">Session Status</span>
            <span className="text-green-400">Online / Secure</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-500">Latency Check</span>
            <span className="text-cyan-400">12ms - Stable</span>
          </div>
        </div>
      </header>

      {/* --- Main Dashboard Container --- */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* --- Left Column: Music Library --- */}
        <aside className="w-72 music-gradient neon-border rounded-lg flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-border-dark">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Audio Repository
              <ListMusic className="w-3 h-3" />
            </h2>
            <div className="space-y-1 overflow-y-auto max-h-[50vh]">
              {TRACKS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                  className={`w-full p-3 rounded-md flex flex-col gap-1 transition-all text-left border ${
                    currentTrackIndex === i 
                      ? 'active-track border-cyan-500/20' 
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`text-sm font-medium ${currentTrackIndex === i ? 'text-cyan-100' : 'text-gray-400'}`}>
                    {t.title}
                  </span>
                  <span className={`text-[10px] uppercase tracking-tighter italic ${
                    currentTrackIndex === i ? 'text-cyan-600' : 'text-gray-600'
                  }`}>
                    AI Gen / {t.artist}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 space-y-4">
            <div className="bg-black/40 rounded-lg p-3 border border-white/5 shadow-inner">
              <div className="flex justify-between text-[10px] uppercase text-gray-500 mb-2 font-mono">
                <span>Signal Strength</span>
                <span className="text-cyan-500">88%</span>
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-cyan-500"
                  animate={{ width: isPlaying ? "88%" : "12%" }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* --- Center: Game & Global Controls --- */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Game Window */}
          <div className="flex-1 bg-[#050505] rounded-lg neon-border p-6 relative flex items-center justify-center overflow-hidden">
            {/* Score Overlay (Theme Style) */}
            <div className="absolute top-6 left-6 z-10 flex gap-8 pointer-events-none">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Current Fragment</span>
                <span className="text-3xl font-mono font-black neon-text text-cyan-400">
                  {score.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Global Peak</span>
                <span className="text-3xl font-mono font-black text-gray-700">
                  {highScore.toString().padStart(6, '0')}
                </span>
              </div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-6 right-6 text-right pointer-events-none hidden sm:block">
              <div className="text-[10px] uppercase text-gray-600 font-bold mb-2 tracking-widest">Navigation Protical</div>
              <div className="flex gap-2 justify-end">
                <span className="px-2 py-1 bg-gray-800/80 rounded border border-white/10 text-[9px] font-mono text-gray-400">ARROWS / WASD</span>
              </div>
            </div>

            {/* Snake Grid */}
            <div 
              className="relative bg-[#0c0c0e] rounded shadow-inner border-2 border-border-dark"
              style={{ 
                width: 'min(75vw, 420px)', 
                height: 'min(75vw, 420px)',
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
              }}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-30 opacity-20" />
              
              {/* Food (Red as per theme) */}
              <motion.div
                className="bg-red-500 rounded-full shadow-[0_0_12px_#ef4444]"
                style={{
                  gridColumnStart: food.x + 1,
                  gridRowStart: food.y + 1
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />

              {/* Snake */}
              {snake.map((seg, i) => (
                <div
                  key={`${i}-${seg.x}-${seg.y}`}
                  className={`${i === 0 ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-10' : 'bg-cyan-600/60 transition-all'}`}
                  style={{
                    gridColumnStart: seg.x + 1,
                    gridRowStart: seg.y + 1,
                    borderRadius: i === 0 ? '2px' : '1px'
                  }}
                />
              ))}

              {/* Overlays */}
              <AnimatePresence>
                {!gameStarted && !isGameOver && (
                  <motion.div 
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded flex items-center justify-center mb-6 neon-border">
                      <Gamepad2 className="text-cyan-400 w-8 h-8" />
                    </div>
                    <button 
                      onClick={resetGame}
                      className="px-10 py-3 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    >
                      Initialize Link
                    </button>
                  </motion.div>
                )}

                {isGameOver && (
                  <motion.div 
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <h2 className="text-4xl font-black text-red-500 neon-text uppercase mb-2 italic tracking-tighter">Connection Lost</h2>
                    <div className="text-sm font-mono text-gray-500 mb-8 uppercase tracking-widest">
                      Data Synced: {score} Nodes
                    </div>
                    <button 
                      onClick={resetGame}
                      className="flex items-center gap-3 px-8 py-3 bg-white text-black font-black uppercase text-xs rounded transition-all hover:bg-cyan-500 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Restore Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Player Console */}
          <div className="h-24 music-gradient neon-border rounded-lg flex items-center px-6 gap-8 shrink-0">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => skipTrack('prev')} 
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
              </button>
              <button 
                onClick={() => skipTrack('next')} 
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] text-cyan-900">
                <Visualizer isPlaying={isPlaying} />
                <span className="hidden sm:inline">Broadcasting...</span>
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full relative overflow-hidden">
                <motion.div 
                  className="absolute h-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]"
                  animate={{ width: isPlaying ? "100%" : "0%" }}
                  transition={{ duration: 180, ease: "linear" }}
                />
              </div>
              <div className="text-[10px] font-medium text-gray-500 truncate uppercase tracking-widest">
                Now Processing: <span className="text-gray-300 font-bold">{currentTrack.title}</span> — {currentTrack.artist}
              </div>
            </div>

            <div className="w-40 items-center gap-3 hidden md:flex">
                <Volume2 className="w-4 h-4 text-gray-600 shrink-0" />
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="h-1 flex-1 bg-gray-800 rounded-full accent-cyan-500 appearance-none cursor-pointer"
                />
            </div>
          </div>
        </main>

        {/* --- Right Column: Intelligence & Stats --- */}
        <aside className="w-64 flex flex-col gap-4 shrink-0 hidden xl:flex">
          <div className="flex-1 music-gradient neon-border rounded-lg p-6 flex flex-col">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Trophy className="w-3 h-3 text-yellow-500" />
              Global Matrix
            </h2>
            <div className="space-y-4">
              {[
                { name: "X_RIPPER_X", score: 12500, rank: "01", active: true },
                { name: "CYBER_PUNK", score: 11200, rank: "02", active: false },
                { name: "SYSTEM_D", score: 9840, rank: "03", active: false },
                { name: "NEON_WAVE", score: 8750, rank: "04", active: false }
              ].map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-sm border flex items-center justify-center text-[10px] font-mono ${
                      entry.active ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-gray-900 border-white/5 text-gray-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <span className={`text-xs font-medium tracking-tight ${entry.active ? 'text-white' : 'text-gray-500'}`}>
                      {entry.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono ${entry.active ? 'text-cyan-400' : 'text-gray-700'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-white/5">
              <h2 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-4">Live Statistics</h2>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-black/40 rounded border border-white/5 shadow-inner">
                  <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Eaten</div>
                  <div className="text-xl font-mono text-cyan-500 leading-none">{(score / 10).toFixed(0)}</div>
                </div>
                <div className="p-3 bg-black/40 rounded border border-white/5 shadow-inner">
                  <div className="text-[9px] text-gray-600 uppercase font-black mb-1">Growth</div>
                  <div className="text-xl font-mono text-magenta-500 leading-none">+{snake.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-500/5 p-4 rounded-lg border border-cyan-500/10">
             <p className="text-[10px] text-cyan-400 leading-relaxed italic opacity-80">
               "Ingest high-energy red fragments to maintain kernel stability. Terminal velocity reached at 200 nodes."
             </p>
          </div>
        </aside>

      </div>

      {/* --- Footer Status Ticker --- */}
      <footer className="h-4 flex items-center overflow-hidden shrink-0 border-t border-white/5 bg-black/50">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em] px-12">
              • SYSTEM_LIVE • BUFFERING_OPTIMAL • CORE_TEMP_38C • ENCRYPTION_ACTIVE •
            </span>
          ))}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        input[type="range"] {
          background: #1a1a1e;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 10px;
          width: 10px;
          border-radius: 2px;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 8px #22d3ee;
        }
      `}} />
    </div>
  );
}

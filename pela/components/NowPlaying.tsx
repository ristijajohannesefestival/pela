import { motion } from 'motion/react';

interface NowPlayingProps {
  song: {
    title: string;
    artist: string;
    albumArt: string;
  };
}

export function NowPlaying({ song }: NowPlayingProps) {
  return (
    <div className="bg-gradient-to-r from-[#e0c3fc]/10 to-[#8ec5fc]/20 rounded-3xl p-6 mb-6 border border-[#1DB954]/30">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={song.albumArt} 
            alt={song.title}
            className="w-20 h-20 rounded-2xl shadow-lg shadow-[#1DB954]/20"
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-[#1DB954]"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[#1DB954] text-xs mb-1 flex items-center gap-2">
            <span className="uppercase tracking-wider">Now Playing</span>
            <motion.div
              className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <h3 className="text-white truncate">{song.title}</h3>
          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        </div>

        <AudioWave />
      </div>
    </div>
  );
}

function AudioWave() {
  const bars = [0.4, 0.8, 0.6, 0.9, 0.5, 0.7, 0.3];

  return (
    <div className="flex items-center gap-1 h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-r from-[#e0c3fc] to-[#8ec5fc] rounded-full"
          animate={{
            height: [`${height * 100}%`, `${((height + 0.3) % 1) * 100}%`, `${height * 100}%`],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

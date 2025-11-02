import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { useState, forwardRef } from 'react';

interface QueueItemProps {
  song: {
    id: string;
    title: string;
    artist: string;
    albumArt: string;
    hype: number;
  };
  index: number;
  onVote: (id: string) => void;
  hasVoted: boolean;
}

export const QueueItem = forwardRef<HTMLDivElement, QueueItemProps>(({ song, index, onVote, hasVoted }, ref) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = () => {
    if (hasVoted) return;
    setIsVoting(true);
    onVote(song.id);
    setTimeout(() => setIsVoting(false), 600);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-[#1DB954]/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-500 w-6 text-center">
          {index + 1}
        </div>

        <img 
          src={song.albumArt} 
          alt={song.title}
          className="w-14 h-14 rounded-xl"
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-white truncate">{song.title}</h4>
          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        </div>

        <motion.button
          onClick={handleVote}
          disabled={hasVoted}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            hasVoted 
              ? 'bg-[#1DB954]/20 text-[#1DB954] cursor-not-allowed' 
              : 'bg-white/10 text-white hover:bg-[#1DB954] hover:scale-105'
          }`}
          whileTap={{ scale: hasVoted ? 1 : 0.95 }}
        >
          <motion.div
            animate={isVoting ? {
              scale: [1, 1.5, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <Flame className="w-4 h-4" fill={hasVoted ? '#1DB954' : 'currentColor'} />
          </motion.div>
          <span className="font-mono">{song.hype}</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

QueueItem.displayName = 'QueueItem';

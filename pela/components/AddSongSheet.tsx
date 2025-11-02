import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Music, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchSpotify } from '../utils/api';

interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
}

interface AddSongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSong: (song: Song) => void;
  cooldownMinutes?: number;
}

export function AddSongSheet({ open, onOpenChange, onAddSong, cooldownMinutes }: AddSongSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);
    
    if (query.length > 1) {
      setIsSearching(true);
      try {
        const results = await searchSpotify(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error instanceof Error ? error.message : 'Failed to search');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddSong = (song: Song) => {
    onAddSong(song);
    setSearchQuery('');
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-[#0e0e0e] border-t border-[#1DB954]/30 rounded-t-3xl h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-white text-center">Lisa lugu järjekorda</SheetTitle>
          <SheetDescription className="text-gray-400 text-center">
            Otsi ja lisa oma lemmiklaul hääletamiseks
          </SheetDescription>
        </SheetHeader>

        {cooldownMinutes ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center p-6 bg-purple-600/20 border border-purple-500/30 rounded-3xl"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="inline-block mb-4"
            >
              🥂
            </motion.div>
            <h3 className="text-white mb-2">Oota veidi!</h3>
            <p className="text-gray-400 text-sm">
              Järgmine lisamisvõimalus <span className="text-purple-400">{cooldownMinutes} min</span> pärast
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-purple-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Cooldown aktiivne</span>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e: { target: { value: string; }; }) => handleSearch(e.target.value)}
                placeholder="Otsi lugu või artisti..."
                className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:border-[#1DB954]"
              />
            </div>

            <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(85vh-200px)]">
              <AnimatePresence>
                {searchError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                    <p className="text-red-400 mb-2">Otsing ebaõnnestus</p>
                    <p className="text-gray-500 text-sm">{searchError}</p>
                    {searchError.includes('Spotify API not configured') && (
                      <p className="text-gray-500 text-xs mt-4">
                        Spotify API võtmed pole seadistatud.<br/>
                        Kasutan demo andmeid.
                      </p>
                    )}
                  </div>
                ) : isSearching ? (
                  <div className="text-center py-12 text-gray-500">
                    <Music className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                    <p>Otsin Spotify'st...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((song) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-[#1DB954]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={song.albumArt} 
                          alt={song.title}
                          className="w-14 h-14 rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white truncate">{song.title}</h4>
                          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                        </div>
                        <Button
                          onClick={() => handleAddSong(song)}
                          className="bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full px-6"
                        >
                          Lisa
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : searchQuery.length > 1 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Tulemusi ei leitud</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Alusta otsimist</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

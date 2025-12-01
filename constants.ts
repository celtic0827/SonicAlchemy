
import { Track } from './types';
import { generateTrackCover } from './services/imageUtils';

export const INITIAL_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Rain',
    coverUrl: generateTrackCover('Neon Rain'),
    prompt: 'Synthwave, Lo-Fi, Rain sounds, Melancholic, Night drive',
    tags: ['Synthwave', 'Lo-Fi', 'Rain', 'Melancholic', 'Night'],
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    title: 'Galactic Voyage',
    coverUrl: generateTrackCover('Galactic Voyage'),
    prompt: 'Orchestral, Sci-Fi, Epic, Space, Adventure, Brass',
    tags: ['Orchestral', 'Sci-Fi', 'Epic', 'Space', 'Adventure', 'Brass'],
    createdAt: Date.now() - 200000,
  },
  {
    id: '3',
    title: 'Urban Jungle',
    coverUrl: generateTrackCover('Urban Jungle'),
    prompt: 'Hip Hop, Jazz Fusion, City, Energetic, Saxophone',
    tags: ['Hip Hop', 'Jazz', 'City', 'Energetic', 'Saxophone'],
    createdAt: Date.now() - 300000,
  },
  {
    id: '4',
    title: 'Deep Blue',
    coverUrl: generateTrackCover('Deep Blue'),
    prompt: 'Ambient, Water, Calm, Meditation, Drone, Rain',
    tags: ['Ambient', 'Water', 'Calm', 'Meditation', 'Drone', 'Rain'],
    createdAt: Date.now() - 400000,
  },
  {
    id: '5',
    title: 'Retro Racer',
    coverUrl: generateTrackCover('Retro Racer'),
    prompt: 'Chiptune, 8-bit, Fast, Arcade, Energetic, Synthwave',
    tags: ['Chiptune', '8-bit', 'Fast', 'Arcade', 'Energetic', 'Synthwave'],
    createdAt: Date.now() - 500000,
  },
];

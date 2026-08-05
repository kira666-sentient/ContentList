const ITUNES_MUSIC_API = 'https://itunes.apple.com/search';

export async function searchMusic(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${ITUNES_MUSIC_API}?term=${encodeURIComponent(query)}&entity=album&limit=12`);
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map(item => ({
      id: item.collectionId,
      title: item.collectionName,
      type: 'music',
      year: (item.releaseDate || '').substring(0, 4),
      rating: 8.5,
      poster: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      backdrop: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      overview: `Album by ${item.artistName} • ${item.trackCount || 10} tracks`
    }));
  } catch (err) {
    console.error('Music Search Error:', err);
    return [];
  }
}

export async function getMusicDetails(id) {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const album = data.results[0];
    const tracks = data.results.slice(1);

    return {
      id: album.collectionId,
      title: album.collectionName,
      type: 'music',
      year: (album.releaseDate || '').substring(0, 4),
      rating: 8.8,
      poster: album.artworkUrl100 ? album.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      backdrop: album.artworkUrl100 ? album.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      overview: `Released by ${album.artistName}. Genre: ${album.primaryGenreName}. Contains ${album.trackCount} tracks.`,
      artist: album.artistName,
      genres: [album.primaryGenreName],
      tracks: tracks.map(t => ({ name: t.trackName, previewUrl: t.previewUrl })),
      reviews: [
        { author: 'iTunes Listener', content: `Genre: ${album.primaryGenreName}. Release Year: ${(album.releaseDate || '').substring(0, 4)}.` }
      ]
    };
  } catch (err) {
    console.error('Music Detail Error:', err);
    return null;
  }
}

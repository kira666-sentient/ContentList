const ITUNES_PODCAST_API = 'https://itunes.apple.com/search';

export async function searchPodcasts(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${ITUNES_PODCAST_API}?term=${encodeURIComponent(query)}&entity=podcast&limit=12`);
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map(item => ({
      id: item.collectionId,
      title: item.collectionName,
      type: 'podcast',
      year: (item.releaseDate || '').substring(0, 4),
      rating: 8.7,
      poster: item.artworkUrl600 || item.artworkUrl100,
      backdrop: item.artworkUrl600 || item.artworkUrl100,
      overview: `Podcast by ${item.artistName} • ${item.trackCount || 50}+ episodes`
    }));
  } catch (err) {
    console.error('Podcast Search Error:', err);
    return [];
  }
}

export async function getPodcastDetails(id) {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const pod = data.results[0];

    return {
      id: pod.collectionId,
      title: pod.collectionName,
      type: 'podcast',
      year: (pod.releaseDate || '').substring(0, 4),
      rating: 8.9,
      poster: pod.artworkUrl600 || pod.artworkUrl100,
      backdrop: pod.artworkUrl600 || pod.artworkUrl100,
      overview: `Hosted by ${pod.artistName}. Genre: ${pod.primaryGenreName}.`,
      artist: pod.artistName,
      genres: [pod.primaryGenreName, 'Podcasts'],
      episodes: `${pod.trackCount || '100+'} episodes`,
      reviews: [
        { author: 'Apple Podcasts Community', content: `Primary Genre: ${pod.primaryGenreName}. Publisher: ${pod.artistName}.` }
      ]
    };
  } catch (err) {
    console.error('Podcast Detail Error:', err);
    return null;
  }
}

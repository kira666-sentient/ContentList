const OPENLIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const OPENLIBRARY_WORK = 'https://openlibrary.org';

export async function searchBooks(query) {
  if (!query) return [];
  try {
    const res = await fetch(`${OPENLIBRARY_SEARCH}?q=${encodeURIComponent(query)}&limit=12`);
    const data = await res.json();
    if (!data.docs) return [];

    return data.docs.map(item => {
      const img = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null;
      return {
        // OpenLibrary returns key as '/works/OL12345W', we strip the '/works/' prefix
        id: item.key.replace('/works/', ''),
        title: item.title || 'Unknown Title',
        type: 'book',
        year: item.first_publish_year ? item.first_publish_year.toString() : '',
        rating: item.ratings_average ? (item.ratings_average * 2).toFixed(1) : 8.0,
        poster: img,
        backdrop: img,
        overview: item.author_name ? `By ${item.author_name.join(', ')}` : 'No overview available.'
      };
    });
  } catch (err) {
    console.error('OpenLibrary Search Error:', err);
    return [];
  }
}

export async function getBookDetails(id) {
  try {
    const res = await fetch(`${OPENLIBRARY_WORK}/works/${id}.json`);
    const info = await res.json();
    
    // Sometimes description is an object { value: "..." }
    let overview = 'No description available for this book.';
    if (info.description) {
      overview = typeof info.description === 'string' ? info.description : info.description.value;
    }

    const img = info.covers && info.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${info.covers[0]}-L.jpg` : null;

    return {
      id: id,
      title: info.title,
      type: 'book',
      year: info.first_publish_date || '',
      rating: 8.0,
      poster: img,
      backdrop: img,
      overview: overview,
      genres: info.subjects ? info.subjects.slice(0, 3) : ['Literature'],
      author: 'Unknown Author', // author details require a separate API call in OpenLibrary, so we fallback
      pages: 'N/A',
      publisher: 'Unknown Publisher',
      reviews: [
        { author: 'OpenLibrary Data', content: `Powered by the Internet Archive` }
      ]
    };
  } catch (err) {
    console.error('Book Detail Error:', err);
    return null;
  }
}

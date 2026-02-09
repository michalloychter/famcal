const axios = require('axios');

/**
 * Fetch real places from Google Places API
 * @param {string} type - Place type (e.g., 'coffee shops', 'restaurants')
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array<{name: string, address: string}>>}
 */
async function getNearbyPlaces(type, lat, lon) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API key not set');

  // Map friendly type to Google Places type
  const typeMap = {
    'coffee shops': 'cafe',
    'romantic restaurants': 'restaurant',
    'parks and picnic spots': 'park',
    'cinemas and entertainment venues': 'movie_theater',
    'restaurants': 'restaurant',
    'cafe': 'cafe',
    'park': 'park',
    'movie': 'movie_theater'
  };
  const googleType = typeMap[type] || 'restaurant';

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=3000&type=${googleType}&key=${apiKey}`;
  const response = await axios.get(url);
  console.log('Google Places raw response:', JSON.stringify(response.data));
  if (!response.data.results) return [];
  return response.data.results.slice(0, 4).map(place => ({
    name: place.name,
    address: place.vicinity || place.formatted_address || ''
  }));
}

module.exports = { getNearbyPlaces };
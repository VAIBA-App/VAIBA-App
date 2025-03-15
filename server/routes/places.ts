import { Router } from 'express';
import axios from 'axios';

interface PlaceResult {
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  distance?: number;
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface PlacesResponse {
  results: PlaceResult[];
  next_page_token?: string;
}

const router = Router();

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Helper function to fetch places with pagination
async function getAllPlaces(baseUrl: string, apiKey: string): Promise<PlaceResult[]> {
  let allResults: PlaceResult[] = [];
  let nextPageToken: string | undefined;

  do {
    // If we have a next page token, add it to the URL
    const url = nextPageToken
      ? `${baseUrl}&pagetoken=${nextPageToken}`
      : baseUrl;

    // Make the API request
    const response = await axios.get(url);
    const data = response.data;

    // Add the results from this page
    if (data.results) {
      allResults = [...allResults, ...data.results];
    }

    // Get the next page token
    nextPageToken = data.next_page_token;

    // If we have a next page token, we need to wait a bit before making the next request
    // This is required by the Google Places API
    if (nextPageToken) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } while (nextPageToken);

  return allResults;
}

// Function to search places in multiple zones to get more comprehensive results
async function searchInMultipleZones(
  searchTerm: string,
  centerLat: number,
  centerLng: number,
  radius: number,
  apiKey: string
): Promise<PlaceResult[]> {
  const searchRadii = [radius * 0.33, radius * 0.66, radius]; // Search in three zones
  const allResults = new Map<string, PlaceResult>(); // Use Map to deduplicate by place_id

  for (const searchRadius of searchRadii) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&location=${centerLat},${centerLng}&radius=${searchRadius}&key=${apiKey}`;
    const zoneResults = await getAllPlaces(url, apiKey);

    // Add results to map using place_id as key to deduplicate
    zoneResults.forEach(place => {
      if (!allResults.has(place.place_id)) {
        allResults.set(place.place_id, place);
      }
    });
  }

  return Array.from(allResults.values());
}

router.post('/api/places/search', async (req, res) => {
  try {
    const { searchTerm, location, radius } = req.body;
    console.log('Received search request:', { searchTerm, location, radius });

    // Verify required data
    if (!searchTerm || !location || !radius) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          searchTerm: !searchTerm,
          location: !location,
          radius: !radius
        }
      });
    }

    // Verify API key
    const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key is not configured');
      return res.status(500).json({
        error: 'Google Places API key is not configured'
      });
    }

    // First, get coordinates for the location using Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    console.log('Calling Geocoding API...');
    const geocodeResponse = await axios.get(geocodeUrl);
    console.log('Geocoding API response:', geocodeResponse.data);

    if (!geocodeResponse.data.results?.length) {
      return res.status(400).json({
        error: 'Location not found',
        details: geocodeResponse.data
      });
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    console.log('Location coordinates:', { lat, lng });

    // Search in multiple zones to get comprehensive results
    console.log('Starting multi-zone search...');
    const allPlaces = await searchInMultipleZones(searchTerm, lat, lng, radius, apiKey);
    console.log(`Found total of ${allPlaces.length} unique places before filtering`);

    // Get detailed information for each place and calculate distance
    const detailedResults = await Promise.all(
      allPlaces.map(async (place: PlaceResult) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,website&key=${apiKey}`;
          const detailsResponse = await axios.get(detailsUrl);
          const details = detailsResponse.data.result;

          // Calculate distance from search location
          const distance = calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          // Only include results within the specified radius
          if (distance <= (radius / 1000)) { // Convert radius from meters to km
            return {
              name: place.name,
              industry: searchTerm,
              phoneNumber: details.formatted_phone_number || '',
              email: '',
              address: details.formatted_address || place.formatted_address || '',
              website: details.website || '',
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
              coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
              }
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching details for place ${place.name}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by distance
    const validResults = detailedResults.filter(result => result !== null);
    const sortedResults = validResults.sort((a, b) => a!.distance - b!.distance);

    console.log('Sending results:', sortedResults);
    res.json(sortedResults);
  } catch (error: any) {
    console.error('Places API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    res.status(500).json({
      error: 'Error searching for places',
      details: error.response?.data || error.message
    });
  }
});

export default router;
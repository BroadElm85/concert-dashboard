import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Music, Star, Filter, Search, Heart, ExternalLink, Headphones, Plane, Plus, Settings, Database, Upload, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const ConcertDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [realConcerts, setRealConcerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [useRealData, setUseRealData] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  // Load saved API key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('ticketmaster_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Filter events to music only
  const filterMusicEvents = (events) => {
    return events.filter(event => {
      const classification = event.classifications?.[0];
      const segment = classification?.segment?.name?.toLowerCase() || '';
      const genre = classification?.genre?.name?.toLowerCase() || '';
      const subGenre = classification?.subGenre?.name?.toLowerCase() || '';
      
      // Include only music events, exclude theater/sports/other
      return segment === 'music' || 
             genre.includes('rock') || 
             genre.includes('pop') || 
             genre.includes('country') || 
             genre.includes('folk') || 
             genre.includes('indie') || 
             genre.includes('electronic') || 
             genre.includes('hip') || 
             genre.includes('rap') || 
             genre.includes('jazz') || 
             genre.includes('blues') || 
             genre.includes('alternative') ||
             subGenre.includes('rock') ||
             subGenre.includes('pop') ||
             subGenre.includes('country') ||
             // Exclude obvious theater/broadway terms
             (!event.name.toLowerCase().includes('hamilton') &&
              !event.name.toLowerCase().includes('harry potter') &&
              !event.name.toLowerCase().includes('broadway') &&
              !event.name.toLowerCase().includes('musical') &&
              !event.name.toLowerCase().includes('theater') &&
              !event.name.toLowerCase().includes('theatre'));
    });
  };

  // Convert Ticketmaster events to our format
  const formatConcerts = (events) => {
    return events.map(event => ({
      id: `tm_${event.id}`,
      artist: event.name,
      venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
      date: event.dates.start.localDate,
      time: event.dates.start.localTime || null,
      genre: event.classifications?.[0]?.genre?.name || 'Music',
      price: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : 'Price TBA',
      image: event.images?.[0]?.url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      spotifyMatch: false,
      venueType: "Unknown",
      ticketUrl: event.url
    }));
  };

  // Fetch all music concerts from NYC
  const fetchRealConcerts = async () => {
    if (!apiKey) {
      alert('Please enter your Ticketmaster API key in Settings first!');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setLastSearchTerm('');
    try {
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?city=New York&classificationName=music&apikey=${apiKey}&size=50&sort=date,asc`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data._embedded?.events) {
        const musicEvents = filterMusicEvents(data._embedded.events);
        const concerts = formatConcerts(musicEvents);
        
        setRealConcerts(concerts);
        setUseRealData(true);
        setLastFetched(new Date());
        console.log(`✅ Fetched ${concerts.length} music concerts`);
        
        if (concerts.length === 0) {
          alert('No music concerts found in NYC. Try searching for a specific artist.');
        }
      } else {
        alert('No concerts found in NYC area.');
      }
    } catch (error) {
      console.error('Error fetching real concerts:', error);
      alert('Failed to fetch concerts. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // Search for specific artist on Ticketmaster
  const searchArtist = async (artistName) => {
    if (!apiKey) {
      alert('Please enter your Ticketmaster API key in Settings first!');
      setShowSettings(true);
      return;
    }

    if (!artistName.trim()) {
      return;
    }

    setLoading(true);
    setLastSearchTerm(artistName);
    try {
      // Search for the artist specifically
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(artistName)}&classificationName=music&city=New York&stateCode=NY&apikey=${apiKey}&size=20&sort=date,asc`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data._embedded?.events) {
        const musicEvents = filterMusicEvents(data._embedded.events);
        const concerts = formatConcerts(musicEvents);
        
        setRealConcerts(concerts);
        setUseRealData(true);
        setLastFetched(new Date());
        console.log(`✅ Found ${concerts.length} events for ${artistName}`);
        
        if (concerts.length === 0) {
          alert(`No music concerts found for "${artistName}" in NYC area. They might not be touring here currently.`);
        }
      } else {
        alert(`No concerts found for "${artistName}" in NYC area.`);
        // Don't clear existing data, just show the message
      }
    } catch (error) {
      console.error('Error searching for artist:', error);
      alert('Failed to search. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      searchArtist(searchTerm.trim());
    }
  };

  // Mock data for demo
  const mockLocalConcerts = [
    {
      id: 1,
      artist: "The National",
      venue: "Brooklyn Bowl",
      date: "2025-07-15",
      time: "8:00 PM",
      genre: "Indie Rock",
      price: "$45-65",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      spotifyMatch: true,
      venueType: "Intimate"
    },
    {
      id: 2,
      artist: "HAIM",
      venue: "Webster Hall",
      date: "2025-08-02",
      time: "8:30 PM",
      genre: "Pop Rock",
      price: "$55-75",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop",
      spotifyMatch: true,
      venueType: "Mid-size"
    },
    {
      id: 3,
      artist: "Tyler Childers",
      venue: "Brooklyn Paramount",
      date: "2025-08-15",
      time: "7:30 PM",
      genre: "Country",
      price: "$65-85",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      spotifyMatch: true,
      venueType: "Large"
    }
  ];

  const toggleFavorite = (concertId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(concertId)) {
      newFavorites.delete(concertId);
    } else {
      newFavorites.add(concertId);
    }
    setFavorites(newFavorites);
  };

  const ConcertCard = ({ concert }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <img 
          src={concert.image} 
          alt={concert.artist}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <button 
            onClick={() => toggleFavorite(concert.id)}
            className={`p-2 rounded-full transition-colors ${
              favorites.has(concert.id) 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart size={16} fill={favorites.has(concert.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900">{concert.artist}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{concert.genre}</span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <span>{concert.venue}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-green-500" />
            <span>
              {new Date(concert.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              {concert.time && ` • ${concert.time}`}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-gray-900">{concert.price}</span>
            <button 
              onClick={() => window.open(concert.ticketUrl || '#', '_blank')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={14} />
              Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter concerts based on local search term and genre
  const filteredConcerts = (useRealData ? realConcerts : mockLocalConcerts).filter(concert => {
    if (lastSearchTerm) {
      // If we just searched for an artist, don't filter further - show the search results
      return true;
    }
    
    // Local filtering for browsing
    const matchesSearch = concert.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         concert.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || concert.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <Music className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Concert Finder</h1>
                <p className="text-sm text-gray-600">Your personalized music discovery dashboard</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 text-white p-1 rounded-full mt-0.5">
              <Database size={16} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">
                    {useRealData ? 'Live Concert Data' : 'Sample Data Notice'}
                  </h3>
                  <p className="text-amber-800 text-sm">
                    {useRealData ? (
                      <>Currently showing live music concerts from Ticketmaster API. 
                      {lastSearchTerm && <> Searched for: "{lastSearchTerm}".</>}
                      {' '}Last updated: {lastFetched?.toLocaleTimeString()}</>
                    ) : (
                      <>This dashboard currently displays sample concert data. 
                      Click "Fetch Real Data" to connect to Ticketmaster API for live concert listings.</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchRealConcerts}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {lastSearchTerm ? 'Searching...' : 'Fetching...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Fetch Real Data
                      </>
                    )}
                  </button>
                  {useRealData && (
                    <button
                      onClick={() => {
                        setUseRealData(false);
                        setLastSearchTerm('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Use Sample Data
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={useRealData ? "Press Enter to search Ticketmaster for artists (e.g., 'Cole Swindell')..." : "Search artists, venues..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={useRealData ? handleSearch : undefined}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Genres</option>
                <option value="indie">Indie</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="country">Country</option>
                <option value="folk">Folk</option>
                <option value="electronic">Electronic</option>
              </select>
              
              {lastSearchTerm && useRealData && (
                <button
                  onClick={() => {
                    setLastSearchTerm('');
                    setSearchTerm('');
                    fetchRealConcerts();
                  }}
                  className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {useRealData ? (lastSearchTerm ? `Search Results for "${lastSearchTerm}"` : 'Live NYC Music Concerts') : 'Sample Concerts'}
            </h2>
            <span className="text-sm text-gray-600">{filteredConcerts.length} concerts found</span>
          </div>
          
          {filteredConcerts.length === 0 && useRealData && (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No concerts found</h3>
              <p className="text-gray-600 mb-4">
                {lastSearchTerm 
                  ? `No music concerts found for "${lastSearchTerm}" in NYC area.` 
                  : 'No music concerts found in NYC area right now.'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLastSearchTerm('');
                  fetchRealConcerts();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Show All Concerts
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConcerts.map(concert => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticketmaster API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Ticketmaster API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your key: YwPWZEoGidnvsIlUyaLM1EJc3yxQjZAG
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    if (apiKey) {
                      localStorage.setItem('ticketmaster_api_key', apiKey);
                    }
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcertDashboard;

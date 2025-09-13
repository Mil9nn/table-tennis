import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, Clock } from "lucide-react";

interface Venue {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  rating?: number;
  types?: string[];
  distance?: number;
}

interface VenueSelectorProps {
  selectedVenue: Venue | null;
  onVenueSelect: (venue: Venue | null) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

// Mock Google Places API results - replace with actual Google Places API
const MOCK_VENUES: Venue[] = [
  {
    name: 'MA Stadium Jammu',
    address: 'MA Stadium, Canal Road, Jammu, Jammu and Kashmir 180001',
    latitude: 32.7266,
    longitude: 74.8570,
    placeId: 'mock_ma_stadium',
    rating: 4.2,
    types: ['stadium', 'sports_complex'],
    distance: 0.5
  },
  {
    name: 'Sports Complex University of Jammu',
    address: 'University of Jammu, Jammu-Srinagar National Highway, Jammu, J&K 180006',
    latitude: 32.7391,
    longitude: 74.8974,
    placeId: 'mock_university_sports',
    rating: 4.0,
    types: ['university', 'sports_complex'],
    distance: 1.2
  },
  {
    name: 'Indoor Sports Hall Jammu',
    address: 'Gandhi Nagar, Jammu, Jammu and Kashmir 180001',
    latitude: 32.7204,
    longitude: 74.8567,
    placeId: 'mock_indoor_hall',
    rating: 3.8,
    types: ['sports_complex', 'establishment'],
    distance: 0.8
  },
  {
    name: 'TT Club Residency Road',
    address: 'Residency Road, Near Circuit House, Jammu, J&K 180001',
    latitude: 32.7326,
    longitude: 74.8605,
    placeId: 'mock_tt_club',
    rating: 4.5,
    types: ['sports_club', 'establishment'],
    distance: 0.3
  },
  {
    name: 'Youth Services and Sports Complex',
    address: 'Shakti Nagar, Jammu, Jammu and Kashmir 180016',
    latitude: 32.7089,
    longitude: 74.8278,
    placeId: 'mock_youth_sports',
    rating: 3.9,
    types: ['sports_complex', 'government'],
    distance: 2.1
  }
];

const VenueSelector: React.FC<VenueSelectorProps> = ({ 
  selectedVenue, 
  onVenueSelect, 
  userLocation,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customVenue, setCustomVenue] = useState<Partial<Venue>>({
    name: '',
    address: ''
  });
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load nearby venues on component mount
  useEffect(() => {
    // In a real implementation, this would call Google Places Nearby Search API
    setNearbyVenues(MOCK_VENUES.slice(0, 3));
  }, [userLocation]);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        performVenueSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performVenueSearch = async (query: string) => {
    try {
      // Mock search - replace with actual Google Places Text Search API
      const filteredVenues = MOCK_VENUES.filter(venue => 
        venue.name.toLowerCase().includes(query.toLowerCase()) ||
        venue.address.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredVenues);
    } catch (error) {
      console.error('Venue search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVenueSelect = (venue: Venue) => {
    onVenueSelect(venue);
    setSearchQuery('');
    setSearchResults([]);
    setShowCustomForm(false);
  };

  const handleCustomVenueSubmit = () => {
    if (customVenue.name && customVenue.address) {
      const venue: Venue = {
        name: customVenue.name,
        address: customVenue.address,
        placeId: `custom_${Date.now()}`
      };
      handleVenueSelect(venue);
      setCustomVenue({ name: '', address: '' });
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Use the location to fetch nearby venues
          console.log('User location:', position.coords.latitude, position.coords.longitude);
          // This would trigger a new nearby search
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const VenueCard: React.FC<{ venue: Venue; onSelect: () => void }> = ({ venue, onSelect }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1">{venue.name}</h3>
          {venue.rating && (
            <Badge variant="secondary" className="ml-2">
              ⭐ {venue.rating}
            </Badge>
          )}
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{venue.address}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {venue.types?.slice(0, 2).map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          {venue.distance && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Navigation className="w-3 h-3" />
              {venue.distance}km
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search for venues (e.g., MA Stadium, Sports Complex)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute right-1 top-1 h-8"
          onClick={getUserLocation}
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Venue */}
      {selectedVenue && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">Selected Venue</h3>
                <p className="font-medium">{selectedVenue.name}</p>
                <p className="text-sm text-gray-600">{selectedVenue.address}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onVenueSelect(null)}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Search Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((venue) => (
              <VenueCard 
                key={venue.placeId} 
                venue={venue} 
                onSelect={() => handleVenueSelect(venue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nearby Venues */}
      {!selectedVenue && searchResults.length === 0 && nearbyVenues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-700">Nearby Venues</h3>
            <Badge variant="secondary" className="text-xs">
              <Navigation className="w-3 h-3 mr-1" />
              Near you
            </Badge>
          </div>
          <div className="space-y-2">
            {nearbyVenues.map((venue) => (
              <VenueCard 
                key={venue.placeId} 
                venue={venue} 
                onSelect={() => handleVenueSelect(venue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Venue Option */}
      <div className="border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="w-full"
        >
          {showCustomForm ? 'Hide' : 'Add'} Custom Venue
        </Button>

        {showCustomForm && (
          <Card className="mt-3">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-700">Custom Venue</h3>
              <div>
                <Label>Venue Name</Label>
                <Input
                  placeholder="Enter venue name"
                  value={customVenue.name || ''}
                  onChange={(e) => setCustomVenue(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  placeholder="Enter full address"
                  value={customVenue.address || ''}
                  onChange={(e) => setCustomVenue(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                onClick={handleCustomVenueSubmit}
                disabled={!customVenue.name || !customVenue.address}
                className="w-full"
              >
                Add Custom Venue
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Access Buttons */}
      {!selectedVenue && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleVenueSelect(MOCK_VENUES[0])}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            MA Stadium
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleVenueSelect(MOCK_VENUES[1])}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            University Sports
          </Button>
        </div>
      )}

      {/* No results message */}
      {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
        <div className="text-center text-gray-500 py-4">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No venues found for "{searchQuery}"</p>
          <p className="text-sm">Try a different search or add a custom venue</p>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  ArrowLeftCircle, 
  Users, 
  User, 
  MapPin, 
  Trophy,
  Plus,
  X
} from "lucide-react";

// Mock data - replace with your actual API calls
const TEAM_FORMATS = [
  {
    id: 'format1',
    name: 'A,B,C,A,B vs X,Y,Z,Y,X',
    description: '5 Singles Matches',
    matches: [
      { matchNumber: 1, type: 'singles', description: 'A vs X' },
      { matchNumber: 2, type: 'singles', description: 'B vs Y' },
      { matchNumber: 3, type: 'singles', description: 'C vs Z' },
      { matchNumber: 4, type: 'singles', description: 'A vs Y' },
      { matchNumber: 5, type: 'singles', description: 'B vs X' },
    ]
  },
  {
    id: 'format2',
    name: 'A, AB, B vs X, XY, Y',
    description: 'Single-Double-Single',
    matches: [
      { matchNumber: 1, type: 'singles', description: 'A vs X' },
      { matchNumber: 2, type: 'doubles', description: 'AB vs XY' },
      { matchNumber: 3, type: 'singles', description: 'B vs Y' },
    ]
  },
  {
    id: 'format3',
    name: 'A, B, C vs X, Y, Z',
    description: '3 Singles Matches Only',
    matches: [
      { matchNumber: 1, type: 'singles', description: 'A vs X' },
      { matchNumber: 2, type: 'singles', description: 'B vs Y' },
      { matchNumber: 3, type: 'singles', description: 'C vs Z' },
    ]
  }
];

// Mock venues - replace with Google Places API
const MOCK_VENUES = [
  { name: 'MA Stadium Jammu', address: 'MA Stadium, Jammu, J&K', placeId: 'mock1' },
  { name: 'Sports Complex Jammu', address: 'Sports Complex, Jammu, J&K', placeId: 'mock2' },
  { name: 'University Stadium', address: 'University of Jammu, Jammu, J&K', placeId: 'mock3' },
];

interface Player {
  userId: string;
  username: string;
  displayName: string;
}

interface PlayerSearchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPlayerFound: (player: Player | null) => void;
  error?: string;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({ label, value, onChange, onPlayerFound, error }) => {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);

  const searchUser = async (username: string) => {
    if (!username.trim()) {
      onPlayerFound(null);
      setFound(false);
      return;
    }

    setSearching(true);
    try {
      // Mock API call - replace with actual API
      setTimeout(() => {
        const mockPlayer = { userId: `user_${username}`, username, displayName: `${username} Player` };
        onPlayerFound(mockPlayer);
        setFound(true);
        setSearching(false);
      }, 500);
    } catch (error) {
      onPlayerFound(null);
      setFound(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUser(value);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        placeholder={`Enter ${label.toLowerCase()} username`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${
          error ? "border-red-500" : found ? "border-green-500" : ""
        }`}
      />
      {searching && <p className="text-sm text-gray-500">Searching...</p>}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-sm text-red-500">{error}</AlertDescription>
        </Alert>
      )}
      {found && !error && <p className="text-sm text-green-600">✓ Player found</p>}
    </div>
  );
};

const EnhancedCreateMatch: React.FC = () => {
  const [matchCategory, setMatchCategory] = useState<'individual' | 'team'>('individual');
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [teamFormat, setTeamFormat] = useState<string>('');
  const [bestOf, setBestOf] = useState<number>(3);
  
  // Individual match players
  const [players, setPlayers] = useState({
    player1: '',
    player2: '',
    player3: '',
    player4: ''
  });
  const [foundPlayers, setFoundPlayers] = useState<Record<string, Player | null>>({});
  
  // Team match players
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1Players, setTeam1Players] = useState<string[]>(['', '', '']);
  const [team2Players, setTeam2Players] = useState<string[]>(['', '', '']);
  const [foundTeamPlayers, setFoundTeamPlayers] = useState<Record<string, Player | null>>({});
  
  // Scorer and venue
  const [scorer, setScorer] = useState('');
  const [foundScorer, setFoundScorer] = useState<Player | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [customVenue, setCustomVenue] = useState({ name: '', address: '' });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedFormat = TEAM_FORMATS.find(f => f.id === teamFormat);

  const getRequiredPlayersCount = () => {
    if (matchCategory === 'individual') {
      return matchType === 'singles' ? 2 : 4;
    } else {
      return selectedFormat ? Math.max(...selectedFormat.matches.map(m => m.type === 'doubles' ? 2 : 1)) : 3;
    }
  };

  const updateTeamPlayerCount = (format: string) => {
    const formatConfig = TEAM_FORMATS.find(f => f.id === format);
    if (formatConfig) {
      const maxPlayers = Math.max(
        ...formatConfig.matches.map(m => m.type === 'doubles' ? 2 : 1)
      );
      const playersNeeded = formatConfig.id === 'format1' ? 3 : maxPlayers;
      
      setTeam1Players(Array(playersNeeded).fill(''));
      setTeam2Players(Array(playersNeeded).fill(''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!scorer || !foundScorer) {
      newErrors.scorer = 'Scorer is required';
    }
    
    if (matchCategory === 'individual') {
      if (!players.player1 || !foundPlayers.player1) newErrors.player1 = 'Player 1 is required';
      if (!players.player2 || !foundPlayers.player2) newErrors.player2 = 'Player 2 is required';
      
      if (matchType === 'doubles') {
        if (!players.player3 || !foundPlayers.player3) newErrors.player3 = 'Player 3 is required';
        if (!players.player4 || !foundPlayers.player4) newErrors.player4 = 'Player 4 is required';
      }
    } else {
      if (!teamFormat) newErrors.teamFormat = 'Team format is required';
      if (!team1Name.trim()) newErrors.team1Name = 'Team 1 name is required';
      if (!team2Name.trim()) newErrors.team2Name = 'Team 2 name is required';
      
      // Check if all required team players are filled
      const requiredCount = getRequiredPlayersCount();
      for (let i = 0; i < requiredCount; i++) {
        if (!team1Players[i] || !foundTeamPlayers[`team1_${i}`]) {
          newErrors[`team1_${i}`] = `Team 1 Player ${i + 1} is required`;
        }
        if (!team2Players[i] || !foundTeamPlayers[`team2_${i}`]) {
          newErrors[`team2_${i}`] = `Team 2 Player ${i + 1} is required`;
        }
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    // Create match data
    const matchData = {
      matchCategory,
      matchType: matchCategory === 'individual' ? matchType : undefined,
      teamFormat: matchCategory === 'team' ? teamFormat : undefined,
      bestOf,
      scorer: foundScorer.userId,
      venue: selectedVenue ? MOCK_VENUES.find(v => v.name === selectedVenue) : customVenue.name ? customVenue : undefined,
      
      // Individual match data
      ...(matchCategory === 'individual' && {
        player1: foundPlayers.player1?.userId,
        player2: foundPlayers.player2?.userId,
        player3: matchType === 'doubles' ? foundPlayers.player3?.userId : undefined,
        player4: matchType === 'doubles' ? foundPlayers.player4?.userId : undefined,
      }),
      
      // Team match data
      ...(matchCategory === 'team' && {
        team1Name,
        team2Name,
        team1Players: team1Players.slice(0, getRequiredPlayersCount()).map((_, i) => foundTeamPlayers[`team1_${i}`]?.userId).filter(Boolean),
        team2Players: team2Players.slice(0, getRequiredPlayersCount()).map((_, i) => foundTeamPlayers[`team2_${i}`]?.userId).filter(Boolean),
      })
    };
    
    console.log('Match Data:', matchData);
    // Here you would call your API to create the match
    alert('Match created successfully! (This is a demo)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 rounded-2xl p-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeftCircle className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Create Match</h1>
              <p className="text-gray-600">Set up your table tennis match</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Match Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Match Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={matchCategory === 'individual' ? 'default' : 'outline'}
                    onClick={() => setMatchCategory('individual')}
                    className="p-6 h-auto flex-col gap-2"
                  >
                    <User className="w-8 h-8" />
                    <span className="font-semibold">Individual</span>
                    <span className="text-sm opacity-70">1v1 or 2v2 matches</span>
                  </Button>
                  <Button
                    type="button"
                    variant={matchCategory === 'team' ? 'default' : 'outline'}
                    onClick={() => setMatchCategory('team')}
                    className="p-6 h-auto flex-col gap-2"
                  >
                    <Users className="w-8 h-8" />
                    <span className="font-semibold">Team</span>
                    <span className="text-sm opacity-70">Multiple matches between teams</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Individual Match Settings */}
            {matchCategory === 'individual' && (
              <Card>
                <CardHeader>
                  <CardTitle>Individual Match Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Match Type</Label>
                      <Select value={matchType} onValueChange={(value: 'singles' | 'doubles') => setMatchType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="singles">Singles</SelectItem>
                          <SelectItem value="doubles">Doubles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Best Of</Label>
                      <Select value={bestOf.toString()} onValueChange={(value) => setBestOf(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Best of 1</SelectItem>
                          <SelectItem value="3">Best of 3</SelectItem>
                          <SelectItem value="5">Best of 5</SelectItem>
                          <SelectItem value="7">Best of 7</SelectItem>
                          <SelectItem value="9">Best of 9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <PlayerSearch
                      label="Player 1"
                      value={players.player1}
                      onChange={(value) => setPlayers(prev => ({ ...prev, player1: value }))}
                      onPlayerFound={(player) => setFoundPlayers(prev => ({ ...prev, player1: player }))}
                      error={errors.player1}
                    />
                    <PlayerSearch
                      label="Player 2"
                      value={players.player2}
                      onChange={(value) => setPlayers(prev => ({ ...prev, player2: value }))}
                      onPlayerFound={(player) => setFoundPlayers(prev => ({ ...prev, player2: player }))}
                      error={errors.player2}
                    />
                  </div>

                  {matchType === 'doubles' && (
                    <div className="grid grid-cols-2 gap-4">
                      <PlayerSearch
                        label="Player 3"
                        value={players.player3}
                        onChange={(value) => setPlayers(prev => ({ ...prev, player3: value }))}
                        onPlayerFound={(player) => setFoundPlayers(prev => ({ ...prev, player3: player }))}
                        error={errors.player3}
                      />
                      <PlayerSearch
                        label="Player 4"
                        value={players.player4}
                        onChange={(value) => setPlayers(prev => ({ ...prev, player4: value }))}
                        onPlayerFound={(player) => setFoundPlayers(prev => ({ ...prev, player4: player }))}
                        error={errors.player4}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Match Settings */}
            {matchCategory === 'team' && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Match Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Team Format Selection */}
                  <div>
                    <Label>Team Format</Label>
                    <Select 
                      value={teamFormat} 
                      onValueChange={(value) => {
                        setTeamFormat(value);
                        updateTeamPlayerCount(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team format" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_FORMATS.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            <div>
                              <div className="font-medium">{format.name}</div>
                              <div className="text-sm text-gray-500">{format.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teamFormat && (
                      <p className="text-sm text-red-500 mt-1">{errors.teamFormat}</p>
                    )}
                  </div>

                  {/* Format Preview */}
                  {selectedFormat && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Match Structure</h4>
                      <div className="space-y-2">
                        {selectedFormat.matches.map((match) => (
                          <div key={match.matchNumber} className="flex items-center justify-between">
                            <span className="text-sm">Match {match.matchNumber}</span>
                            <Badge variant={match.type === 'singles' ? 'default' : 'secondary'}>
                              {match.type}
                            </Badge>
                            <span className="text-sm text-gray-600">{match.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Of */}
                  <div>
                    <Label>Best Of (per individual match)</Label>
                    <Select value={bestOf.toString()} onValueChange={(value) => setBestOf(parseInt(value))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Best of 1</SelectItem>
                        <SelectItem value="3">Best of 3</SelectItem>
                        <SelectItem value="5">Best of 5</SelectItem>
                        <SelectItem value="7">Best of 7</SelectItem>
                        <SelectItem value="9">Best of 9</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Team 1 Name</Label>
                      <Input
                        placeholder="Enter team 1 name"
                        value={team1Name}
                        onChange={(e) => setTeam1Name(e.target.value)}
                        className={errors.team1Name ? "border-red-500" : ""}
                      />
                      {errors.team1Name && (
                        <p className="text-sm text-red-500 mt-1">{errors.team1Name}</p>
                      )}
                    </div>
                    <div>
                      <Label>Team 2 Name</Label>
                      <Input
                        placeholder="Enter team 2 name"
                        value={team2Name}
                        onChange={(e) => setTeam2Name(e.target.value)}
                        className={errors.team2Name ? "border-red-500" : ""}
                      />
                      {errors.team2Name && (
                        <p className="text-sm text-red-500 mt-1">{errors.team2Name}</p>
                      )}
                    </div>
                  </div>

                  {/* Team Players */}
                  {teamFormat && (
                    <div className="grid grid-cols-2 gap-6">
                      {/* Team 1 Players */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-center">Team 1 Players</h4>
                        {team1Players.slice(0, getRequiredPlayersCount()).map((player, index) => (
                          <PlayerSearch
                            key={`team1_${index}`}
                            label={`Player ${String.fromCharCode(65 + index)}`}
                            value={team1Players[index]}
                            onChange={(value) => {
                              const newPlayers = [...team1Players];
                              newPlayers[index] = value;
                              setTeam1Players(newPlayers);
                            }}
                            onPlayerFound={(foundPlayer) => {
                              setFoundTeamPlayers(prev => ({
                                ...prev,
                                [`team1_${index}`]: foundPlayer
                              }));
                            }}
                            error={errors[`team1_${index}`]}
                          />
                        ))}
                      </div>

                      {/* Team 2 Players */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-center">Team 2 Players</h4>
                        {team2Players.slice(0, getRequiredPlayersCount()).map((player, index) => (
                          <PlayerSearch
                            key={`team2_${index}`}
                            label={`Player ${String.fromCharCode(88 + index)}`}
                            value={team2Players[index]}
                            onChange={(value) => {
                              const newPlayers = [...team2Players];
                              newPlayers[index] = value;
                              setTeam2Players(newPlayers);
                            }}
                            onPlayerFound={(foundPlayer) => {
                              setFoundTeamPlayers(prev => ({
                                ...prev,
                                [`team2_${index}`]: foundPlayer
                              }));
                            }}
                            error={errors[`team2_${index}`]}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Venue Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Venue</Label>
                  <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a venue or enter custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_VENUES.map((venue) => (
                        <SelectItem key={venue.placeId} value={venue.name}>
                          <div>
                            <div className="font-medium">{venue.name}</div>
                            <div className="text-sm text-gray-500">{venue.address}</div>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Venue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedVenue === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Venue Name</Label>
                      <Input
                        placeholder="Enter venue name"
                        value={customVenue.name}
                        onChange={(e) => setCustomVenue(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Venue Address</Label>
                      <Textarea
                        placeholder="Enter venue address"
                        value={customVenue.address}
                        onChange={(e) => setCustomVenue(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scorer Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Scorer</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerSearch
                  label="Match Scorer"
                  value={scorer}
                  onChange={setScorer}
                  onPlayerFound={setFoundScorer}
                  error={errors.scorer}
                />
                <p className="text-sm text-gray-500 mt-2">
                  The scorer will be responsible for recording match details and shots.
                </p>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" className="px-8">
                Create Match
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 

export default EnhancedCreateMatch;
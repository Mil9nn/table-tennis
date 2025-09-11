"use client"

import React, { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, DollarSign, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Tournament {
  _id: string;
  name: string;
  description: string;
  format: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  bestOf: number;
  registrationDeadline: string;
  startDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

const TournamentListPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/api/tournament/create' 
        : `/api/tournament/create?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerForTournament = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/register`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Successfully registered for tournament!');
        fetchTournaments(); // Refresh the list
      } else {
        alert(data.message || 'Failed to register');
      }
    } catch (error) {
      alert('An error occurred while registering');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-600', icon: Clock },
      registration_open: { color: 'bg-green-100 text-green-600', icon: Users },
      registration_closed: { color: 'bg-yellow-100 text-yellow-600', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-600', icon: Play },
      completed: { color: 'bg-purple-100 text-purple-600', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-600', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const canRegister = (tournament: Tournament) => {
    return tournament.status === 'registration_open' && 
           tournament.currentParticipants < tournament.maxParticipants &&
           new Date() < new Date(tournament.registrationDeadline);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tournaments</h1>
          <p className="text-gray-600">Join exciting table tennis competitions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { key: 'all', label: 'All Tournaments' },
            { key: 'registration_open', label: 'Open Registration' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Create Tournament Button */}
        <div className="text-center mb-8">
          <a
            href="/tournament/create"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Create Tournament
          </a>
        </div>

        {/* Tournament Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No tournaments found</h3>
            <p className="text-gray-400">Be the first to create a tournament!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 truncate flex-1 mr-2">
                      {tournament.name}
                    </h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                  
                  {tournament.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}

                  {/* Tournament Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Play className="w-4 h-4 mr-2" />
                      <span>Best of {tournament.bestOf}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {formatDate(tournament.startDate).split(',')[0]}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>${tournament.entryFee}</span>
                    </div>
                  </div>

                  {/* Format Badge */}
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {tournament.format.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Reg. closes: {formatDate(tournament.registrationDeadline).split(',')[0]}
                    </div>
                    
                    {canRegister(tournament) ? (
                      <button
                        onClick={() => registerForTournament(tournament._id)}
                        className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition"
                      >
                        Register
                      </button>
                    ) : tournament.status === 'registration_open' && tournament.currentParticipants >= tournament.maxParticipants ? (
                      <span className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg">
                        Full
                      </span>
                    ) : (
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                        disabled
                      >
                        View
                      </button>
                    )}
                  </div>
                  
                  {tournament.prizePool > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-sm font-semibold text-green-600">
                        Prize Pool: ${tournament.prizePool}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentListPage;
"use client"

import React, { useState } from 'react';
import { Calendar, Trophy, Users, DollarSign, Settings } from 'lucide-react';

const CreateTournamentPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'single_elimination',
    maxParticipants: 8,
    entryFee: 0,
    prizePool: 0,
    bestOf: 3,
    registrationDeadline: '',
    startDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tournament created successfully!');
        setFormData({
          name: '',
          description: '',
          format: 'single_elimination',
          maxParticipants: 8,
          entryFee: 0,
          prizePool: 0,
          bestOf: 3,
          registrationDeadline: '',
          startDate: ''
        });
      } else {
        setError(data.message || 'Failed to create tournament');
      }
    } catch (err) {
      setError('An error occurred while creating the tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  const participantOptions = [4, 8, 16, 32, 64];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Create Tournament</h1>
            <p className="text-gray-500 mt-2">Set up a new table tennis tournament</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter tournament name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Tournament description (optional)"
              />
            </div>

            {/* Tournament Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Format */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Settings className="inline w-4 h-4 mr-1" />
                  Format
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="double_elimination">Double Elimination</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Max Participants
                </label>
                <select
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {participantOptions.map(num => (
                    <option key={num} value={num}>{num} Players</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Match Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best Of */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Best Of
                </label>
                <select
                  name="bestOf"
                  value={formData.bestOf}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={3}>Best of 3</option>
                  <option value={5}>Best of 5</option>
                  <option value={7}>Best of 7</option>
                </select>
              </div>

              {/* Entry Fee */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Entry Fee
                </label>
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Prize Pool */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prize Pool
                </label>
                <input
                  type="number"
                  name="prizePool"
                  value={formData.prizePool}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Date Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tournament Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Tournament...' : 'Create Tournament'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-2">Tournament Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Single Elimination: Players are eliminated after one loss</p>
              <p>• Registration closes automatically at the deadline</p>
              <p>• You can manually close registration early if needed</p>
              <p>• Brackets are generated once registration closes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
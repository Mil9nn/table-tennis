'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Simple validation schema
const matchSchema = z.object({
  matchCategory: z.enum(['individual', 'team']),
  matchType: z.string().min(1, 'Please select match type'),
  numberOfSets: z.enum(['1', '3', '5', '7', '9']),
  city: z.string().min(1, 'Please enter city/venue'),
  scorer: z.string().min(1, 'Please enter scorer name'),
  player1: z.string().optional(),
  player2: z.string().optional(),
  player3: z.string().optional(),
  player4: z.string().optional(),
  team1Name: z.string().optional(),
  team2Name: z.string().optional(),
});

export default function MatchCreationForm() {
  const [matchCategory, setMatchCategory] = useState('individual');
  const [selectedMatchType, setSelectedMatchType] = useState('');
  
  const form = useForm({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      matchCategory: 'individual',
      numberOfSets: '3',
      matchType: '',
      city: '',
      scorer: '',
      player1: '',
      player2: '',
      player3: '',
      player4: '',
      team1Name: '',
      team2Name: '',
    },
  });

  // Individual match types
  const individualMatchTypes = [
    { value: 'singles', label: 'Singles 1v1' },
    { value: 'doubles', label: 'Doubles 2v2' },
    { value: 'mixed_doubles', label: 'Mixed Doubles' },
  ];

  // Team match formats
  const teamMatchFormats = [
    { value: 'five_singles', label: 'A,B,C,A,B vs X,Y,Z,Y,X (5 Singles)' },
    { value: 'single_double_single', label: 'A, AB, B vs X, XY, Y (Single-Double-Single)' },
    { value: 'extended_format', label: 'A,B,C,D,E vs 1,2,3,4,5,6 (Extended)' },
    { value: 'three_singles', label: 'A,B,C vs X,Y,Z (3 Singles)' },
    { value: 'custom', label: 'Custom Format' },
  ];

  const handleSubmit = (data) => {
    console.log('Match Data:', data);
    // Send data to your API endpoint
    // Example: await fetch('/api/matches', { method: 'POST', body: JSON.stringify(data) })
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Table Tennis Match</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
              
              {/* Match Category */}
              <FormField
                control={form.control}
                name="matchCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Match Category</FormLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setMatchCategory(value);
                      }}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="cursor-pointer">Individual</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="team" id="team" />
                        <Label htmlFor="team" className="cursor-pointer">Team</Label>
                      </div>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Match Type */}
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      {matchCategory === 'individual' ? 'Match Type' : 'Team Match Format'}
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedMatchType(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {matchCategory === 'individual' ? (
                          individualMatchTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))
                        ) : (
                          teamMatchFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Number of Sets */}
              <FormField
                control={form.control}
                name="numberOfSets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Number of Sets</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['1', '3', '5', '7', '9'].map((num) => (
                          <SelectItem key={num} value={num}>
                            {num} {num === '1' ? 'Set' : 'Sets'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City/Venue */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">City/Venue</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter city or venue" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scorer */}
                <FormField
                  control={form.control}
                  name="scorer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Scorer</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter scorer username" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Individual Match Players */}
              {matchCategory === 'individual' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Players</h3>
                  
                  {/* Singles Players */}
                  {selectedMatchType === 'singles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="player1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter player 1 name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="player2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter player 2 name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Doubles Players */}
                  {(selectedMatchType === 'doubles' || selectedMatchType === 'mixed_doubles') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Team 1</Label>
                        <FormField
                          control={form.control}
                          name="player1"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Player 1A" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="player2"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Player 1B" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Team 2</Label>
                        <FormField
                          control={form.control}
                          name="player3"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Player 2A" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="player4"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Player 2B" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Team Match Setup */}
              {matchCategory === 'team' && (
                <TeamMatchSetup form={form} />
              )}

              <Button 
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Create Match
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Team Match Setup Component
function TeamMatchSetup({ form }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Team Setup</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team 1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Team 1</Label>
          <FormField
            control={form.control}
            name="team1Name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Team 1 Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Input placeholder="Player A" />
            <Input placeholder="Player B" />
            <Input placeholder="Player C" />
          </div>
        </div>
        
        {/* Team 2 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Team 2</Label>
          <FormField
            control={form.control}
            name="team2Name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Team 2 Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Input placeholder="Player X" />
            <Input placeholder="Player Y" />
            <Input placeholder="Player Z" />
          </div>
        </div>
      </div>
    </div>
  );
}
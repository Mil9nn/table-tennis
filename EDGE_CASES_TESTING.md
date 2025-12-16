# Edge Cases Testing Guide

This document outlines edge cases that should be tested after the profile insights fixes.

## Test Cases

### 1. Empty/No Data Cases
- **Empty matches**: User with no completed matches
- **Empty games**: Match with no games
- **No shots**: Game with no shots recorded
- **Missing shot data**: Shots without required fields (player, stroke, coordinates)

### 2. Single Shot Cases
- **Single shot game**: Game with only one shot
- **Single match**: User with only one match
- **Single zone**: Only one zone has data

### 3. Missing Coordinate Data
- **Missing landingX/Y**: Shots without landing coordinates
- **Missing originX/Y**: Shots without origin coordinates
- **Invalid coordinates**: Coordinates outside valid range (0-100)

### 4. Incomplete Games
- **Unfinished games**: Games that are not completed
- **Missing scores**: Games without side1Score/side2Score or team1Score/team2Score
- **Score mismatch**: Games where shot count doesn't match score

### 5. Team Match Specific
- **Team match side handling**: Verify team1/team2 vs side1/side2 handling
- **SubMatch structure**: Verify subMatch games are processed correctly
- **Multiple players**: Verify player identification in team matches

### 6. Sample Size Edge Cases
- **Below minimum threshold**: Zones/shots with fewer than minimum required samples
- **Exactly at threshold**: Zones/shots with exactly minimum required samples
- **Single data point**: Zones with only 1 shot (should be filtered or marked as insufficient)

### 7. Calculation Edge Cases
- **100% win rate**: All shots in a zone/type are wins
- **0% win rate**: All shots in a zone/type are losses
- **50% win rate**: Exactly balanced wins/losses
- **Division by zero**: Calculations that might divide by zero

### 8. Serve/Receive Edge Cases
- **No serves**: User who never served
- **No receives**: User who never received
- **Serve without win**: Serves that didn't win points directly
- **Missing server data**: Shots without server field

### 9. Data Model Edge Cases
- **Only winning shots stored**: Verify behavior when only winning shots are in database
- **All rally shots stored**: Verify behavior when all rally shots are in database
- **Mixed storage**: Some games with only winning shots, others with all shots

### 10. UI Display Edge Cases
- **Loading states**: Verify loading indicators show correctly
- **Empty state messages**: Verify appropriate messages for no data
- **Error states**: Verify error handling and display
- **Large datasets**: Performance with many matches/games/shots

## Expected Behaviors After Fixes

1. **Minimum sample sizes**: Data below thresholds should be filtered or marked as insufficient
2. **Null/undefined handling**: All functions should handle missing data gracefully
3. **Team match compatibility**: Both individual and team matches should work correctly
4. **Accurate calculations**: Win rates and statistics should be calculated correctly based on actual point outcomes
5. **No crashes**: All edge cases should be handled without throwing errors

## Testing Checklist

- [ ] Test with user having no matches
- [ ] Test with user having one match with one game
- [ ] Test with games missing shot data
- [ ] Test with shots missing coordinates
- [ ] Test with incomplete games
- [ ] Test team matches vs individual matches
- [ ] Test zones with 1-2 shots (below minimum)
- [ ] Test serve accuracy with no serves
- [ ] Test with only winning shots stored
- [ ] Test UI loading and error states
- [ ] Verify all calculations match expected values
- [ ] Check for console errors/warnings


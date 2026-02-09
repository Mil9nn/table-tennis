/**
 * Filter validation and date range utilities for leaderboard queries
 */

export interface LeaderboardFilters {
  // Match type (optional - for Individual tab with "All" option)
  type?: 'singles' | 'doubles' | 'all';
  
  // Player filters
  gender?: 'male' | 'female';
  handedness?: 'left' | 'right';
  
  // Time filters
  timeRange?: 'all_time' | 'this_year' | 'this_month';
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  
  // Competition context
  tournamentId?: string;
  tournamentSeason?: number; // Year
  matchFormat?: 'friendly' | 'tournament';
  eventCategory?: 'singles' | 'doubles';
  
  // Pagination
  limit?: number;
  skip?: number;
}

const VALID_MATCH_TYPES = ['singles', 'doubles'] as const;
const VALID_GENDERS = ['male', 'female'] as const;
const VALID_HANDEDNESS = ['left', 'right'] as const;
const VALID_TIME_RANGES = ['all_time', 'this_year', 'this_month'] as const;
const VALID_MATCH_FORMATS = ['friendly', 'tournament'] as const;

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Validate and parse query parameters into LeaderboardFilters
 */
export function validateFilters(params: URLSearchParams): {
  filters: LeaderboardFilters;
  errors: string[];
} {
  const errors: string[] = [];
  const filters: Partial<LeaderboardFilters> = {};

  // Optional: type (for Individual tab - can be 'all' or specific match type)
  const type = params.get('type');
  if (type) {
    if (type === 'all' || VALID_MATCH_TYPES.includes(type as any)) {
      filters.type = type as LeaderboardFilters['type'];
    } else {
      errors.push(`Invalid 'type'. Must be one of: 'all', ${VALID_MATCH_TYPES.join(', ')}`);
    }
  }
  // If type is not provided, it defaults to 'all' (show all individual match types)

  // Optional: gender
  const gender = params.get('gender');
  if (gender && !VALID_GENDERS.includes(gender as any)) {
    errors.push(`Invalid 'gender'. Must be one of: ${VALID_GENDERS.join(', ')}`);
  } else if (gender) {
    filters.gender = gender as LeaderboardFilters['gender'];
  }

  // Optional: handedness
  const handedness = params.get('handedness');
  if (handedness && !VALID_HANDEDNESS.includes(handedness as any)) {
    errors.push(`Invalid 'handedness'. Must be one of: ${VALID_HANDEDNESS.join(', ')}`);
  } else if (handedness) {
    filters.handedness = handedness as LeaderboardFilters['handedness'];
  }

  // Optional: timeRange
  const timeRange = params.get('timeRange');
  if (timeRange && !VALID_TIME_RANGES.includes(timeRange as any)) {
    errors.push(`Invalid 'timeRange'. Must be one of: ${VALID_TIME_RANGES.join(', ')}`);
  } else if (timeRange) {
    filters.timeRange = timeRange as LeaderboardFilters['timeRange'];
  }

  // Optional: dateFrom and dateTo (custom date range)
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      errors.push("Invalid 'dateFrom'. Must be a valid ISO date string.");
    } else {
      filters.dateFrom = dateFrom;
    }
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      errors.push("Invalid 'dateTo'. Must be a valid ISO date string.");
    } else {
      filters.dateTo = dateTo;
    }
  }
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    if (fromDate > toDate) {
      errors.push("'dateFrom' must be before or equal to 'dateTo'.");
    }
  }

  // Optional: tournamentId
  const tournamentId = params.get('tournamentId');
  if (tournamentId) {
    // Basic validation - should be a valid ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(tournamentId)) {
      errors.push("Invalid 'tournamentId'. Must be a valid MongoDB ObjectId.");
    } else {
      filters.tournamentId = tournamentId;
    }
  }

  // Optional: tournamentSeason (year)
  const tournamentSeason = params.get('tournamentSeason');
  if (tournamentSeason) {
    const year = parseInt(tournamentSeason, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      errors.push("Invalid 'tournamentSeason'. Must be a valid year (2000-2100).");
    } else {
      filters.tournamentSeason = year;
    }
  }

  // Optional: matchFormat
  const matchFormat = params.get('matchFormat');
  if (matchFormat && !VALID_MATCH_FORMATS.includes(matchFormat as any)) {
    errors.push(`Invalid 'matchFormat'. Must be one of: ${VALID_MATCH_FORMATS.join(', ')}`);
  } else if (matchFormat) {
    filters.matchFormat = matchFormat as LeaderboardFilters['matchFormat'];
  }

  // Optional: eventCategory
  const eventCategory = params.get('eventCategory');
  if (eventCategory && !VALID_MATCH_TYPES.includes(eventCategory as any)) {
    errors.push(`Invalid 'eventCategory'. Must be one of: ${VALID_MATCH_TYPES.join(', ')}`);
  } else if (eventCategory) {
    filters.eventCategory = eventCategory as LeaderboardFilters['eventCategory'];
  }

  // Optional: limit
  const limit = params.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push("Invalid 'limit'. Must be a number between 1 and 1000.");
    } else {
      filters.limit = limitNum;
    }
  }

  // Optional: skip
  const skip = params.get('skip');
  if (skip) {
    const skipNum = parseInt(skip, 10);
    if (isNaN(skipNum) || skipNum < 0) {
      errors.push("Invalid 'skip'. Must be a non-negative number.");
    } else {
      filters.skip = skipNum;
    }
  }

  return {
    filters: filters as LeaderboardFilters,
    errors,
  };
}

/**
 * Calculate date range based on timeRange parameter or custom dates
 */
export function getDateRange(filters: LeaderboardFilters): DateRange | null {
  const now = new Date();
  let from: Date;
  let to: Date = new Date(now);

  // If custom dates provided, use those
  if (filters.dateFrom && filters.dateTo) {
    from = new Date(filters.dateFrom);
    to = new Date(filters.dateTo);
    // Set to end of day for 'to'
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  // If custom dateFrom only, use it to now
  if (filters.dateFrom) {
    from = new Date(filters.dateFrom);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  // If custom dateTo only, use beginning of time to dateTo
  if (filters.dateTo) {
    from = new Date(0); // Beginning of epoch
    to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  // Use timeRange if provided
  if (filters.timeRange) {
    switch (filters.timeRange) {
      case 'all_time':
        return null; // No date filter
      
      case 'this_year':
        from = new Date(now.getFullYear(), 0, 1); // January 1st
        from.setHours(0, 0, 0, 0);
        return { from, to };
      
      case 'this_month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        return { from, to };
      
      default:
        return null;
    }
  }

  // Default: all time
  return null;
}

/**
 * Get default pagination values
 */
export function getPaginationDefaults(): { limit: number; skip: number } {
  return {
    limit: 50,
    skip: 0,
  };
}


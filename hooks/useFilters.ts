/**
 * useFilters Hook
 *
 * Shared hook for managing filter state with debounced search
 * and URL query param building for server-side filtering.
 */

import { useState, useEffect, useMemo, useCallback } from "react";

// Generic filter state that can be extended
export interface BaseFilterState {
  search?: string;
  [key: string]: string | undefined;
}

export interface UseFiltersOptions<T extends BaseFilterState> {
  initialFilters: T;
  debounceMs?: number;
}

export interface UseFiltersReturn<T extends BaseFilterState> {
  filters: T;
  debouncedSearch: string;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (updates: Partial<T>) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
  buildQueryParams: (pagination?: { limit: number; skip: number }) => URLSearchParams;
}

/**
 * Hook for managing filter state with debounced search
 *
 * @example
 * ```tsx
 * const { filters, debouncedSearch, setFilter, clearAll, buildQueryParams } = useFilters({
 *   initialFilters: { search: "", status: "all", type: "all" },
 *   debounceMs: 300
 * });
 * ```
 */
export function useFilters<T extends BaseFilterState>({
  initialFilters,
  debounceMs = 300,
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || "");
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.search, debounceMs]);

  // Set a single filter value
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple filter values at once
  const setFilters = useCallback((updates: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear all filters to initial state
  const clearAll = useCallback(() => {
    setFiltersState(initialFilters);
    setDebouncedSearch(initialFilters.search || "");
  }, [initialFilters]);

  // Check if any filters are active (not default/empty)
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initialValue = initialFilters[key as keyof T];
      // Consider "all" as default/inactive
      if (value === "all" && initialValue === "all") return false;
      // Consider empty string as inactive
      if (value === "" && (initialValue === "" || initialValue === undefined)) return false;
      // Compare with initial value
      return value !== initialValue;
    });
  }, [filters, initialFilters]);

  // Build URLSearchParams from current filters
  const buildQueryParams = useCallback(
    (pagination?: { limit: number; skip: number }): URLSearchParams => {
      const params = new URLSearchParams();

      // Add pagination
      if (pagination) {
        params.set("limit", pagination.limit.toString());
        params.set("skip", pagination.skip.toString());
      }

      // Add filters (skip empty and "all" values)
      Object.entries(filters).forEach(([key, value]) => {
        // Use debounced search instead of raw search
        if (key === "search") {
          if (debouncedSearch && debouncedSearch.trim()) {
            params.set("search", debouncedSearch.trim());
          }
          return;
        }

        if (value && value !== "all" && value !== "") {
          params.set(key, value);
        }
      });

      return params;
    },
    [filters, debouncedSearch]
  );

  return {
    filters,
    debouncedSearch,
    setFilter,
    setFilters,
    clearAll,
    hasActiveFilters,
    buildQueryParams,
  };
}

// ============================================
// Pre-configured filter hooks for each page
// ============================================

// Individual Matches filter state
export interface IndividualMatchFilters extends BaseFilterState {
  search: string;
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const useIndividualMatchFilters = (debounceMs = 300) => {
  return useFilters<IndividualMatchFilters>({
    initialFilters: {
      search: "",
      type: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
    },
    debounceMs,
  });
};

// Team Matches filter state
export interface TeamMatchFilters extends BaseFilterState {
  search: string;
  format: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const useTeamMatchFilters = (debounceMs = 300) => {
  return useFilters<TeamMatchFilters>({
    initialFilters: {
      search: "",
      format: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
    },
    debounceMs,
  });
};

// Teams filter state
export interface TeamsFilters extends BaseFilterState {
  search: string;
  city: string;
  sortBy: string;
}

export const useTeamsFilters = (debounceMs = 300) => {
  return useFilters<TeamsFilters>({
    initialFilters: {
      search: "",
      city: "all",
      sortBy: "name",
    },
    debounceMs,
  });
};

// Tournaments filter state
export interface TournamentsFilters extends BaseFilterState {
  query: string;
  status: string;
  format: string;
  sort: string;
  dateFrom: string;
  dateTo: string;
}

export const useTournamentsFilters = (debounceMs = 300) => {
  return useFilters<TournamentsFilters>({
    initialFilters: {
      query: "",
      status: "all",
      format: "all",
      sort: "recent",
      dateFrom: "",
      dateTo: "",
    },
    debounceMs,
  });
};


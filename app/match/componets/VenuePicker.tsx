"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchVenuesByCity } from "@/lib/location/searchVenuesByCity";

type VenuePickerProps = {
  city: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
};

export default function VenuePicker({
  city,
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Search venue",
}: VenuePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [venueOptions, setVenueOptions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const hasCity = city.trim().length > 0;
    if (!hasCity) {
      setVenueOptions([]);
      setIsLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const venues = await searchVenuesByCity(city, value);
        setVenueOptions(venues);
      } catch {
        setVenueOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [city, value]);

  function pickVenue(name: string) {
    onChange(name);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === "ArrowDown" && venueOptions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % venueOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? venueOptions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && venueOptions[activeIndex]) {
      event.preventDefault();
      pickVenue(venueOptions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const hasCity = city.trim().length > 0;
  const canSuggest = hasCity && venueOptions.length > 0;
  const noVenueFound = hasCity && !isLoading && venueOptions.length === 0;

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={onBlur}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-3"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          disabled={!city.trim()}
        />

        {isOpen && canSuggest && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md">
            <ul className="max-h-56 overflow-auto py-1">
              {venueOptions.map((venue, index) => (
                <li key={venue}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                      activeIndex === index && "bg-muted",
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pickVenue(venue);
                    }}
                  >
                    {venue}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading venue suggestions...
        </p>
      ) : null}
      {!hasCity ? (
        <p className="text-xs text-muted-foreground">Select city first to see venue suggestions.</p>
      ) : null}
      {noVenueFound ? (
        <p className="text-xs text-muted-foreground">
          No venue suggestions found right now. You can still type venue manually.
        </p>
      ) : null}
    </div>
  );
}

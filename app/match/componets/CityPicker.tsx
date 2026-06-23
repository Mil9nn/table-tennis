"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchCities } from "@/lib/cities/city-list";
import { getCurrentPosition } from "@/lib/location/getCurrentPosition";
import { getNearestCity } from "@/lib/location/getNearestCity";
import { reverseGeocodeCity } from "@/lib/location/reverseGeocodeCity";

type CityPickerProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
};

export default function CityPicker({
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Select city",
}: CityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [permissionState, setPermissionState] = useState<
    PermissionState | "unsupported" | "unknown"
  >("unknown");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const cityOptions = useMemo(() => searchCities(value, 8), [value]);

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
    let permissionStatus: PermissionStatus | null = null;

    async function loadPermissionState() {
      if (typeof window === "undefined" || !navigator.permissions?.query) {
        setPermissionState("unsupported");
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        setPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus?.state ?? "unknown");
        };
      } catch {
        setPermissionState("unknown");
      }
    }

    loadPermissionState();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  function pickCity(name: string) {
    onChange(name);
    setIsOpen(false);
    setActiveIndex(-1);
    setLocationError("");
    setLocationHint("");
  }

  async function useMyLocation() {
    setIsLocating(true);
    setLocationError("");
    setLocationHint("");
    try {
      const position = await getCurrentPosition();
      let selectedCity = "";

      try {
        const geocode = await reverseGeocodeCity(position.lat, position.lng);
        if (geocode.city) {
          selectedCity = geocode.city;
        }
      } catch {
        selectedCity = "";
      }

      if (!selectedCity) {
        const nearestCity = getNearestCity(position);
        selectedCity = nearestCity?.name || "";
      }

      if (!selectedCity) {
        setLocationError("Could not find a nearby city. Please type it manually.");
        return;
      }

      pickCity(selectedCity);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not get location";
      setLocationError(errorMessage);

      if (errorMessage.includes("denied")) {
        setPermissionState("denied");
        setLocationHint("Location is blocked in browser. Tap the lock icon in the address bar, allow location, then try again.");
      } else if (errorMessage.includes("device settings")) {
        setLocationHint("Browser permission is okay, but system location is off. Turn on Windows Location and browser location access, then try again.");
      } else if (errorMessage.includes("HTTPS or localhost")) {
        setLocationHint("Open this app on localhost or HTTPS. Browsers block location on insecure pages.");
      } else if (permissionState === "prompt") {
        setLocationHint("Check your browser for a location permission popup and click Allow.");
      }
    } finally {
      setIsLocating(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === "ArrowDown" && cityOptions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % cityOptions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? cityOptions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && cityOptions[activeIndex]) {
      event.preventDefault();
      pickCity(cityOptions[activeIndex].name);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="space-y-2">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        />

        {isOpen && cityOptions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md">
            <ul className="max-h-56 overflow-auto py-1">
              {cityOptions.map((city, index) => (
                <li key={city.name}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                      activeIndex === index && "bg-muted",
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pickCity(city.name);
                    }}
                  >
                    {city.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={useMyLocation}
        disabled={isLocating}
        className="w-full justify-center"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
        {permissionState === "denied" ? "Try location again" : "Use my location"}
      </Button>

      {locationError ? (
        <p className="text-xs text-destructive">{locationError}</p>
      ) : null}
      {locationHint ? <p className="text-xs text-muted-foreground">{locationHint}</p> : null}
    </div>
  );
}

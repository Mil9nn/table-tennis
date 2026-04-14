export type PositionResult = {
  lat: number;
  lng: number;
};

function getPositionErrorMessage(
  error: GeolocationPositionError,
  permissionState?: PermissionState | "unknown",
): string {
  if (error.code === error.PERMISSION_DENIED) {
    if (permissionState === "granted") {
      return "Location access is blocked by device settings. Turn on system location and try again.";
    }
    return "Location permission denied in browser";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Location not available";
  }
  if (error.code === error.TIMEOUT) {
    return "Location request timed out";
  }
  return "Unable to get your location";
}

export async function getCurrentPosition(): Promise<PositionResult> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported in this browser");
  }

  if (!window.isSecureContext) {
    throw new Error("Location requires HTTPS or localhost");
  }

  let permissionState: PermissionState | "unknown" = "unknown";
  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      permissionState = status.state;
    } catch {
      permissionState = "unknown";
    }
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(getPositionErrorMessage(error, permissionState)));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}

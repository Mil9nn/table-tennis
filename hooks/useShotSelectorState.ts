import { useReducer, useCallback } from "react";
import {
  ShotSelectorState,
  ShotSelectorAction,
  SelectionStep,
} from "@/types/shot-selector.types";
import { Stroke, ServeType } from "@/types/shot.type";

const initialState: ShotSelectorState = {
  currentStep: "player",
  selectedShot: null,
  selectedServeType: null,
  originPoint: null,
  landingPoint: null,
  isSubmitting: false,
  error: null,
};

function shotSelectorReducer(
  state: ShotSelectorState,
  action: ShotSelectorAction
): ShotSelectorState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step, error: null };

    case "SELECT_SHOT":
      return {
        ...state,
        selectedShot: action.shot,
        error: null,
      };

    case "SELECT_SERVE_TYPE":
      return {
        ...state,
        selectedServeType: action.serveType,
        error: null,
      };

    case "SET_ORIGIN":
      return {
        ...state,
        originPoint: action.point,
        error: null,
      };

    case "SET_LANDING":
      return {
        ...state,
        landingPoint: action.point,
        error: null,
      };

    case "GO_BACK":
      // Handle back navigation logic
      if (state.currentStep === "landing") {
        return {
          ...state,
          currentStep: "origin",
          landingPoint: null,
          error: null,
        };
      } else if (state.currentStep === "origin") {
        // If we came from serveType step, go back there
        if (state.selectedShot === "serve_point") {
          return {
            ...state,
            currentStep: "serveType",
            originPoint: null,
            error: null,
          };
        } else {
          return {
            ...state,
            currentStep: "shot",
            originPoint: null,
            error: null,
          };
        }
      } else if (state.currentStep === "serveType") {
        return {
          ...state,
          currentStep: "shot",
          selectedServeType: null,
          error: null,
        };
      } else if (state.currentStep === "shot") {
        return {
          ...state,
          currentStep: "player",
          selectedShot: null,
          error: null,
        };
      }
      return state;

    case "RESET":
      return initialState;

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };

    case "SET_ERROR":
      return { ...state, error: action.error, isSubmitting: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

export function useShotSelectorState(
  needsPlayerSelection: boolean,
  onStepChange?: (step: SelectionStep) => void
) {
  const [state, dispatch] = useReducer(shotSelectorReducer, initialState);

  const setStep = useCallback(
    (step: SelectionStep) => {
      dispatch({ type: "SET_STEP", step });
      onStepChange?.(step);
    },
    [onStepChange]
  );

  const selectShot = useCallback(
    (shot: Stroke) => {
      dispatch({ type: "SELECT_SHOT", shot });
      // Auto-advance to serveType if serve, otherwise to origin
      if (shot === "serve_point") {
        setStep("serveType");
      } else {
        setStep("origin");
      }
    },
    [setStep]
  );

  const selectServeType = useCallback(
    (serveType: ServeType) => {
      dispatch({ type: "SELECT_SERVE_TYPE", serveType });
      setStep("origin");
    },
    [setStep]
  );

  const setOrigin = useCallback(
    (point: { x: number; y: number }) => {
      dispatch({ type: "SET_ORIGIN", point });
      setStep("landing");
    },
    [setStep]
  );

  const setLanding = useCallback((point: { x: number; y: number }) => {
    dispatch({ type: "SET_LANDING", point });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: "SET_SUBMITTING", isSubmitting });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Initialize step based on needsPlayerSelection
  const initializeStep = useCallback(() => {
    if (!needsPlayerSelection) {
      setStep("shot");
    } else {
      setStep("player");
    }
  }, [needsPlayerSelection, setStep]);

  return {
    state,
    actions: {
      setStep,
      selectShot,
      selectServeType,
      setOrigin,
      setLanding,
      goBack,
      reset,
      setSubmitting,
      setError,
      clearError,
      initializeStep,
    },
  };
}



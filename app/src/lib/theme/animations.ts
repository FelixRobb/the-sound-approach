import { Animation } from "./types";

// Animation configuration
export const animation: Animation = {
  scale: 1.0,
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
};

// Animation utility functions
export const getAnimationDuration = (speed: keyof Animation["duration"]): number => {
  return animation.duration[speed];
};

export const getAnimationEasing = (type: keyof Animation["easing"]): string => {
  return animation.easing[type];
};

// Common animation configurations
export const createAnimationConfig = () => {
  return {
    // Fade animations
    fade: {
      in: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
      },
      out: {
        duration: animation.duration.fast,
        easing: animation.easing.easeOut,
      },
    },
    // Scale animations
    scale: {
      in: {
        duration: animation.duration.normal,
        easing: animation.easing.easeOut,
      },
      out: {
        duration: animation.duration.fast,
        easing: animation.easing.easeIn,
      },
      press: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
      },
    },
    // Slide animations
    slide: {
      in: {
        duration: animation.duration.normal,
        easing: animation.easing.easeOut,
      },
      out: {
        duration: animation.duration.normal,
        easing: animation.easing.easeIn,
      },
    },
    // Bounce animations
    bounce: {
      in: {
        duration: animation.duration.slow,
        easing: animation.easing.easeOut,
      },
      out: {
        duration: animation.duration.normal,
        easing: animation.easing.easeIn,
      },
    },
  };
};

// Component-specific animations
export const createComponentAnimations = () => {
  return {
    // Button animations
    button: {
      press: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 0.95,
      },
      release: {
        duration: animation.duration.fast,
        easing: animation.easing.easeOut,
        scale: 1.0,
      },
      hover: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
        scale: 1.02,
      },
    },
    // Card animations
    card: {
      appear: {
        duration: animation.duration.normal,
        easing: animation.easing.easeOut,
        scale: 1.0,
        opacity: 1,
      },
      disappear: {
        duration: animation.duration.fast,
        easing: animation.easing.easeIn,
        scale: 0.95,
        opacity: 0,
      },
      lift: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
        scale: 1.02,
      },
    },
    // Input animations
    input: {
      focus: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
      },
      blur: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
      },
      error: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
      },
    },
    // Navigation animations
    navigation: {
      push: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
      },
      pop: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
      },
      modal: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
      },
    },
  };
};

// Interactive animation states
export const createInteractiveAnimations = () => {
  return {
    // Pressable states
    pressable: {
      default: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 1.0,
      },
      pressed: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 0.95,
      },
      hovered: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
        scale: 1.02,
      },
      focused: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 1.0,
      },
    },
    // Draggable states
    draggable: {
      default: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 1.0,
      },
      dragging: {
        duration: animation.duration.fast,
        easing: animation.easing.easeInOut,
        scale: 1.05,
      },
      dropped: {
        duration: animation.duration.normal,
        easing: animation.easing.easeOut,
        scale: 1.0,
      },
    },
    // Expandable states
    expandable: {
      collapsed: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
        height: 0,
      },
      expanded: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
        height: "auto",
      },
      animating: {
        duration: animation.duration.normal,
        easing: animation.easing.easeInOut,
      },
    },
  };
};

// Animation presets for common use cases
export const animationPresets = {
  // Quick feedback animations
  quick: {
    duration: animation.duration.fast,
    easing: animation.easing.easeInOut,
  },
  // Smooth transitions
  smooth: {
    duration: animation.duration.normal,
    easing: animation.easing.easeInOut,
  },
  // Dramatic animations
  dramatic: {
    duration: animation.duration.slow,
    easing: animation.easing.easeInOut,
  },
  // Bouncy animations
  bouncy: {
    duration: animation.duration.slow,
    easing: animation.easing.easeOut,
  },
  // Snappy animations
  snappy: {
    duration: animation.duration.fast,
    easing: animation.easing.easeOut,
  },
};

// Utility functions for common animation patterns
export const animations = {
  // Create staggered animation delays
  createStaggeredDelays: (count: number, delay: number = 50) => {
    return Array.from({ length: count }, (_, index) => index * delay);
  },

  // Create spring-like animation
  createSpringAnimation: () => ({
    duration: animation.duration.slow,
    easing: animation.easing.easeOut,
    // Note: In React Native, you might want to use react-native-reanimated for true spring animations
  }),

  // Create loop animation
  createLoopAnimation: (loopCount: number = -1) => ({
    duration: animation.duration.normal,
    easing: animation.easing.easeInOut,
    loopCount,
  }),

  // Create sequence animation
  createSequenceAnimation: (animations: Array<{ duration: number; easing: string }>) => ({
    animations,
    totalDuration: animations.reduce((total, anim) => total + anim.duration, 0),
  }),
};

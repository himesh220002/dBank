// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-sprinkle': {
          '0%': { opacity: 0, transform: 'translateX(-20px) scale(0.95)' },
          '10%': { opacity: 1, transform: 'translateX(0) scale(1)' },
          '90%': { opacity: 1, transform: 'translateX(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateX(20px) scale(1.05)' },
        },
      },
      animation: {
        'fade-sprinkle': 'fade-sprinkle 1.5s ease-in-out forwards',
        'fade-sprinkle-slow': 'fade-sprinkle 15s ease-in-out forwards',
      },
      colors: {
        'light-yellow': '#fff9c4',
      },
    },
  },
};

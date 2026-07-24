// config.js
// This file automatically detects the environment and sets the API URL accordingly.
// When running locally, it defaults to localhost:5000.
// When deployed on Vercel/Netlify, set VITE_API_URL in their environment variables settings to point to your Render backend URL.

export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

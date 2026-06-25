export const PORT = 4000;
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://dgits.online' 
  : `http://localhost:${PORT}`;
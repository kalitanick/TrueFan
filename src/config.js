//Constants for Spotify Authentication Calls
export const authEndpoint = "https://accounts.spotify.com/authorize";
export const clientId = process.env.REACT_APP_CLIENT_ID;
export const redirectUri = process.env.REACT_APP_REDIRECT_URI;
//Spotify user scopes to create and modify playlists
export const scopes = [
    "playlist-modify-private",
    "playlist-modify-public"
];
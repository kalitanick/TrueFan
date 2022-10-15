//Constants for Spotify Authentication Calls
export const authEndpoint = "https://accounts.spotify.com/authorize";
export const clientId = process.env.CLIENT_ID;
export const redirectUri = "https://truefanplaylist.com/redirect#";
//Spotify user scopes to create and modify playlists
export const scopes = [
    "playlist-modify-private",
    "playlist-modify-public"
];
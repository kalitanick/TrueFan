//Helper class to call spotify API's
export var token;
export var baseUrl = "https://api.spotify.com/v1";
export var proxyUrl = "https://cors-anywhere.herokuapp.com/";
var songLengthThreshold = 30000; //30 seconds
var upperLivenessThreshold = .8;
var lowerLivenessThreshold = .2;
export function setToken(newToken) {
    token = newToken;
}

var searchedArtist = "";
//Main function which takes in the artist name and token and returns array of tracks from least to most popular
//artistName String to search for
//token spotify api token
//filterLive boolean to filter out live songs from the result
//filterShort boolean to filter out short songs from the result
export async function getArtistLeastPopularTracks(artistName, token, filterLive, filterShort) {
    setToken(token);
    //Adding object which we add the properties to. Needs more thought if this is the best approach
    let searchResult = {};
    let searchArtistResponse = await searchArtist(artistName);
    //Search returned no artists
    if (searchArtistResponse.items.length === 0) return 0;
    searchResult.artistName = searchArtistResponse.items[0].name;
    searchResult.artistId = searchArtistResponse.items[0].id;
    searchResult.artistImage = searchArtistResponse.items[0].images[0].url; //Images has 3 images with different resolutions
    let albumIds = await getArtistAlbums(searchResult.artistId);
    let trackIds = await getManyAlbumsTracks(albumIds);
    //Contains track info but missing liveness attribute
    let basicTracksResult = await getAllTrackInfo(trackIds);
    //Contains all relevant track information
    let tracks = await getAllTrackAudioFeatures(basicTracksResult);
    //Filter tracks out depending on filters set
    tracks = filterSongs(tracks, filterLive, filterShort);
    //Sort the tracks from least to most popular
    tracks.sort((t1, t2) => (t1.popularity > t2.popularity) ? 1 : -1);
    searchResult.tracks = tracks;
    return searchResult;
}

export async function createLeastPopularPlaylist(token, artistName, tracks) {
    setToken(token);
    let userInfo = await getUserInformation();
    let userId = userInfo.id;
    //Need to both create a playlist and then add the songs to it
    let createPlaylistResponse = await createPlaylist(userId, artistName);
    let addTracksToPlayListResponse = await addTracksToPlaylist(createPlaylistResponse.id, tracks);
    return userId;
}


///////////////////////
//Spotify Get methods//
///////////////////////
function getUserInformation() {
    return callSpotifyAPI("/me");
}

//Given a String searches spotify for an artist with the closest matching name
function searchArtist(artistName) {
    return callSpotifyAPI("/search", { q: artistName, type: "artist" })
        .then((res) => {
            return res.artists;
        });
}

//Given an artistId returns array of album objects
function getArtistAlbums(artistId) {
    return callSpotifyAPI("/artists/" + artistId + "/albums")
        .then((res) => {
            return res.items.map((album) => album.id);
        });
}

//Given array of album ids returns array of album objects with track details
function getManyAlbumsTracks(albumIds) {
    let options = { ids: albumIds.join() }
    return callSpotifyAPI("/albums", options)
        .then((res) => {
            return extractTracksFromAllAlbums(res.albums);
        });
}
//Breaks down the input into sets of 50 or less and calls getBatchTrackInfo
async function getAllTrackInfo(allTrackIds) {
    //Split trackId array into chunks of 50
    let trackIdArrays = splitArray(allTrackIds, 50);
    let trackRequests = await trackIdArrays.map((trackIdChunk) => {
        return getBatchTrackInfo(trackIdChunk);
    });
    let tracks = await Promise.all(trackRequests);
    //Flatten our search results into one array
    let newTrackInfo = [].concat(...tracks);
    return newTrackInfo;
}

//Given an array of trackIds returns object of detailed track info. Limit 50
async function getBatchTrackInfo(trackIds) {
    let options = { ids: trackIds.join() }
    return callSpotifyAPI("/tracks", options)
        .then((res) => {
            return res.tracks;
        });
}

//Breaks down input into sets of 100 or less and calls getBatchTrackAudioFeatures and combines the relevant information into one array
async function getAllTrackAudioFeatures(tracks) {
    let trackObjectArrays = splitArray(tracks, 100);
    let trackAudioFeatureRequests = await trackObjectArrays.map((trackObjectsChunk) => {
        return getBatchTrackAudioFeatures(trackObjectsChunk);
    });
    let trackAudioFeatures = await Promise.all(trackAudioFeatureRequests);
    //Flatten our search results into one array
    let trackFlatAudioFeatures = [].concat(...trackAudioFeatures);
    return combineTrackInfromation(tracks, trackFlatAudioFeatures);
}

//Given an array of track objects returns object of detailed track info. Limit 100
function getBatchTrackAudioFeatures(tracks) {
    //Extract string of trackIds from input
    let trackIds = tracks.map((track) => track.id).join(",");
    let options = { ids: trackIds };
    return callSpotifyAPI("/audio-features", options, false)
        .then((res) => {
            return res.audio_features;
        });
}

//Wrapper method to call spotify GET endpoints
//Takes the endpoint and any necesssary options for the request
export function callSpotifyAPI(endpoint, options, noCors) {
    let url = new URL(baseUrl + endpoint);
    let corsMode = noCors ? "no-cors" : "cors";
    if (options) {
        Object.keys(options).forEach(key => url.searchParams.append(key, options[key]));
    }
    return fetch(url, {
        method: "GET",
        mode: corsMode,
        headers: { "Authorization": "Bearer " + token }
    })
        .then(res => res.json())
        .then(
            (result) => {
                return result;
            }
        )
}

///////////////////////
//Spotify POST methods/
///////////////////////
function createPlaylist(userId, artistName) {
    artistName = ((artistName.charAt(artistName.length - 1) === 's') ? artistName + "'" : artistName + "'s");
    let playlistName = artistName + " least popular tracks";
    let isPublic = false;
    let isCollaborative = false;
    let playlistDescription = "Playlist created automatically by TrueFanPlaylist.com";
    let bodyParams = { name: playlistName, public: isPublic, collaborative: isCollaborative, description: playlistDescription };
    return postSpotifyAPI("/users/" + userId + "/playlists", bodyParams)
        .then((res) => {
            return res;
        });
}

function addTracksToPlaylist(playlistId, tracks) {
    //Array of elements like: "spotify:track:<URI>",
    let spotifyTrackURIs = tracks.map((track) => {
        return "spotify:track:" + track.id;
    });
    let bodyParams = { uris: spotifyTrackURIs};
    return postSpotifyAPI("/playlists/" + playlistId + "/tracks", bodyParams)
        .then((res) => {
            return res;
        });
}

export function postSpotifyAPI(endpoint, bodyParams, noCors) {
    let url = new URL(baseUrl + endpoint);
    let corsMode = noCors ? "no-cors" : "cors";
    return fetch(url, {
        method: "POST",
        mode: corsMode,
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(bodyParams)
    })
        .then(res => res.json())
        .then(
            (result) => {
                return result;
            }
        )
}

///////////////////////
//Utility Methods    //
///////////////////////

//Given an array of tracks returns array of Track Id's associated with the input
//Deprecating this in favor of using two methods below. Theoretically it will improve performance by not checking the artist for tracks where we know for sure who the artist is.
function extractTracksFromOneAlbum(tracks) {
    let trackIds = [];
    tracks.forEach(track => {
        //For albums with 'various artists' we want to only include 
        trackIds.push(track.id)
    });
    return trackIds;
}

//Takes in an array of album objects and returns an array of Track Ids
function extractTracksFromAllAlbums(albums) {
    var trackIds = [];
    albums.forEach(album => {
        let trackObjects = album.tracks.items;
        if (album.artists[0].name === "Various Artists") {
            trackObjects = filterVariousArtistSongs(searchedArtist, trackObjects)
        }
        trackIds.push.apply(trackIds, extractTracksFromOneAlbum(trackObjects));
    })
    return trackIds;
}

//Artists may appear on records but not on all songs. This will be called on tracks by 'various artists' albums to filter out any
//tracks that are not by the given artist
function filterVariousArtistSongs(artistName, tracks) {
    return tracks.filter((track) => {
        return track.artists[0].name === artistName;
    })
}

//Takes in the filter settings and runs the appropriate filter functions
function filterSongs(tracks, filterLive, filterShort) {
    if (filterLive) {
        tracks = filterLiveSongs(tracks);
    }
    if (filterShort) {
        tracks = filterShortSongs(tracks);
    }
    return tracks;
}

//Most short songs are interludes or transitions which isn't an interesting result
function filterShortSongs(tracks) {
    return tracks.filter((track) => {
        return track.duration_ms > songLengthThreshold;
    })
}

//Filters out songs for the following criteria
//If liveness is greater than the upper threshold
//If liveness is greater than the lower threshold AND has live keywords
function filterLiveSongs(tracks) {
    return tracks.filter((track) => {
        let songLive = false;
        if (track.liveness > upperLivenessThreshold) {
            songLive = true;
            //console.log(track.name + " song was removed for being above the higher threshold: " + upperLivenessThreshold);
        }
        else if (track.liveness > lowerLivenessThreshold) {
            songLive = doesContainLiveKeywords(track.name.toLowerCase());
            if (songLive) {
                //console.log(track.name + " song was removed for being above the lower threshold and having the word live in the titel " + upperLivenessThreshold);
            }
        }
        return !songLive;
    });
}

//Returns true if the given track name contains any live keywords
function doesContainLiveKeywords(trackName) {
    let filterWords = ["live", "recorded", "performed"]
    let doesContainFilter = false;
    filterWords.forEach(filterWord => {
        if (trackName.includes(filterWord)) {
            //console.log("Track: " + trackName + " Contains filter word " + filterWord)
            doesContainFilter = true;
        }
    });
    return doesContainFilter
}

//We need both the infromation from /gettracks and /getTrackfeatures in one array. 
//This function takes in both arrays and return an array with the necessary information
function combineTrackInfromation(tracks, trackFeatures) {
    for (var i = 0; i < tracks.length; i++) {
        tracks[i].liveness = trackFeatures[i].liveness
    }
    return tracks;
}

//Helper function that takes in an array of objects and returns a nested array of the individual split into chunkSize
function splitArray(inputArray, chunkSize) {
    //Cloning input array since javascript is pass by reference for objects
    let sourceArray = [...inputArray];
    let nestedArray = [];
    let numChunks = 0;
    while (sourceArray.length != 0) {
        nestedArray[numChunks] = sourceArray.splice(0, chunkSize);
        numChunks++;
    }
    return nestedArray;
}

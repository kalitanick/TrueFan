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
//TODO: Change this method to use async await to be more readable
export function getArtistLeastPopularTracks(artistName, token, filterLive, filterShort) {
    setToken(token);
    //Adding object which we add the properties to. Needs more thought if this is the best approach
    let searchResult = {};
    return searchArtist(artistName)
        .then((res) => {
            //console.log(res);
            //Find better way to handle when a search returns no results
            if (res.items.length === 0) return 0;
            searchedArtist = res.items[0].name;
            searchResult.artistName = res.items[0].name;
            searchResult.artistId = res.items[0].id;
            searchResult.artistImage = res.items[0].images[0].url//Images has 3 images with different resolutions
            return getArtistAlbums(searchResult.artistId)
                .then((albumIds) => {
                    return getManyAlbumsTracks(albumIds)
                        .then((trackIds) => {
                            return getAllTrackInfo(trackIds)
                                .then((res) => {
                                    return getTrackAudioFeatures(res.tracks)
                                        .then((res) => {
                                            var tracks = res;
                                            tracks = filterSongs(tracks, filterLive, filterShort);
                                            //TODO: Break this up into it's own function
                                            tracks.sort((t1, t2) => (t1.popularity > t2.popularity) ? 1 : -1);
                                            searchResult.tracks = tracks; //add tracks to our search result object
                                            tracks.forEach(track => {
                                                console.log("Track Name: " + track.name + " liveness: " + track.liveness)
                                            })
                                            return searchResult;
                                        });
                                });
                        })
                });
        });

}
///////////////////////
//Spotify Get methods//
///////////////////////
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
//This will need to send calls to getBatchTrackInfo in sets of 50 songs.
//TODO: Use Promise.all to send more than 50 tracks 
function getAllTrackInfo(trackIds) {
    return getBatchTrackInfo(trackIds.splice(0, 49));
}

//Given an array of trackIds returns object of detailed track info. Limit 50
function getBatchTrackInfo(trackIds) {
    let options = { ids: trackIds.join() }
    return callSpotifyAPI("/tracks", options)
        .then((res) => {
            return res;
        });
}

//Given an array of trackIds returns many feautres about the track, here we are interested in the live
//Attribute which we will use to filter out tracks
//API Limit 100
function getTrackAudioFeatures(tracks) {
    let trackIds = tracks.map((track) => track.id).join(",");
    let options = { ids: trackIds };
    return callSpotifyAPI("/audio-features", options, false)
        .then((res) => {
            let audioFeatures = res.audio_features;
            return combineTrackInfromation(tracks, audioFeatures);
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
            console.log(track.name + " song was removed for being above the higher threshold: " + upperLivenessThreshold);
        }
        else if(track.liveness > lowerLivenessThreshold ){
            songLive = doesContainLiveKeywords(track.name.toLowerCase());
            if(songLive) {
                console.log(track.name + " song was removed for being above the lower threshold and having the word live in the titel " + upperLivenessThreshold);
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
            console.log("Track: " + trackName + " Contains filter word " + filterWord)
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

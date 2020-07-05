import React from "react"
import { useSpring, animated } from 'react-spring'
import {artistPossesiveName} from '../utils/SpotifyCalls.js'
import TrackPlayer from './TrackPlayer.js'
import './ArtistIcon.scss'

function ArtistIcon(props) {
    const tempFade = useSpring({ from: { opacity: -2 }, to: { opacity: 1 }, config: { duration: 800 } });
    return (
        <animated.div className="artist-icon" style={tempFade}>
            <div>
                <ArtistTitle artistName={props.artistName} />
            </div>
            <CreatePlaylistButton togglePlaylistCreator={props.togglePlaylistCreator} />
            <ArtistPictureAndTrack image={props.image} trackObject={props.trackObject} isLarge={props.isLarge} />
        </animated.div>
    )
}

function ArtistTitle(props) {
    return (
        <h2 className="artist-title">{artistPossesiveName(props.artistName)} Least Popular Songs</h2>
    )
}

function ArtistPictureAndTrack(props) {
    return (
        <div class="artist-picture-track" style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={props.image} alt="ArtistPicture" width="360" height="380" />
            <TrackPlayer trackObject={props.trackObject} isLarge={props.isLarge} />
        </div>
    )
}

function CreatePlaylistButton(props) {
    let buttonText = "Create Playlist"
    return (
        <div>
            <button className="spotify-button" onClick={props.togglePlaylistCreator}>
                {buttonText}
            </button>
        </div>
    )
}

export default ArtistIcon;
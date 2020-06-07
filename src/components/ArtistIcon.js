import React from "react"
import { useSpring, animated } from 'react-spring'
import TrackPlayer from './TrackPlayer.js'
import './ArtistIcon.scss'

function ArtistIcon(props) {
    const tempFade = useSpring({ from: { opacity: -2 }, to: { opacity: 1 }, config: { duration: 800 } });
    var artistName = props.artistName;
    //Handling artists names that end in 'S'
    artistName = ((artistName.charAt(artistName.length - 1) === 's') ? artistName + "'" : artistName + "'s");
    return (
        <animated.div className="ArtistIcon" style={tempFade}>
            <div>
                <h2 className="artist-title">{artistName} Least Popular Song</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={props.image} alt="ArtistPicture" width="360" height="380" />
                <TrackPlayer trackObject={props.trackObject} isLarge={props.isLarge} />
            </div>
        </animated.div>
    )
}

export default ArtistIcon;
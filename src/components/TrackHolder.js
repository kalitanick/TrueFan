//Holds all of the tracks
import React from 'react'
import { useSpring, animated } from 'react-spring'
import TrackPlayer from './TrackPlayer'
import "./TrackHolder.scss"

//Renders list of many Track's iFrames
function TrackHolder(props) {
    const tracks = props.tracks;
    const tempFade = useSpring({ from: { marginTop: -5, opacity: -2 }, to: { marginTop: 0, opacity: 1 }, config: { duration: 1600 } });
    const trackList = tracks.map((track) =>
        <TrackPlayer trackObject={track} isLarge={false} />
    );
    return (
        <animated.div className="TrackPlayerHolder" style={tempFade}>
            {trackList}
        </animated.div>
    )
}
export default TrackHolder;
import React from 'react';

//Renders the iframe for a given track
function TrackPlayer(props) {
    const height = (props.isLarge) ? "380" : "80"
    return (
        <div className="TrackPlayer">
            <iframe src={"https://open.spotify.com/embed/track/" + props.trackObject.id} width="300" height={height} frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>
        </div>
    )
}
export default TrackPlayer
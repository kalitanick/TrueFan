import React from "react";
import "./PlaylistCreatorUI.scss"
import { artistPossesiveName } from "../utils/SpotifyCalls.js"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import TextField from "@material-ui/core/TextField"
import Switch from '@material-ui/core/Switch';
import { green, blueGrey } from '@material-ui/core/colors';
import { animated } from 'react-spring'
import { Spring } from "react-spring/renderprops";
import {
    withStyles,
    ThemeProvider,
    createMuiTheme
} from "@material-ui/core";

class PlaylistCreatorUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playlist_name: artistPossesiveName(props.artistName) + " Least Popular Songs",
            is_public: true,
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(event) {
        let target = event.target;
        const name = target.name;
        let value;
        if (name === "playlist_name") {
            value = target.value;
        }
        else if (name === 'is_public') {
            value = target.checked;
        }
        this.setState({ [name]: value });
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.createPlaylist(this.state.playlist_name, this.state.is_public);
    }

    render() {
        return (
            <div className="popup">
                <Spring
                    from={{ o: 0 }}
                    to={{ o: 1 }}
                    config={{ duration: 200 }}
                >
                    {({ o }) => (
                        <animated.div
                            style={{ opacity: o }}>
                            <div className="popup_content">
                                <div className="playlist_form">
                                    <form onSubmit={this.handleSubmit}>
                                        <h3>Customize Playlist</h3>
                                        <div>
                                            <ThemeProvider theme={inputTheme}>
                                                <TextField
                                                    name="playlist_name"
                                                    label="Playlist Name"
                                                    fullWidth
                                                    value={this.state.playlist_name}
                                                    onChange={this.handleChange}
                                                />
                                            </ThemeProvider>
                                        </div>
                                        <div>
                                            <FormControlLabel
                                                className="public_toggle"
                                                name="is_public"
                                                label="Make Public"
                                                labelPlacement="top"
                                                control={<GreenSwitch height="10%" checked={this.state.is_public} onChange={this.handleChange} />}
                                            />
                                        </div>
                                        <button type="submit" className="spotify-button">Create Playlist</button>
                                        <div>
                                            <button className="spotify-cancel-button" onClick={this.props.togglePlaylistCreator}>Cancel</button>
                                        </div>

                                    </form>
                                </div>
                            </div>
                        </animated.div>
                    )}
                </Spring>

            </div>
        )
    }
}



const GreenSwitch = withStyles({
    switchBase: {
        color: 'gray',
        '&$checked': {
            color: '#1ED760',
        },
        '&$checked + $track': {
            backgroundColor: '#1ED760',
        },
    },
    checked: {},
    track: {},
})(Switch);

const inputTheme = createMuiTheme({
    palette: {
        primary: green,
        text: {
            primary: green,
            secondary: blueGrey
        }
    },
});

export default PlaylistCreatorUI;
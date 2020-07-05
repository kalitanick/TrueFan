import React from "react";
import "./PlaylistCreatorUI.scss"
import { artistPossesiveName } from "../utils/SpotifyCalls.js"
import Checkbox from "@material-ui/core/Checkbox"
import FormControlLabel from "@material-ui/core/FormControlLabel"
import TextField from "@material-ui/core/TextField"
import Switch from '@material-ui/core/Switch';
import {
    withStyles,
    ThemeProvider,
    createMuiTheme
} from "@material-ui/core";
import { green, red } from '@material-ui/core/colors';


//TODO: Remove the autocomplete suggestion of the playlist name input
//TODO: Change the color of the text in the auto search to white when unfocused
//TODO: Add more feedback for the popup, slide in or grow etc.
//TODO: Possibly let the playlist more songs than the web ui shows (could be an option in the UI)
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
        console.log("Updated state!");
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.createPlaylist(this.state.playlist_name, this.state.is_public);
    }

    render() {
        return (
            <div className="popup">
                <div className="popup_content">
                    <div className="playlist_form">
                        <form onSubmit={this.handleSubmit}>
                            <h3>Customize Playlist</h3>
                            <div>
                                <ThemeProvider theme={theme}>
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


const GreenCheckbox = withStyles({
    root: {
        color: 'grey',
        '&$checked': {
            color: '#1ED760',
        },
    },
    checked: {},
})((props) => <Checkbox color="default" {...props} />);

//TODO finish working with the theme of the input so it is readable
const oldTheme = createMuiTheme({
    input: {
        color: red
    },
    palette: {
        primary: green,
        secondary: red,
        text: {
            primary: green,
        },
        background: {
            default: green
        }
    },
});

const theme = createMuiTheme({
    palette: {
        primary: green
    }
});

export default PlaylistCreatorUI;
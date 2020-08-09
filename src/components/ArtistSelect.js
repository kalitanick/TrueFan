import React, { Component } from "react";
import { useSpring, animated } from "react-spring";
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { getArtistLeastPopularTracks, createLeastPopularPlaylist } from "../utils/SpotifyCalls"
import TrackHolder from './TrackHolder.js'
import ArtistIcon from './ArtistIcon.js'
import Sign from './Sign.js'
import FilterIcon from '../FilterIcon.png'
import PlaylistCreatorUI from "./PlaylistCreatorUI.js"
import "./ArtistSelect.scss"

class ArtistSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter_live: true,
            filter_short: true,
            filter_commentary: true,
            has_searched: false, //Has the user searched
            token: props.token, //Token for spotify calls
            artist_search: "", //String of the search when the user clicks submit
            search_text: "", //String of the search at any point in time
            //Spotify Results
            artist_name: "",
            artist_image: "",
            artist_id: "",
            least_popular_tracks: null,
            creating_playlist: false
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.updateArtistSearchState = this.updateArtistSearchState.bind(this);
        this.searchForArtist = this.searchForArtist.bind(this);
        this.togglePlaylistCreator = this.togglePlaylistCreator.bind(this);
        this.createPlaylist = this.createPlaylist.bind(this);
    };
    updateArtistSearchState(artistSearch) {
        this.setState((state) => {
            return { artist_search: artistSearch }
        });
    }
    //Search For Artist
    searchForArtist() {
        if (this.state.artist_search !== "") {
            getArtistLeastPopularTracks(this.state.artist_search,
                this.state.token,
                this.state.filter_live,
                this.state.filter_short,
                this.state.filter_commentary)
                .then((result) => {
                    //Search had no result
                    if (result === 0) {
                        this.setState({ has_searched: true })
                    }
                    else {
                        this.setState({
                            artist_name: result.artistName,
                            least_popular_tracks: result.tracks.slice(0, 10),
                            artist_id: result.artistId,
                            artist_image: result.artistImage,
                            has_searched: true
                        });
                    }
                })
        }
        else {
            this.setState({
                has_searched: true
            });
        }
    }

    //When the user selects 'Create Playlist'
    //Have this bring up a form for the user to fill out
    togglePlaylistCreator() {
        this.setState({
            creating_playlist: !this.state.creating_playlist
        });
    }

    createPlaylist(playlistName, isPublic) {
        createLeastPopularPlaylist(
            this.state.token,
            this.state.artist_name,
            this.state.least_popular_tracks,
            playlistName,
            isPublic);
        this.togglePlaylistCreator();
    }

    //User hit submit on artist search
    async handleSubmit(event) {
        //Prevents webpage from reloading on submit
        event.preventDefault();
        let searchText = this.state.search_text;
        this.setState({
            //Reset Current artist state to reload component animations upon subsequent searches
            artistName: null,
            least_popular_tracks: null,
            artist_id: null,
            artist_image: null,
            artist_search: searchText
        }, this.searchForArtist);
    }

    //Input has changed
    //Checkboxes have been temporarily removed from the UI
    handleChange(event) {
        const target = event.target;
        const name = target.name;
        let value;
        if (name === "search_text") {
            //Change was from artist search
            value = target.value
        }
        else {
            //Change was from a filter
            value = target.checked
        }
        this.setState({ [name]: value })
    }

    render() {
        return (
            <div className="ArtistSelect" style={{ backgroundColor: this.state.creating_playlist ? 'rgba(0, 0, 0, .4)' : null }}>
                <Sign />
                <form onSubmit={this.handleSubmit} autoComplete="off">
                    <div className="search-container">
                        <input
                            name="search_text"
                            type="text"
                            className="search-bar"
                            value={this.state.search_text}
                            onChange={this.handleChange} />
                        <div className="search"></div>
                    </div>

                    <div className="filters">
                        <FormControlLabel
                            className="live_filter"
                            name="filter_live"
                            label="Filter Live Tracks"
                            labelPlacement="bottom"
                            control={<GreenCheckbox height="10%" checked={this.state.filter_live} onChange={this.handleChange} />}
                        />
                        <FormControlLabel
                            className="commentary_filter"
                            name="filter_commentary"
                            label="Filter Commentary Tracks"
                            labelPlacement="bottom"
                            control={<GreenCheckbox height="10%" checked={this.state.filter_commentary} onChange={this.handleChange} />}
                        />
                    </div>
                </form>
                {this.state.creating_playlist ? <PlaylistCreatorUI
                    createPlaylist={this.createPlaylist}
                    artistName={this.state.artist_name}
                    togglePlaylistCreator={this.togglePlaylistCreator} /> : null}

                {this.state.has_searched && this.state.artist_search !== "" && this.state.artist_name === "" && (
                    <ErrorMessage errorMessage="Spotify couldn't find an artist with that name" />
                )}
                {this.state.has_searched && this.state.artist_search === "" && (
                    <ErrorMessage errorMessage="Please Enter an Artist Name" />
                )}
                {this.state.least_popular_tracks && (
                    <div>
                        <div>
                            <ArtistIcon artistName={this.state.artist_name}
                                image={this.state.artist_image}
                                trackObject={this.state.least_popular_tracks[0]}
                                isLarge={true}
                                togglePlaylistCreator={this.togglePlaylistCreator} />
                        </div>
                        <TrackHolder tracks={this.state.least_popular_tracks.slice(1)} />
                    </div>
                )}
            </div>

        );
    }
}

//Animated text to indicate something was wrong with the user input. Either nothing was returned or string was empty
function ErrorMessage(props) {
    const tempFade = useSpring({
        from: {
            opacity: 0,
            marginTop: '1%',
            color: 'DarkRed'
        },
        to: {
            opacity: 1,
            marginTop: '0%',
            color: 'Crimson'
        },
        config: { duration: 500 }
    });
    return (
        <animated.div className="ErroMessage" style={tempFade}>
            <p>{props.errorMessage}</p>
        </animated.div>
    )
}


//TODO: Reimplement filters
function SearchFilters() {
    const [props, set] = useSpring(() => ({ from: { opacity: 0 }, opacity: 1, config: { mass: 5, tension: 350, friction: 40 } }))
    return (
        <div>
            <animated.div className="filter" style={props} onMouseLeave={() => set({ opacity: 1 })}>
                <img className="filter-icon" src={FilterIcon} alt="alt" style={{ cursor: "pointer" }} onClick={() => set({ opacity: 0 })} />
            </animated.div>
        </div >
    )
}
//TODO: Reimplement filters
class FilterCheckbox extends Component {
    render() {
        return (
            <label>
                {this.props.filterLabel}
                <input
                    name={this.props.filter}
                    type="checkbox"
                    checked={this.props.checked}
                    onChange={this.props.handleChange} />
            </label>
        )
    }
}


const GreenCheckbox = withStyles({
    root: {
        color: '#1ED760',
        '&$checked': {
            color: '#1ED760'
        },
    },
    checked: {},
})((props) => <Checkbox color="default" {...props} />);

export default ArtistSelect;
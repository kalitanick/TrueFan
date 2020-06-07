import React, { Component } from "react";
import { useSpring, animated } from "react-spring";

import { getArtistLeastPopularTracks, createLeastPopularPlaylist } from "../utils/SpotifyCalls"
import TrackHolder from './TrackHolder.js'
import ArtistIcon from './ArtistIcon.js'
import Sign from './Sign.js'

import FilterIcon from '../FilterIcon.png'

import "./ArtistSelect.scss"

class ArtistSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter_live: true,
            filter_short: true,
            has_searched: false, //Has the user searched
            token: props.token, //Token for spotify calls
            artist_search: "", //String of the search when the user clicks submit
            search_text: "", //String of the search at any point in time
            //Spotify Results
            artist_name: "",
            artist_image: "",
            artist_id: "",
            least_popular_song: null,
            least_popular_tracks: null
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.updateArtistSearchState = this.updateArtistSearchState.bind(this);
        this.searchForArtist = this.searchForArtist.bind(this);
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
                this.state.filter_short)
                .then((result) => {
                    if (result === 0) {
                        this.setState({ has_searched: true })
                    }
                    else {
                        this.setState({
                            artist_name: result.artistName,
                            least_popular_tracks: result.tracks.splice(0, 10),//Starting at 1
                            least_popular_song: result.tracks[0],
                            artist_id: result.artistId,
                            artist_image: result.artistImage,
                            has_searched: true
                        });
                        //TODO: Add UI for usre to select this
                        // createLeastPopularPlaylist(this.state.token, result.artistName, this.state.least_popular_tracks).then((result) => {
                        //     console.log(result);
                        // })
                    }
                })
        }
        else {
            this.setState({
                has_searched: true
            });
        }

    }

    //User hit submit on artist search
    async handleSubmit(event) {
        //Prevents webpage from reloading on submit
        event.preventDefault();
        //Swithching to use a call back since setState is asynchronous
        let searchText = this.state.search_text;
        this.setState({
            //Reset Current artist state to reload component animations upon subsequent searches
            artistName: null,
            least_popular_song: null,
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
            <div className="ArtistSelect">
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
                        {/* TODO: Reimplement filters
                         <SearchFilters />
                         <FilterCheckbox
                             filterLabel="Filter out Live Songs"
                             handleChange={this.handleChange}
                             filter="filter_live"
                             checked={this.state.filter_live} />
                         <FilterCheckbox
                             filterLabel="Filter out Short Songs"
                             handleChange={this.handleChange}
                             filter="filter_short"
                             checked={this.state.filter_short} />
                         */}
                    </div>
                </form>

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
                                trackObject={this.state.least_popular_song}
                                isLarge={true} />
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

export default ArtistSelect;
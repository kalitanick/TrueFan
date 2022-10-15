import React, { Component } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "../../config";
import hash from "../../hash";
import ArtistSelect from "../ArtistSelect";
import SpotifyLogo from "../../SpotifyLogo.svg";
import "./App.scss"

class App extends Component {
  constructor() {
    super();
    this.state = {
      token: null
    };
  }
  componentDidMount() {
    // Set token
    let _token = hash.access_token;
    if (_token) {
      // Set token
      this.setState({
        token: _token
      });
    }
  }

  render() {
    return (
      <div className="App">
        <div className="RedirectLink">
          {!this.state.token && (
            <div>
              <img src={SpotifyLogo} className="App-logo" alt="logo" />
              <div>
                <a className="btn btn--loginApp-link"
                  href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
                    "%20"
                  )}&response_type=token&show_dialog=true`}>
                  <DisoverArtistButton />
                </a>
              </div>
            </div>
          )}
          {this.state.token && (
            <ArtistSelect
              token={this.state.token}
            />
          )}
        </div>
      </div>
    );
  }
}

function DisoverArtistButton(props) {
  let buttonText = "Discover your Artist"
  return (
    <div>
      <button className="spotify-button">
        {buttonText}
      </button>
    </div>
  )

}

export default App;
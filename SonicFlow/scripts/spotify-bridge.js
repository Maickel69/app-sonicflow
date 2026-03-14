import * as play from 'play-dl';

const spotifyUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';

async function test() {
    try {
        console.log('Testing Spotify connection...');

        // Check if it's a Spotify URL
        if (play.sp_validate(spotifyUrl) === 'playlist') {
            const playlist = await play.spotify(spotifyUrl);
            console.log('Fetching playlist:', playlist.name);
            console.log('Total Tracks:', playlist.tracks_count);

            const tracks = await playlist.all_tracks();
            console.log(`Found ${tracks.length} tracks.`);

            if (tracks.length > 0) {
                const track = tracks[0];
                console.log('First Track:', track.name, 'by', track.artists[0].name);

                // Search on YouTube
                console.log('Searching YouTube...');
                const searchResults = await play.search(`${track.artists[0].name} - ${track.name}`, { limit: 1 });
                if (searchResults.length > 0) {
                    console.log('Youtube Match:', searchResults[0].url);
                }
            }
        } else {
            console.log('URL validation failed.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();

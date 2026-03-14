import spotifyUrlInfo from 'spotify-url-info';
// pass global fetch
const { getTracks, getData } = spotifyUrlInfo(fetch);

const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';

async function run() {
    try {
        console.log('Fetching data...');
        const data = await getData(url);
        console.log('Title:', data.name);

        console.log('Fetching tracks...');
        const tracks = await getTracks(url);
        console.log(`Found ${tracks.length} tracks.`);
        if (tracks.length > 0) {
            console.log('First track object:', JSON.stringify(tracks[0], null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

run();

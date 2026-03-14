// 5. Search Artist Top Hits
app.get('/api/artist-hits', async (req, res) => {
    try {
        const { artist } = req.query;
        if (!artist) return res.status(400).json({ error: 'Artist name required' });

        console.log(`[Artist Hits] Searching for: ${artist}`);
        console.time('[Artist Hits] Time');

        let items = [];

        try {
            // Strategy 1: Search for "artist greatest hits" on YouTube
            console.log('[Artist Hits] Trying strategy 1: greatest hits search');
            const searchQuery = `ytsearch20:${artist} greatest hits`;

            const result = await youtubedl(searchQuery, {
                dumpSingleJson: true,
                flatPlaylist: true,
                noWarnings: true,
                noCheckCertificates: true,
                skipDownload: true
            });

            if (result.entries && result.entries.length > 0) {
                items = result.entries.map(item => ({
                    title: item.title,
                    url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
                    duration: item.duration,
                    thumbnail: item.thumbnails ? item.thumbnails[0].url : null,
                    author: item.uploader || item.channel
                }));
                console.log(`[Artist Hits] Found ${items.length} songs with strategy 1`);
            }
        } catch (err1) {
            console.log('[Artist Hits] Strategy 1 failed:', err1.message);
        }

        // Fallback: If no results, try "top songs"
        if (items.length === 0) {
            try {
                console.log('[Artist Hits] Trying strategy 2: top songs search');
                const topSongs = await youtubedl(`ytsearch15:${artist} top songs`, {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    noWarnings: true,
                    noCheckCertificates: true,
                    skipDownload: true
                });

                if (topSongs.entries && topSongs.entries.length > 0) {
                    items = topSongs.entries.map(item => ({
                        title: item.title,
                        url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
                        duration: item.duration,
                        thumbnail: item.thumbnails ? item.thumbnails[0].url : null,
                        author: item.uploader || item.channel
                    }));
                    console.log(`[Artist Hits] Found ${items.length} songs with strategy 2`);
                }
            } catch (err2) {
                console.log('[Artist Hits] Strategy 2 failed:', err2.message);
            }
        }

        // Final fallback: Just search for the artist name
        if (items.length === 0) {
            try {
                console.log('[Artist Hits] Trying strategy 3: artist name search');
                const artistSearch = await youtubedl(`ytsearch15:${artist}`, {
                    dumpSingleJson: true,
                    flatPlaylist: true,
                    noWarnings: true,
                    noCheckCertificates: true,
                    skipDownload: true
                });

                if (artistSearch.entries && artistSearch.entries.length > 0) {
                    items = artistSearch.entries.map(item => ({
                        title: item.title,
                        url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
                        duration: item.duration,
                        thumbnail: item.thumbnails ? item.thumbnails[0].url : null,
                        author: item.uploader || item.channel
                    }));
                    console.log(`[Artist Hits] Found ${items.length} songs with strategy 3`);
                }
            } catch (err3) {
                console.log('[Artist Hits] Strategy 3 failed:', err3.message);
                throw new Error('Could not find any songs for this artist');
            }
        }

        console.timeEnd('[Artist Hits] Time');

        if (items.length === 0) {
            return res.status(404).json({ error: 'No songs found for this artist. Try a different spelling or artist name.' });
        }

        res.json({
            title: `${artist} - Greatest Hits`,
            thumbnail: items[0]?.thumbnail || '',
            items: items
        });

    } catch (err) {
        console.error('[Artist Hits Error]', err.message);
        res.status(500).json({ error: err.message || 'Failed to fetch artist hits.' });
    }
});

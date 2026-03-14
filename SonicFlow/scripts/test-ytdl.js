import youtubedl from 'youtube-dl-exec';

const url = 'https://www.youtube.com/watch?v=q7VgkdJMT1E';

async function test() {
    try {
        console.log('Testing with current flags...');
        const info1 = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            skipDownload: true,
            extractorArgs: 'youtube:player_client=ios,web'
        });
        console.log('Success with current flags!');
    } catch (err) {
        console.error('Failed with current flags:', err.message);

        try {
            console.log('Testing without extractorArgs...');
            const info2 = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noCheckCertificates: true,
                skipDownload: true
            });
            console.log('Success without extractorArgs!');
        } catch (err2) {
            console.error('Failed without extractorArgs:', err2.message);
        }
    }
}

test();

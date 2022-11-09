const apiKey = '', // Mastodon API key
    apiPath = '',  // Mastodon server url
    axios = require('axios'),
    co = require('co'),
    formData = require('form-data'),
    fs = require('fs'),
    tweetBaseUrl = 'https://twitter.com/TWITTER_ACCOUNT_HANDLE/status/'; // If you want to link back to the original tweet

// Change the date format accordingly, if you're using the original tweet date
function getFormattedDate(dateString) {
    const date = new Date(dateString),
        year = date.getFullYear(),
        month = (1 + date.getMonth()).toString(),
        day = date.getDate().toString();
    return month + '/' + day + '/' + year;
}

async function postToMastodon(item, current, max) {
    console.log('importTweets() processing:', current, '/', max);
    if (item.tweet &&
        item.tweet.entities &&
        item.tweet.entities.media &&
        item.tweet.entities.media[0] &&
        item.tweet.entities.media[0].media_url_https) {
        await axios({
            url: item.tweet.entities.media[0].media_url_https,
            method: 'GET',
            responseType: 'stream'
        }).then((firstRes) => {
            console.log('postToMastodon() firstRes');
            const imageFileName = 'temp.jpg',                       // Change file name accordingly
                writeStream = fs.createWriteStream(imageFileName);  // Assumes you want to save the images locally
            firstRes.data.pipe(writeStream);
            writeStream.on('finish', () => {
                writeStream.end();
                const imageFormData = new formData();
                imageFormData.append('file', fs.createReadStream(imageFileName));
                let postHeaders = imageFormData.getHeaders();
                postHeaders.Authorization = 'Bearer ' + apiKey;
                axios({
                    url: '/api/v2/media',
                    baseURL: apiPath,
                    method: 'POST',
                    headers: postHeaders,
                    data: imageFormData
                }).then((secondRes) => {
                    console.log('postToMastodon() secondRes:', secondRes.data);
                    axios({
                        url: '/api/v1/statuses',
                        baseURL: apiPath,
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + apiKey
                        },
                        data: {
                            // Change the status text accordingly
                            status: item.tweet.full_text + '\n\n' + 'Originally posted on ' + getFormattedDate(item.tweet.created_at) + ': ' + tweetBaseUrl + item.tweet.id_str,
                            media_ids: [secondRes.data.id],
                            language: 'en',
                            visibility: 'public' // Change to "private" for testing
                        }
                    }).then((finalRes) => {
                        console.log('postToMastodon() text+media:', finalRes.data.url);
                    });
                });
            });
            writeStream.on('error', (err) => {
                console.log('postToMastodon() file write error:', err);
            });
        });
    } else {
        await axios({
            url: '/api/v1/statuses',
            baseURL: apiPath,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey
            },
            data: {
                // Change the status text accordingly
                status: item.tweet.full_text + '\n\n' + 'Originally posted on ' + getFormattedDate(item.tweet.created_at) + ': ' + tweetBaseUrl + item.tweet.id_str,
                language: 'en',
                visibility: 'public' // Change to "private" for testing
            }
        }).then((res) => {
            console.log('postToMastodon() text:', res.data.url);
        });
    }
}

function processTweets() {
    console.log('processTweets() start');
    const tweets = require("./tweets").filter(o => {
        // Filters out replies and retweets - change accordingly
        return o &&
            o.tweet &&
            o.tweet.full_text.substring(0, 1) !== "@" &&
            o.tweet.full_text.substring(0, 4) !== "RT @" &&
            !o.tweet.in_reply_to_user_id;
    }).reverse(); // Reverses the array to upload the oldest tweet, first
    const max = tweets.length;
    let current = 0;
    co(function* () {
        for (let item of tweets) {
            if (item) {
                current++;
                yield [
                    Promise.resolve(postToMastodon(item, current, max))
                ];
            }
        }
    }).catch((err) => {
        console.log('processTweets() error:', err);
    });
}

processTweets();
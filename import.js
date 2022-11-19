// --- Imports & Global Variables ---

const apiKey = '', // Mastodon API key.
    apiPath = '',  // Mastodon server url.
    axios = require('axios'),
    co = require('co'),
    formData = require('form-data'),
    twitterHandle = ''; // Your twitter handle, if you want to link back to the original tweet.

// --- Helper Functions ---

// Formats the "originally posted on" date to Month/Day/Year.
function getFormattedDate(dateString) {
    const date = new Date(dateString);
    return `${(1 + date.getMonth())}/${date.getDate()}/${date.getFullYear()}`;
}

// The text content of the new post. Adjust this accordingly.
function getStatusText(item) {
    return `${item.tweet.full_text}
            \n\n
            Originally posted on ${getFormattedDate(item.tweet.created_at)}
            \n
            https://twitter.com/${twitterHandle}/status/${item.tweet.id_str}`;
}

// --- Posting Sequence Functions ---

// Saves an image file to the Mastodon server.
async function saveImageToMastodon(item, postHeaders, imageFormData) {
    return await axios({
        url: '/api/v2/media',
        baseURL: apiPath,
        method: 'POST',
        headers: postHeaders,
        data: imageFormData
    }).then((res) => {
        console.log('saveImageToMastodon():', res.data.preview_url);
        return Promise.resolve(postTextWithImage(item, res.data.id));
    });
}

// For posts containing text, emojis, etc., WITH one and only one image file.
async function postTextWithImage(item, mediaId) {
    return await axios({
        url: '/api/v1/statuses',
        baseURL: apiPath,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey
        },
        data: {
            status: getStatusText(item),
            media_ids: [mediaId],
            language: 'en',
            visibility: 'public' // Change to "private" for testing.
        }
    }).then((res) => {
        console.log('postTextWithImage():', res.data.url); // The URL of the new post.
    });
}

// For posts containing text, emojis, etc., but no image file.
async function postTextOnly(item) {
    return await axios({
        url: '/api/v1/statuses',
        baseURL: apiPath,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey
        },
        data: {
            status: getStatusText(item),
            language: 'en',
            visibility: 'public' // Change to "private" for testing.
        }
    }).then((res) => {
        console.log('postTextOnly():', res.data.url); // The URL of the new post.
    });
}

// Two options covered here:
//     1. Original text-based posts WITH one and only one image file.
//     2. Original text-based posts, but no image file.
// "Original" means that your Twitter account posted the tweet first,
// not somebody else's account. Meaning, in turn, this script leaves
// out replies, retweets, etc., but they can probably be added if
// you need them.
async function postToMastodon(item, current, max) {
    console.log('postToMastodon() processing:', current, '/', max);
    // Option #1.
    if (item.tweet &&
        item.tweet.entities &&
        item.tweet.entities.media &&
        item.tweet.entities.media[0] &&
        item.tweet.entities.media[0].media_url_https) {
        return await axios({
            url: item.tweet.entities.media[0].media_url_https,
            method: 'GET',
            responseType: 'stream'
        }).then((res) => {
            const imageFormData = new formData();
            imageFormData.append('file', res.data);
            let postHeaders = imageFormData.getHeaders();
            postHeaders.Authorization = 'Bearer ' + apiKey;
            return Promise.resolve(saveImageToMastodon(item, postHeaders, imageFormData));
        });
    // Option #2.
    } else {
        return Promise.resolve(postTextOnly(item));
    }
}

// --- Entry Point ---

// Again, this script leaves out replies, retweets, etc.,
// and does not cover the use case of multiple image files.
function importTweets() {
    const tweets = require("./tweet").filter(o => {
        return o &&
            o.tweet &&
            o.tweet.full_text.substring(0, 1) !== "@" &&
            o.tweet.full_text.substring(0, 4) !== "RT @" &&
            !o.tweet.in_reply_to_user_id;
    }).reverse(); // Reverses the array to upload the oldest, first.
    const max = tweets.length;
    console.log('importTweets() filtered tweet count:', max);
    if (max < 1) {
        return;
    }
    let current = 0;
    co(function* () {
        for (let item of tweets) {
            if (item) {
                current++;
                yield [Promise.resolve(postToMastodon(item, current, max))];
            }
        }
    }).catch((err) => {
        console.log('importTweets() error:', err);
    });
}

importTweets();
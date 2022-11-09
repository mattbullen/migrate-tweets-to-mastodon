# migrate-tweets-to-mastodon

Quick and dirty code to import tweets from a Twitter account archive to a Mastodon server via Node.js.

## Steps

### 1. Pull your Twitter account's data archive

[https://help.twitter.com/en/managing-your-account/how-to-download-your-twitter-archive](https://help.twitter.com/en/managing-your-account/how-to-download-your-twitter-archive)

### 2. Find and edit the `tweet.js` file

Mostly to recast it as a `module.exports`.

### 3. Edit `index.js`

Add your Mastodon server API key, Mastodon server url, tweak the post text, etc. 

### 4. Run `index.js`

From the terminal, `node index.js`.

It's a good idea to edit `tweets.js` to only a few tweet objects before trying the full list.

## Note

I wrote this in around an hour. There is plenty that can be modified / expanded / improved. You're using this code 100% at your own risk.

If you don't own the Mastodon server, get permission, first, which you'll need for the API key.

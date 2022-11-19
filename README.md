# migrate-tweets-to-mastodon

Quick and dirty code to import tweets from a Twitter account archive to a Mastodon server via Node.js.

## Steps

### 1. Pull your Twitter account's data archive.

[https://help.twitter.com/en/managing-your-account/how-to-download-your-twitter-archive](https://help.twitter.com/en/managing-your-account/how-to-download-your-twitter-archive)

### 2. Find and edit the `tweet.js` file.

Mostly to recast it as a `module.exports`.

### 3. Edit `import.js` to fit your use case.

Add your Mastodon server API key, Mastodon server URL, tweak the sample post text, etc. 

### 4. Run `import.js` from the terminal.

From the terminal, `node import.js`.

It's a good idea to edit `tweet.js` to only a few tweet objects before trying the full list.

## Note

There is plenty here that can be modified / expanded / improved. You're using this code 100% at your own risk.

If you don't own the Mastodon server, you'll need to get permission, first, and ask for the API key.

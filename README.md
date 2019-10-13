# Live Chat Manager

A dashboard that allows me to manage incoming chat messages from YouTube and Twitch.

## Setup

### Server

```sh
cd server
npm install
cp .env.sample .env #update .env
npm run dev
```

#### Server Environment Variables

| Variable | Example | Description |
| - |:-:| -:|
| GOOGLE_API_KEY | abc123 | Google API Key to retrieve streams and chat messages from YouTube API |
| TWITCH_CLIENT_ID | abc123 | Twitch Client ID to retrieve twitch user images from Twitch API |
| YOUTUBE_CHANNEL_ID | UCLNgu_OupwoeESgtab33CCw | YouTube channel ID to list streams for |
| TWITCH_CHANNEL | #codinggarden | Twitch channel to listen for messages on |

### Client

```sh
cd client
npm install
npm run serve
```

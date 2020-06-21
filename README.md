![logo](src/assets/logo.png)

# MP3 Metadata App
[![Netlify Status](https://api.netlify.com/api/v1/badges/ccb9eead-ef6e-42f6-8e22-bab23843cf2d/deploy-status)](https://app.netlify.com/sites/dreamy-carson-29e913/deploys)

Live: https://dreamy-carson-29e913.netlify.app/

Web app to add metadata to .mp3 files, if you would like to have
additional data shown about your song (at the moment, only artwork is being tagged)
when playing, i.e. in your car player.

It is using Deezer API for fetching data, so if the song is available on Deezer,
it should be fetched. However, app will search for song by file name (and get first search result)
so name your files before uploading and avoid special and unnecessary characters. 

i.e. valid file name could be **_XXXTentacion Sad_**

Note: App is using demo proxy ([cors-anywhere.herokuapp.com](https://cors-anywhere.herokuapp.com/)) to reach Deezer API.
The number of requests is limited to 200 per 60 minutes.
Please self-host [CORS Anywhere](https://github.com/Rob--W/cors-anywhere/) if you need more quota or embed this app within your server application.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

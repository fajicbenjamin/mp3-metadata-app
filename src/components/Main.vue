<template>
  <div class="main" @dragover.prevent @drop.prevent>
    <h1>Welcome to MP3 Metadata App</h1>
    <p>
      You can use this app to add metadata to .mp3 files, if you would like to have<br>
      additional data shown about your song when playing.
    </p>
    <p>
      It is using Deezer API for fetching data, so if the song is available on Deezer,<br>
      it should be fetched. However, app will search for song by file name (and get first search result)<br>
      so name your files before uploading and avoid special and unnecessary characters.<br>
      i.e. valid file name could be <i>XXXTentacion Sad</i>
    </p>

    <p>
      Note: App is using demo proxy (<a href="https://cors-anywhere.herokuapp.com/">cors-anywhere.herokuapp.com</a>) to reach Deezer API.<br>
      The number of requests is limited to 200 per 60 minutes.<br>
      Please self-host <a href="https://github.com/Rob--W/cors-anywhere">CORS Anywhere</a> if you need more quota or embed
      this app within your server application.
    </p>

    <div class="error" v-if="responseError">{{ responseError }}</div>

    <file-upload :files="files" :songs-buffers="songsBuffers"></file-upload>

    <button class="button" @click="processList">Process</button>

    <songs-list :files="files"></songs-list>
  </div>
</template>

<script>
import ID3Writer from 'browser-id3-writer'
import { saveAs } from 'file-saver';
import FileUpload from "./FileUpload";
import SongsList from "./SongsList";

export default {
  name: 'Main',
  components: {SongsList, FileUpload},
  data: function () {
    return {
      files: [],
      songsData: [],
      songsBuffers: [],
      proxyUrl: 'https://cors-anywhere.herokuapp.com/',
      responseError: ''
    }
  },
  methods: {
    processList() {
      let promises = [];

      this.files.forEach(async (song, index) => {
        const songName = song.name.split('.').slice(0, -1).join('.');

        const promise = this.getSongDataFromDeezerApi(songName);
        promises.push(promise);

        const songData = await promise;
        this.$set(this.songsData, index, songData);
      });

      Promise.all(promises)
              .then(() => {
                this.addTags();
              })
              .catch((e) => {
                // Handle errors here
                this.responseError = `${e.message} (${e.response.statusText})`;
              });

    },
    addTags() {
      this.songsData.forEach((songData, index) => {
        if (!songData) {
          this.files[index].status = 'Not found';
          return;
        }

        this.files[index].cover = songData.cover;

        this.$http.get(this.proxyUrl + songData.cover, {
            responseType: 'arraybuffer'
        }).then(response => {
            const blob = this.writeSongWithTags(response.data, this.songsBuffers[index], songData);
            saveAs(blob, `${songData.artist.join(', ')} - ${songData.title}.mp3`);

            this.files[index].status = 'Successful!'
        })

      })
    },
    async getSongDataFromDeezerApi(songName) {
      let response = await this.$http.get(`${this.proxyUrl}https://api.deezer.com/search?q=${songName}`);

      if (!response.data.total) {
        return null
      }

      let songData = response.data.data[0];
      let coverUrl = response.data.data[0].album.cover_big;

      // to get all artists (main and featured), one more API
      // call is required. If you are tight with API calls
      // and limits you can use info from previous request (only main artist)
      // let artist = songData.artist.name
      let artist = await this.getTrackContributorsFromDeezerApi(songData.id);

      return {
        artist: artist,
        title: songData.title,
        album: songData.album.title,
        cover: coverUrl
      };
    },
    async getTrackContributorsFromDeezerApi(trackId) {
      let response = await this.$http.get(`${this.proxyUrl}https://api.deezer.com/track/${trackId}`);

      const artists = [];
      response.data.contributors.forEach(contributor => artists.push(contributor.name));

      return artists;
    },
    writeSongWithTags(imageBuffer, songBuffer, songData) {
      const buffer = Buffer.from(imageBuffer, 'base64');
      const writer = new ID3Writer(songBuffer);

      writer.setFrame('TIT2', songData.title)
              .setFrame('TPE1', songData.artist)
              .setFrame('TALB', songData.album)
              .setFrame('APIC', {
                type: 3,
                data: buffer,
                description: songData.album
      });
      writer.addTag();

      // whatever implementation is needed for saving file
      // can be returned here
      return writer.getBlob();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .button {
    background-color: #4CAF50; /* Green */
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
    -webkit-transition-duration: 0.4s; /* Safari */
    transition-duration: 0.4s;
    margin: 50px 2px 4px;
  }
  .button:hover {
    box-shadow: 0 12px 16px 0 rgba(0,0,0,0.24),0 17px 50px 0 rgba(0,0,0,0.19);
  }
  .error {
    background-color: #f8d7da;
    border-color: #f5c6cb;
    min-height: 50px;
    width: 50%;
    margin: 20px auto;
    line-height: 50px;
  }
  .main p:last-of-type {
    margin-bottom: 50px;
  }
</style>

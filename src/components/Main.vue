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
      responseError: '',
      batchSize: 10
    }
  },
  methods: {
    async processList() {
      // processing songs in batches to avoid
      // Deezer API rate limits, as well as give
      // enough time browser to download all the files

      if (this.files.length < this.batchSize)
        this.processSongs();
      else {
        let batchReady = false;

        // iterate through files and set flag to true
        // when it is reached batch size, i.e. 10
        // then process songs, set timeout to 5 seconds
        // and reset batch flag
        for (let i = 1; i <= this.files.length; i++) {
          if (i % this.batchSize === 0 || i === this.files.length)
            batchReady = true;

          if (batchReady) {
            this.processSongs(i);
            await new Promise(r => setTimeout(r, 5000));
            batchReady = false;
          }
        }
      }
    },
    processSongs(batchIndex) {
      let promises = [];

      this.files.forEach(async (song, index) => {
        // since current implementation depends on initial
        // indexes in array of all loaded files, current batch index
        // is passed to avoid processing already processed files
        if (index >= batchIndex || song.status !== 'Uploaded')
          return;

        const songName = song.name.split('.').slice(0, -1).join('.');

        const promise = this.getSongDataFromDeezerApi(songName);
        promises.push(promise);

        const songData = await promise;
        this.$set(this.songsData, index, songData);
      });

      Promise.all(promises)
              .then(() => {
                this.addTags(batchIndex);
              })
              .catch((e) => {
                // Handle errors here
                this.responseError = `${e.message} (${e.response.statusText})`;
              });

    },
    addTags(batchIndex) {
      this.songsData.forEach(async (songData, index) => {
        if (!songData) {
          this.files[index].status = 'Not found';
          return;
        }

        // since current implementation depends on initial
        // indexes in array of all loaded files, current batch index
        // is passed to avoid processing already processed files
        if (index >= batchIndex || this.files[index].status === 'Successful!')
          return;

        this.files[index].cover = songData.cover;

        let coverImageBuffer = await this.getCoverImageFromDeezer(songData.cover);

        const blob = this.writeSongWithTags(coverImageBuffer.data, this.songsBuffers[index], songData);
        saveAs(blob, `${songData.artist.join(', ')} - ${songData.title}.mp3`);
        this.files[index].status = 'Successful!'
      })
    },
    async getSongDataFromDeezerApi(songName) {
      let response = await this.makeApiCall(`/search?q=${songName}`);

      if (!response.total) {
        return null
      }

      let songData = response.data[0];
      let coverUrl = response.data[0].album.cover_big;

      let artist = await this.getTrackContributorsFromDeezerApi(songData.id);

      return {
        artist: artist,
        title: songData.title,
        album: songData.album.title,
        cover: coverUrl
      };
    },
    async getTrackContributorsFromDeezerApi(trackId) {
      let response = await this.makeApiCall(`/track/${trackId}`);

      const artists = [];
      response.contributors.forEach(contributor => artists.push(contributor.name));

      return artists;
    },
    getCoverImageFromDeezer(coverUrl) {
      return this.$http.get(coverUrl, {
        responseType: 'arraybuffer'
      });
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
    },
    makeApiCall(url) {
      return new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        DZ.api(url, (response) => {
          resolve(response)
        });
      })
    },
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

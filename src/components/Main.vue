<template>
  <div class="hello" @dragover.prevent @drop.prevent>
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

    <div class="container"
         @dragleave="fileDragOut"
         @dragover="fileDragIn"
         @drop="handleFileDrop"
         :style="{ 'background-color': color }">
      <p>
        Add your files here:
      </p>
      <div class="file-wrapper">
        <input type="file" name="file-input" multiple @change="handleFileInput">
        Click or drag to insert.
      </div>

      <ul>
        <li v-for="(file, index) in files" :key="file.name + new Date()">
          <img class="art-image" src="@/assets/placeholder.jpg" alt="cover" v-if="file.cover === ''">
          <img class="art-image" :src="file.cover" alt="cover" v-else>
          <span>{{ file.name }}</span>
          <span>
            <button @click="removeFile(index)" title="Remove">X</button>
          </span>
          <span :style="{ 'color': file.status === 'Successful!' ? 'green' : 'red' }">
            {{ file.status }}
          </span>
        </li>
      </ul>
    </div>

    <button class="button button2" style="margin-top: 50px" @click="processList">Process</button>

  </div>
</template>

<script>
import ID3Writer from 'browser-id3-writer'
import { saveAs } from 'file-saver';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data: function () {
    return {
      files: [],
      color: 'gainsboro',
      songsData: [],
      songsBuffers: [],
      proxyUrl: 'https://cors-anywhere.herokuapp.com/',
      responseError: ''
    }
  },
  methods: {
    handleFileDrop(e) {
      this.createArrayBuffer(e);
      this.fileDragOut(e);
      let droppedFiles = e.dataTransfer.files;
      if(!droppedFiles) return;
      this.getFiles(droppedFiles)
    },
    handleFileInput(e) {
      this.createArrayBuffer(e);
      let files = e.target.files;
      if(!files) return;
      this.getFiles(files)
    },
    getFiles(files) {
      ([...files]).forEach(f => {
        const object = Object.assign({
          name: f.name,
          size: f.size,
          cover: '',
          status: ''
        });
        this.files.push(object);
      });
    },
    createArrayBuffer(e) {
      const files = e.target.files === undefined ? e.dataTransfer.files : e.target.files;

      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.$set(this.songsBuffers, index, reader.result);
          // go next
        };
        // attach event, that will be fired, when read is end
        reader.onerror = function () {
          // handle error
          console.error('Reader error', reader.error);
        };

        reader.readAsArrayBuffer(file);
      });
    },
    removeFile(fileKey){
      this.files.splice(fileKey, 1)
    },
    fileDragIn() {
      this.color = 'white'
    },
    fileDragOut() {
      this.color = 'gainsboro'
    },
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

      // if you want to get images from http://
      if (coverUrl.charAt(4) === 's')
        coverUrl = coverUrl.slice(0, 4) + coverUrl.slice(5, coverUrl.length);

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
  .container {
    border: 2px dashed gray;
    min-height: 120px;
    min-width: 260px;
    margin: 0 auto;
    max-width: 50%;
  }
  .file-wrapper {
    width: 200px;
    height: 48px;
    line-height: 48px;
    position: relative;
    overflow: hidden;
    background: gray; /* and other things to make it pretty */
    margin: 0 auto;
  }
  .file-wrapper input {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
    opacity: 0.0;
    filter: alpha(opacity=0);
    height: 48px;
    width: 200px;
  }
  ul {
    list-style: none;
  }
  ul li {
    display: table;
    text-align: center;
  }
  ul li span {
    padding: 0 20px;
    display: table-cell;
    vertical-align: middle;
  }
  .art-image {
    width: 120px;
    height: 120px;
    margin-top: 10px;
  }
  .button {
    background-color: #4CAF50; /* Green */
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    -webkit-transition-duration: 0.4s; /* Safari */
    transition-duration: 0.4s;
  }
  .button2:hover {
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
</style>

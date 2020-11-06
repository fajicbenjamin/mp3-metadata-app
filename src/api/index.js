import axios from 'axios'

const getSongData = async (songName) => {
    let response = await makeApiCall(`/search?q=${songName}`);

    if (!response.total) {
        return null
    }

    let songData = response.data[0];
    let artist = await getTrackContributors(songData.id);

    return {
        artist: artist,
        title: songData.title,
        album: songData.album.title,
        cover: songData.album.cover_big
    };
};

const getTrackContributors = async (trackId) => {
    let response = await makeApiCall(`/track/${trackId}`);

    const artists = [];
    response.contributors.forEach(contributor => artists.push(contributor.name));

    return artists;
};

const getCoverImage = (coverUrl) => {
    return axios.get(coverUrl, {
        responseType: 'arraybuffer'
    });
};

const makeApiCall = (url) => {
    return new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        DZ.api(url, (response) => {
            resolve(response)
        });
    })
};

export default {
    getSongData,
    getCoverImage
}
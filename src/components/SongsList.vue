<template>
    <div class="container">
        <ul>
            <li v-for="(file, index) in files" :key="index">
                <img class="art-image" src="@/assets/placeholder.jpg" alt="cover" v-if="file.cover === ''">
                <img class="art-image" :src="file.cover" alt="cover" v-else>
                <span>{{ file.name }}</span>
                <span :style="{ 'color': statusColor(file.status) }">
                    {{ file.status }}
                </span>
                <button class="button button-outline" @click="removeFile(index)" title="Remove">&#10005;</button>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: 'SongsList',
        props: ['files'],
        data: function () {
            return {
                color: ''
            }
        },
        methods: {
            statusColor(status) {
                if (status !== 'Uploaded') {
                    return status === 'Successful!' ? 'green' : 'red';
                }

                return '';
            },
            removeFile(fileKey){
                this.files.splice(fileKey, 1)
            },
        }
    }
</script>

<style scoped>
    .container {
        min-height: 120px;
        min-width: 260px;
        margin: 0 auto;
        max-width: 50%;
    }
    ul {
        list-style: none;
        padding: 0;
    }
    ul li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        /*padding-bottom: 5px;*/
        /*border-bottom: 1px solid rgba(0, 0, 0, 0.2);*/
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
        padding: 16px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        transition-duration: 0.4s;
        cursor: pointer;
        border-radius: 15px;
    }
    .button-outline {
        background-color: white;
        color: black;
        border: 2px solid dimgray;
    }

    .button-outline:hover {
        background-color: dimgray;
        color: white;
    }
</style>
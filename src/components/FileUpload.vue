<template>
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
    </div>
</template>

<script>
    export default {
        name: 'FileUpload',
        props: ['files', 'songsBuffers'],
        data: function () {
            return {
                color: 'gainsboro'
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
                        status: 'Uploaded'
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
            fileDragIn() {
                this.color = 'white'
            },
            fileDragOut() {
                this.color = 'gainsboro'
            },
        }
    }
</script>

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
</style>
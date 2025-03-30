class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrack = 0;
        this.isPlaying = false;

        // DOM Elements
        this.fileInput = document.getElementById('fileInput');
        this.playlistElement = document.getElementById('playlist');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.querySelector('.progress');
        this.currentTimeElement = document.getElementById('currentTime');
        this.durationElement = document.getElementById('duration');
        this.songTitleElement = document.querySelector('.song-title');
        this.songArtistElement = document.querySelector('.song-artist');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input handler
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Playback controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Progress bar
        const progressContainer = document.querySelector('.progress-bar');
        progressContainer.addEventListener('click', (e) => this.seek(e));

        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const song = {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Unknown Artist',
                    url: e.target.result
                };
                this.playlist.push(song);
                this.updatePlaylist();
            };
            reader.readAsDataURL(file);
        });
    }

    updatePlaylist() {
        this.playlistElement.innerHTML = '';
        this.playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = song.name;
            li.onclick = () => this.playSong(index);
            if (index === this.currentTrack) {
                li.classList.add('active');
            }
            this.playlistElement.appendChild(li);
        });

        if (this.playlist.length === 1) {
            this.playSong(0);
        }
    }

    playSong(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrack = index;
            this.audio.src = this.playlist[index].url;
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateSongInfo();
            this.updatePlaylist();
        }
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            if (!this.audio.src) {
                this.playSong(0);
            } else {
                this.audio.play();
            }
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
    }

    playPrevious() {
        let prevTrack = this.currentTrack - 1;
        if (prevTrack < 0) prevTrack = this.playlist.length - 1;
        this.playSong(prevTrack);
    }

    playNext() {
        let nextTrack = this.currentTrack + 1;
        if (nextTrack >= this.playlist.length) nextTrack = 0;
        this.playSong(nextTrack);
    }

    updatePlayButton() {
        const icon = this.playBtn.querySelector('i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.durationElement.textContent = this.formatTime(this.audio.duration);
    }

    seek(e) {
        const progressBar = e.currentTarget;
        const clickPosition = e.offsetX / progressBar.offsetWidth;
        const seekTime = clickPosition * this.audio.duration;
        this.audio.currentTime = seekTime;
    }

    setVolume(value) {
        this.audio.volume = value / 100;
        const volumeIcon = document.querySelector('.volume-control i');
        
        if (value == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (value < 50) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    updateSongInfo() {
        const currentSong = this.playlist[this.currentTrack];
        this.songTitleElement.textContent = currentSong.name;
        this.songArtistElement.textContent = currentSong.artist;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the music player
const player = new MusicPlayer(); 
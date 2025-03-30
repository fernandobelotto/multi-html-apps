class PodcastPlayer {
    constructor() {
        this.audio = new Audio();
        this.episodes = [];
        this.currentEpisode = 0;
        this.isPlaying = false;
        this.playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        this.currentSpeedIndex = 2; // 1x speed
        this.notes = {};
        this.timestamps = {};

        // DOM Elements
        this.initializeDOMElements();
        this.initializeEventListeners();
    }

    initializeDOMElements() {
        this.fileInput = document.getElementById('fileInput');
        this.episodesList = document.getElementById('episodesList');
        this.playBtn = document.getElementById('playBtn');
        this.backwardBtn = document.getElementById('backwardBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.querySelector('.progress');
        this.currentTimeElement = document.getElementById('currentTime');
        this.durationElement = document.getElementById('duration');
        this.episodeTitleElement = document.querySelector('.episode-title');
        this.podcastNameElement = document.querySelector('.podcast-name');
        this.episodeDateElement = document.querySelector('.episode-date');
        this.episodeNotes = document.getElementById('episodeNotes');
        this.addTimestampBtn = document.getElementById('addTimestamp');
        this.timestampsList = document.getElementById('timestampsList');
    }

    initializeEventListeners() {
        // File input handler
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Playback controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.backwardBtn.addEventListener('click', () => this.skip(-15));
        this.forwardBtn.addEventListener('click', () => this.skip(30));
        this.speedBtn.addEventListener('click', () => this.changePlaybackSpeed());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Progress bar
        const progressContainer = document.querySelector('.progress-bar');
        progressContainer.addEventListener('click', (e) => this.seek(e));

        // Notes
        this.episodeNotes.addEventListener('input', () => this.saveNotes());
        this.addTimestampBtn.addEventListener('click', () => this.addTimestamp());

        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onEpisodeEnd());
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const episode = {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    podcastName: 'Local Podcast',
                    date: new Date().toLocaleDateString(),
                    url: e.target.result
                };
                this.episodes.push(episode);
                this.updateEpisodesList();
            };
            reader.readAsDataURL(file);
        });
    }

    updateEpisodesList() {
        this.episodesList.innerHTML = '';
        this.episodes.forEach((episode, index) => {
            const li = document.createElement('li');
            li.textContent = episode.name;
            li.onclick = () => this.playEpisode(index);
            if (index === this.currentEpisode) {
                li.classList.add('active');
            }
            this.episodesList.appendChild(li);
        });

        if (this.episodes.length === 1) {
            this.playEpisode(0);
        }
    }

    playEpisode(index) {
        if (index >= 0 && index < this.episodes.length) {
            this.currentEpisode = index;
            this.audio.src = this.episodes[index].url;
            this.audio.playbackRate = this.playbackSpeeds[this.currentSpeedIndex];
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateEpisodeInfo();
            this.updateEpisodesList();
            this.loadNotes();
            this.loadTimestamps();
        }
    }

    togglePlay() {
        if (this.episodes.length === 0) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            if (!this.audio.src) {
                this.playEpisode(0);
            } else {
                this.audio.play();
            }
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
    }

    skip(seconds) {
        this.audio.currentTime += seconds;
    }

    changePlaybackSpeed() {
        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.playbackSpeeds.length;
        const newSpeed = this.playbackSpeeds[this.currentSpeedIndex];
        this.audio.playbackRate = newSpeed;
        this.speedBtn.textContent = `${newSpeed}x`;
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

    updateEpisodeInfo() {
        const currentEpisode = this.episodes[this.currentEpisode];
        this.episodeTitleElement.textContent = currentEpisode.name;
        this.podcastNameElement.textContent = currentEpisode.podcastName;
        this.episodeDateElement.textContent = currentEpisode.date;
    }

    saveNotes() {
        if (this.episodes.length === 0) return;
        this.notes[this.currentEpisode] = this.episodeNotes.value;
        localStorage.setItem('podcastNotes', JSON.stringify(this.notes));
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('podcastNotes');
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
            this.episodeNotes.value = this.notes[this.currentEpisode] || '';
        }
    }

    addTimestamp() {
        if (!this.audio.src) return;

        const currentTime = this.formatTime(this.audio.currentTime);
        const note = prompt('Add a note for this timestamp:', '');
        
        if (note) {
            if (!this.timestamps[this.currentEpisode]) {
                this.timestamps[this.currentEpisode] = [];
            }

            this.timestamps[this.currentEpisode].push({
                time: this.audio.currentTime,
                timeFormatted: currentTime,
                note: note
            });

            this.updateTimestampsList();
            localStorage.setItem('podcastTimestamps', JSON.stringify(this.timestamps));
        }
    }

    loadTimestamps() {
        const savedTimestamps = localStorage.getItem('podcastTimestamps');
        if (savedTimestamps) {
            this.timestamps = JSON.parse(savedTimestamps);
            this.updateTimestampsList();
        }
    }

    updateTimestampsList() {
        this.timestampsList.innerHTML = '';
        const episodeTimestamps = this.timestamps[this.currentEpisode] || [];

        episodeTimestamps.forEach(timestamp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span onclick="player.seekToTimestamp(${timestamp.time})">
                    ${timestamp.timeFormatted} - ${timestamp.note}
                </span>
                <button onclick="player.deleteTimestamp('${timestamp.timeFormatted}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.timestampsList.appendChild(li);
        });
    }

    seekToTimestamp(time) {
        this.audio.currentTime = time;
    }

    deleteTimestamp(timeFormatted) {
        if (this.timestamps[this.currentEpisode]) {
            this.timestamps[this.currentEpisode] = this.timestamps[this.currentEpisode]
                .filter(t => t.timeFormatted !== timeFormatted);
            this.updateTimestampsList();
            localStorage.setItem('podcastTimestamps', JSON.stringify(this.timestamps));
        }
    }

    onEpisodeEnd() {
        // Don't automatically play next episode in podcast player
        this.isPlaying = false;
        this.updatePlayButton();
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the podcast player
const player = new PodcastPlayer();

// Make timestamp functions available globally
window.player = player; 
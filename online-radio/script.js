class OnlineRadio {
    constructor() {
        this.audio = new Audio();
        this.currentStation = null;
        this.volume = 1;
        this.isPlaying = false;
        this.favorites = JSON.parse(localStorage.getItem('radioFavorites') || '[]');
        
        // Sample radio stations (you can add more)
        this.stations = [
            {
                id: 1,
                name: "Smooth Jazz",
                genre: "Jazz",
                url: "https://streaming.radio.co/s774887f7b/listen",
                logo: "🎷"
            },
            {
                id: 2,
                name: "Classical Vibes",
                genre: "Classical",
                url: "https://streaming.radio.co/s5c5da6334/listen",
                logo: "🎻"
            },
            {
                id: 3,
                name: "Rock Radio",
                genre: "Rock",
                url: "https://streaming.radio.co/s3928a1fef/listen",
                logo: "🎸"
            },
            {
                id: 4,
                name: "Electronic Beats",
                genre: "Electronic",
                url: "https://streaming.radio.co/s7f06d2897/listen",
                logo: "🎹"
            }
        ];

        this.initializeElements();
        this.setupEventListeners();
        this.renderStations();
        this.renderFavorites();
        this.updateConnectionStatus('disconnected');
    }

    initializeElements() {
        // Player controls
        this.playBtn = document.getElementById('playBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeIcon = document.getElementById('volumeIcon');
        
        // Station info elements
        this.stationLogo = document.querySelector('.station-logo');
        this.stationName = document.querySelector('.station-name');
        this.stationGenre = document.querySelector('.station-genre');
        
        // Containers
        this.stationsGrid = document.querySelector('.stations-grid');
        this.favoritesGrid = document.querySelector('.favorites-grid');
        
        // Status elements
        this.connectionStatus = document.querySelector('.connection-status');
        this.audioQuality = document.querySelector('.audio-quality');
    }

    setupEventListeners() {
        // Play button
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        this.volumeIcon.addEventListener('click', () => {
            if (this.volume > 0) {
                this.lastVolume = this.volume;
                this.setVolume(0);
            } else {
                this.setVolume(this.lastVolume || 1);
            }
        });

        // Audio events
        this.audio.addEventListener('playing', () => {
            this.updatePlayButton(true);
            this.updateConnectionStatus('connected');
        });

        this.audio.addEventListener('pause', () => {
            this.updatePlayButton(false);
            this.updateConnectionStatus('disconnected');
        });

        this.audio.addEventListener('error', () => {
            this.updateConnectionStatus('error');
        });

        this.audio.addEventListener('waiting', () => {
            this.updateConnectionStatus('connecting');
        });
    }

    togglePlay() {
        if (!this.currentStation) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        this.updatePlayButton(this.isPlaying);
    }

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.volumeSlider.value = value;
        
        // Update volume icon
        if (value == 0) {
            this.volumeIcon.className = 'fas fa-volume-mute';
        } else if (value < 0.5) {
            this.volumeIcon.className = 'fas fa-volume-down';
        } else {
            this.volumeIcon.className = 'fas fa-volume-up';
        }
    }

    updatePlayButton(isPlaying) {
        this.playBtn.innerHTML = `<i class="fas fa-${isPlaying ? 'pause' : 'play'}"></i>`;
    }

    updateConnectionStatus(status) {
        const statusMap = {
            connected: { text: 'Connected', icon: 'signal', color: '#4CAF50' },
            connecting: { text: 'Connecting...', icon: 'spinner fa-spin', color: '#FFC107' },
            disconnected: { text: 'Disconnected', icon: 'signal-slash', color: '#aaa' },
            error: { text: 'Error', icon: 'exclamation-triangle', color: '#f44336' }
        };

        const statusInfo = statusMap[status];
        this.connectionStatus.innerHTML = `
            <i class="fas fa-${statusInfo.icon}" style="color: ${statusInfo.color}"></i>
            <span>${statusInfo.text}</span>
        `;
    }

    playStation(station) {
        if (this.currentStation?.id === station.id) {
            this.togglePlay();
            return;
        }

        this.currentStation = station;
        this.audio.src = station.url;
        this.audio.load();
        this.audio.play();
        this.isPlaying = true;
        
        // Update station info
        this.stationLogo.textContent = station.logo;
        this.stationName.textContent = station.name;
        this.stationGenre.textContent = station.genre;
        
        // Update active station in grid
        document.querySelectorAll('.station-card').forEach(card => {
            card.classList.toggle('active', card.dataset.stationId === station.id.toString());
        });
    }

    toggleFavorite(station) {
        const index = this.favorites.findIndex(f => f.id === station.id);
        if (index === -1) {
            this.favorites.push(station);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('radioFavorites', JSON.stringify(this.favorites));
        this.renderStations();
        this.renderFavorites();
    }

    createStationCard(station, container) {
        const isFavorite = this.favorites.some(f => f.id === station.id);
        const card = document.createElement('div');
        card.className = 'station-card';
        card.dataset.stationId = station.id;
        
        if (this.currentStation?.id === station.id) {
            card.classList.add('active');
        }

        card.innerHTML = `
            <div class="station-logo">${station.logo}</div>
            <div class="station-name">${station.name}</div>
            <div class="station-genre">${station.genre}</div>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}">
                <i class="fas fa-heart"></i>
            </button>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                this.playStation(station);
            }
        });

        card.querySelector('.favorite-btn').addEventListener('click', () => {
            this.toggleFavorite(station);
        });

        container.appendChild(card);
    }

    renderStations() {
        this.stationsGrid.innerHTML = '';
        this.stations.forEach(station => {
            this.createStationCard(station, this.stationsGrid);
        });
    }

    renderFavorites() {
        this.favoritesGrid.innerHTML = '';
        this.favorites.forEach(station => {
            this.createStationCard(station, this.favoritesGrid);
        });
    }
}

// Initialize the radio player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.radioPlayer = new OnlineRadio();
}); 
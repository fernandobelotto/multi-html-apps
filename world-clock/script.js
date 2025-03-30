// Store the clocks data in localStorage
let clocks = JSON.parse(localStorage.getItem('worldClocks')) || [
    { timezone: 'UTC', label: 'UTC (Coordinated Universal Time)' }
];

function createClockCard(timezone, label) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card clock-card shadow-sm';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';
    
    const cityElem = document.createElement('div');
    cityElem.className = 'city';
    cityElem.textContent = label;
    
    const timeElem = document.createElement('div');
    timeElem.className = 'time';
    
    const dateElem = document.createElement('div');
    dateElem.className = 'date';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        removeClock(timezone);
    };
    
    cardBody.appendChild(cityElem);
    cardBody.appendChild(timeElem);
    cardBody.appendChild(dateElem);
    card.appendChild(cardBody);
    card.appendChild(deleteBtn);
    col.appendChild(card);
    
    // Update time immediately and start interval
    updateTime(timezone, timeElem, dateElem);
    setInterval(() => updateTime(timezone, timeElem, dateElem), 1000);
    
    return col;
}

function updateTime(timezone, timeElem, dateElem) {
    const options = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const dateOptions = {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const now = new Date();
    timeElem.textContent = now.toLocaleTimeString('en-US', options);
    dateElem.textContent = now.toLocaleDateString('en-US', dateOptions);
}

function addClock(timezone, label) {
    if (!clocks.some(clock => clock.timezone === timezone)) {
        clocks.push({ timezone, label });
        localStorage.setItem('worldClocks', JSON.stringify(clocks));
        renderClocks();
    }
}

function removeClock(timezone) {
    if (timezone === 'UTC') return; // Prevent removing UTC
    clocks = clocks.filter(clock => clock.timezone !== timezone);
    localStorage.setItem('worldClocks', JSON.stringify(clocks));
    renderClocks();
}

function renderClocks() {
    const container = document.getElementById('clocksContainer');
    container.innerHTML = '';
    clocks.forEach(clock => {
        container.appendChild(createClockCard(clock.timezone, clock.label));
    });
}

// Event Listeners
document.getElementById('confirmAddClock').addEventListener('click', () => {
    const select = document.getElementById('citySelect');
    const timezone = select.value;
    const label = select.options[select.selectedIndex].text;
    addClock(timezone, label);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClockModal'));
    modal.hide();
});

// Initial render
renderClocks(); 
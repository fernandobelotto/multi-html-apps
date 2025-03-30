document.addEventListener('DOMContentLoaded', () => {
    const countrySelect = document.getElementById('countrySelect');
    const yearSelect = document.getElementById('yearSelect');
    const holidayList = document.getElementById('holidayList');
    const loading = document.getElementById('loading');
    const noHolidays = document.getElementById('noHolidays');
    const error = document.getElementById('error');

    // Available countries for the API
    const countries = [
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'CA', name: 'Canada' },
        { code: 'AU', name: 'Australia' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'ES', name: 'Spain' },
        { code: 'IT', name: 'Italy' },
        { code: 'JP', name: 'Japan' },
        { code: 'CN', name: 'China' },
        { code: 'BR', name: 'Brazil' },
        { code: 'MX', name: 'Mexico' },
        { code: 'IN', name: 'India' },
        { code: 'RU', name: 'Russia' },
        { code: 'ZA', name: 'South Africa' }
    ];

    // Populate country select
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });

    // Populate year select (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    // Format date to local string
    const formatDate = (dateString) => {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Show loading state
    const showLoading = () => {
        loading.classList.remove('hidden');
        holidayList.innerHTML = '';
        noHolidays.classList.add('hidden');
        error.classList.add('hidden');
    };

    // Hide loading state
    const hideLoading = () => {
        loading.classList.add('hidden');
    };

    // Display holidays
    const displayHolidays = (holidays) => {
        holidayList.innerHTML = '';
        
        if (holidays.length === 0) {
            noHolidays.classList.remove('hidden');
            return;
        }

        holidays.forEach(holiday => {
            const card = document.createElement('div');
            card.className = 'holiday-card';
            card.innerHTML = `
                <div class="holiday-date">${formatDate(holiday.date)}</div>
                <div class="holiday-name">${holiday.name}</div>
                <div class="holiday-type">${holiday.type || 'Public Holiday'}</div>
            `;
            holidayList.appendChild(card);
        });
    };

    // Fetch holidays from API
    const fetchHolidays = async (countryCode, year) => {
        showLoading();
        
        try {
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch holidays');
            }

            const holidays = await response.json();
            hideLoading();
            displayHolidays(holidays);
        } catch (err) {
            hideLoading();
            error.classList.remove('hidden');
            console.error('Error fetching holidays:', err);
        }
    };

    // Event listeners for country and year selection
    const handleSelectionChange = () => {
        const selectedCountry = countrySelect.value;
        const selectedYear = yearSelect.value;

        if (selectedCountry && selectedYear) {
            fetchHolidays(selectedCountry, selectedYear);
        }
    };

    countrySelect.addEventListener('change', handleSelectionChange);
    yearSelect.addEventListener('change', handleSelectionChange);

    // Initialize with default values if available
    if (countrySelect.value && yearSelect.value) {
        fetchHolidays(countrySelect.value, yearSelect.value);
    }
}); 
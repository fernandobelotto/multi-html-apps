document.addEventListener('DOMContentLoaded', () => {
    const dice = document.getElementById('dice');
    const rollButton = document.getElementById('rollButton');
    const diceType = document.getElementById('diceType');
    const diceCount = document.getElementById('diceCount');
    const rollResults = document.getElementById('rollResults');
    const totalResult = document.getElementById('totalResult');
    const rollHistory = document.getElementById('rollHistory');

    // Dice face Unicode characters for D6
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    // Function to generate a random number between 1 and max
    const rollDie = (max) => Math.floor(Math.random() * max) + 1;

    // Function to animate the dice rolling
    const animateDice = () => {
        let times = 0;
        const interval = setInterval(() => {
            dice.textContent = diceFaces[Math.floor(Math.random() * 6)];
            times++;
            if (times > 10) {
                clearInterval(interval);
            }
        }, 50);
    };

    // Function to format the timestamp
    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString();
    };

    // Function to add roll to history
    const addToHistory = (diceType, results, total) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${formatTime()} - ${results.length}d${diceType}: [${results.join(', ')}]</span>
            <span>Total: ${total}</span>
        `;
        rollHistory.insertBefore(historyItem, rollHistory.firstChild);

        // Keep only last 10 rolls in history
        if (rollHistory.children.length > 10) {
            rollHistory.removeChild(rollHistory.lastChild);
        }
    };

    // Function to roll the dice
    const rollDice = () => {
        const type = parseInt(diceType.value);
        const count = parseInt(diceCount.value);
        
        // Validate input
        if (count < 1 || count > 10) {
            alert('Please select between 1 and 10 dice');
            return;
        }

        // Animate the main dice display
        animateDice();

        // Generate results
        const results = [];
        let total = 0;

        for (let i = 0; i < count; i++) {
            const result = rollDie(type);
            results.push(result);
            total += result;
        }

        // Clear previous results
        rollResults.innerHTML = '';

        // Display new results
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'roll-result';
            resultElement.textContent = result;
            rollResults.appendChild(resultElement);
        });

        // Update total
        totalResult.textContent = total;

        // Add to history
        addToHistory(type, results, total);
    };

    // Event listeners
    rollButton.addEventListener('click', rollDice);
    dice.addEventListener('click', rollDice);

    // Handle keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            rollDice();
        }
    });

    // Initialize with a roll
    rollDice();
}); 
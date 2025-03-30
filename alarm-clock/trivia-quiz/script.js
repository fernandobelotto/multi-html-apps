// Quiz Data
const quizData = {
    general: [
        {
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correct: 2
        },
        {
            question: "Which planet is known as the Red Planet?",
            options: ["Venus", "Mars", "Jupiter", "Saturn"],
            correct: 1
        },
        {
            question: "Who painted the Mona Lisa?",
            options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
            correct: 2
        }
    ],
    science: [
        {
            question: "What is the chemical symbol for gold?",
            options: ["Ag", "Fe", "Au", "Cu"],
            correct: 2
        },
        {
            question: "What is the hardest natural substance on Earth?",
            options: ["Gold", "Iron", "Diamond", "Platinum"],
            correct: 2
        },
        {
            question: "Which gas do plants absorb from the atmosphere?",
            options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
            correct: 1
        }
    ],
    history: [
        {
            question: "In which year did World War II end?",
            options: ["1943", "1944", "1945", "1946"],
            correct: 2
        },
        {
            question: "Who was the first President of the United States?",
            options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
            correct: 2
        },
        {
            question: "Which ancient wonder was located in Egypt?",
            options: ["Hanging Gardens", "Great Pyramid", "Colossus of Rhodes", "Temple of Artemis"],
            correct: 1
        }
    ],
    geography: [
        {
            question: "Which is the largest ocean on Earth?",
            options: ["Atlantic", "Indian", "Arctic", "Pacific"],
            correct: 3
        },
        {
            question: "What is the longest river in the world?",
            options: ["Amazon", "Nile", "Mississippi", "Yangtze"],
            correct: 1
        },
        {
            question: "Which country has the largest population?",
            options: ["India", "USA", "China", "Indonesia"],
            correct: 2
        }
    ],
    entertainment: [
        {
            question: "Who played Iron Man in the Marvel Cinematic Universe?",
            options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"],
            correct: 2
        },
        {
            question: "Which band performed 'Bohemian Rhapsody'?",
            options: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"],
            correct: 2
        },
        {
            question: "What was the first feature-length animated movie?",
            options: ["Snow White", "Pinocchio", "Bambi", "Fantasia"],
            correct: 0
        }
    ],
    sports: [
        {
            question: "In which sport would you perform a slam dunk?",
            options: ["Football", "Basketball", "Tennis", "Golf"],
            correct: 1
        },
        {
            question: "How many players are on a standard soccer team?",
            options: ["9", "10", "11", "12"],
            correct: 2
        },
        {
            question: "Which country hosted the 2016 Summer Olympics?",
            options: ["China", "USA", "Brazil", "UK"],
            correct: 2
        }
    ]
};

// DOM Elements
const categoryView = document.getElementById('category-view');
const quizView = document.getElementById('quiz-view');
const resultsView = document.getElementById('results-view');
const categoryCards = document.querySelectorAll('.category-card');
const startQuizBtn = document.getElementById('start-quiz');
const categoryTitle = document.getElementById('category-title');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const quizProgress = document.getElementById('quiz-progress');
const questionText = document.getElementById('question-text');
const answerOptions = document.getElementById('answer-options');
const nextQuestionBtn = document.getElementById('next-question');
const scoreDisplay = document.getElementById('score-display');
const scoreText = document.getElementById('score-text');
const scoreMessage = document.getElementById('score-message');
const reviewContainer = document.getElementById('review-container');
const reviewSection = document.getElementById('review-section');

// State
let selectedCategory = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let selectedAnswer = null;

// Initialize
function init() {
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    categoryCards.forEach(card => {
        card.addEventListener('click', () => selectCategory(card));
    });

    startQuizBtn.addEventListener('click', startQuiz);
    document.getElementById('quit-quiz').addEventListener('click', showCategoryView);
    nextQuestionBtn.addEventListener('click', handleNextQuestion);
    document.getElementById('review-answers').addEventListener('click', showReview);
    document.getElementById('try-again').addEventListener('click', showCategoryView);
}

// Category Selection
function selectCategory(card) {
    categoryCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedCategory = card.dataset.category;
    startQuizBtn.disabled = false;
}

// Quiz Management
function startQuiz() {
    currentQuestions = [...quizData[selectedCategory]];
    shuffleArray(currentQuestions);
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    
    categoryTitle.textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    totalQuestionsSpan.textContent = currentQuestions.length;
    
    showQuizView();
    showQuestion();
}

function showQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    questionText.textContent = question.question;
    selectedAnswer = null;
    nextQuestionBtn.disabled = true;
    
    // Update progress
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    quizProgress.style.width = `${progress}%`;
    
    // Create answer options
    answerOptions.innerHTML = question.options.map((option, index) => `
        <div class="answer-option" data-index="${index}">
            ${option}
        </div>
    `).join('');
    
    // Add click handlers to options
    document.querySelectorAll('.answer-option').forEach(option => {
        option.addEventListener('click', () => selectAnswer(option));
    });
}

function selectAnswer(optionElement) {
    const selectedIndex = parseInt(optionElement.dataset.index);
    selectedAnswer = selectedIndex;
    
    // Update UI
    document.querySelectorAll('.answer-option').forEach(option => {
        option.classList.remove('selected');
    });
    optionElement.classList.add('selected');
    
    // Enable next button
    nextQuestionBtn.disabled = false;
}

function handleNextQuestion() {
    // Save answer
    userAnswers.push({
        question: currentQuestions[currentQuestionIndex].question,
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestions[currentQuestionIndex].correct,
        options: currentQuestions[currentQuestionIndex].options
    });
    
    // Update score
    if (selectedAnswer === currentQuestions[currentQuestionIndex].correct) {
        score++;
    }
    
    // Move to next question or show results
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

// View Management
function showCategoryView() {
    categoryView.classList.remove('d-none');
    quizView.classList.add('d-none');
    resultsView.classList.add('d-none');
    reviewSection.classList.add('d-none');
    
    // Reset category selection
    categoryCards.forEach(card => card.classList.remove('selected'));
    startQuizBtn.disabled = true;
}

function showQuizView() {
    categoryView.classList.add('d-none');
    quizView.classList.remove('d-none');
    resultsView.classList.add('d-none');
}

function showResults() {
    quizView.classList.add('d-none');
    resultsView.classList.remove('d-none');
    
    const percentage = Math.round((score / currentQuestions.length) * 100);
    scoreDisplay.textContent = `${percentage}%`;
    scoreDisplay.style.borderColor = getScoreColor(percentage);
    scoreText.textContent = `${score}/${currentQuestions.length}`;
    scoreMessage.textContent = getScoreMessage(percentage);
}

function showReview() {
    reviewSection.classList.remove('d-none');
    reviewContainer.innerHTML = userAnswers.map((answer, index) => `
        <div class="review-question ${answer.userAnswer === answer.correctAnswer ? 'correct' : 'incorrect'}">
            <h5>Question ${index + 1}: ${answer.question}</h5>
            <p>Your answer: ${answer.options[answer.userAnswer]}</p>
            <p>Correct answer: ${answer.options[answer.correctAnswer]}</p>
        </div>
    `).join('');
}

// Utilities
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getScoreColor(percentage) {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
}

function getScoreMessage(percentage) {
    if (percentage >= 80) return "Excellent! You're a trivia master!";
    if (percentage >= 60) return "Good job! Keep practicing to improve.";
    return "Keep studying! You'll do better next time.";
}

// Initialize the app
init(); 
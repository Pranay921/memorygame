// Add these functions at the beginning of your script
function showGame(gameId) {
    document.getElementById('gameSelection').classList.add('hidden');
    document.getElementById(gameId).classList.remove('hidden');
}

function showGameSelection() {
    // Hide all game sections
    document.getElementById('memoryGame').classList.add('hidden');
    document.getElementById('wordGame').classList.add('hidden');
    document.getElementById('numberGame').classList.add('hidden');
    document.getElementById('visualGame').classList.add('hidden');
    document.getElementById('reactionGame').classList.add('hidden');
    document.getElementById('chatbotGame').classList.add('hidden');
    document.getElementById('gameSelection').classList.remove('hidden');
    
    // Reset any running games
    if (timerInterval) {
        clearInterval(timerInterval);
        gameStarted = false;
    }
    
    // Reset word game
    resetGame();
    
    // Reset number game
    if (numberDisplayTimeout) {
        clearTimeout(numberDisplayTimeout);
    }
    numberScore = 0;
    numberGameStarted = false;
    document.getElementById('numberScore').textContent = '0';
    resetNumberGame();
}

// Your existing game code starts here
const cards = [
    '🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢',
    '🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢'
];

let flippedCards = [];
let matchedPairs = 0;
let isProcessing = false;
let gameStarted = false;
let timerInterval;
let seconds = 0;

function shuffleCards(array) {
    return array.sort(() => Math.random() - 0.5);
}

function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'aspect-square bg-white/10 backdrop-blur-lg rounded-xl cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 relative [perspective:1000px]';
    card.innerHTML = `
        <div class="card-inner w-full h-full transition-transform duration-500 transform-style-preserve-3d relative">
            <div class="card-front absolute w-full h-full backface-hidden bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center">
                
            </div>
            <div class="card-back absolute w-full h-full backface-hidden [transform:rotateY(180deg)] bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <span class="text-4xl">${emoji}</span>
            </div>
        </div>
    `;
    card.setAttribute('data-index', index);
    card.addEventListener('click', () => flipCard(card, emoji));
    return card;
}

function flipCard(card, emoji) {
    if (isProcessing || !gameStarted || flippedCards.includes(card)) return;

    const cardInner = card.querySelector('.card-inner');
    cardInner.style.transform = 'rotateY(180deg)';
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        isProcessing = true;
        const [card1, card2] = flippedCards;
        const emoji1 = card1.querySelector('.card-back span').textContent;
        const emoji2 = card2.querySelector('.card-back span').textContent;

        if (emoji1 === emoji2) {
            // Match found
            matchedPairs++;
            card1.classList.add('opacity-70');
            card2.classList.add('opacity-70');
            flippedCards = [];
            isProcessing = false;

            if (matchedPairs === cards.length / 2) {
                clearInterval(timerInterval);
                setTimeout(() => {
                    alert(`Congratulations! You completed the game in ${formatTime(seconds)}`);
                    resetMemoryGame();
                }, 500);
            }
        } else {
            // No match
            setTimeout(() => {
                card1.querySelector('.card-inner').style.transform = '';
                card2.querySelector('.card-inner').style.transform = '';
                flippedCards = [];
                isProcessing = false;
            }, 1000);
        }
    }
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    seconds = 0;
    document.getElementById('timer').textContent = formatTime(seconds);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = formatTime(seconds);
    }, 1000);
}

function startGame() {
    if (gameStarted) return;
    
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    
    const shuffledCards = shuffleCards([...cards]);
    shuffledCards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameGrid.appendChild(card);
    });
    
    matchedPairs = 0;
    gameStarted = true;
    startTimer();
    
    // Hide the start button
    document.getElementById('startGame').classList.add('hidden');
}

function resetMemoryGame() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    gameStarted = false;
    matchedPairs = 0;
    flippedCards = [];
    isProcessing = false;
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('startGame').classList.remove('hidden');
}

// Word Game Variables
let wordGameScore = 0;
let currentWord = '';
let wordDisplayTime = 3000; // 3 seconds to start
let wordGameLevel = 1;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Function to get a word from the API
async function getWordFromAI() {
    try {
        document.getElementById('wordDisplay').innerHTML = `
            <div class="text-white mb-4">
                Loading word...
            </div>
        `;
        
        // Use relative URL that works in any environment
        const response = await fetch('/api/generate-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        return data.word;
    } catch (error) {
        console.error('Error getting word from API:', error);
        
        // Update UI with error message
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = 'Error loading word. Please try again.';
        errorMessage.classList.remove('hidden');
        
        // Use fallback words if API fails
        const fallbackWords = ["MEMORY", "PUZZLE", "GENIUS", "WIZARD", "MASTER", "RECALL", "MENTAL", "FOCUS"];
        return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    }
}

async function startWordRound() {
    try {
        const startButton = document.getElementById('startWordGame');
        const wordInput = document.getElementById('wordInput');
        const errorMessage = document.getElementById('errorMessage');
        
        startButton.classList.add('hidden');
        wordInput.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Get a word from the API
        currentWord = await getWordFromAI();
        
        if (!currentWord) {
            throw new Error('No word received');
        }
        
        // Display the word
        document.getElementById('wordDisplay').textContent = currentWord;
        
        // Hide the word after a delay
        setTimeout(() => {
            document.getElementById('wordDisplay').textContent = '';
            wordInput.classList.remove('hidden');
            wordInput.value = '';
            wordInput.focus();
        }, wordDisplayTime);
        
    } catch (error) {
        console.error('Error starting word round:', error);
        document.getElementById('startWordGame').classList.remove('hidden');
    }
}

function checkWord() {
    const input = document.getElementById('wordInput');
    const userGuess = input.value.trim().toLowerCase();
    const wordDisplay = document.getElementById('wordDisplay');
    
    if (userGuess === currentWord.toLowerCase()) {
        // Increase score by 10 points
        wordGameScore += 10;
        updateScore();
        showSuccess();
    } else {
        showFailure();
    }
}

function showSuccess() {
    const wordDisplay = document.getElementById('wordDisplay');
    const wordInput = document.getElementById('wordInput');
    
    wordDisplay.innerHTML = '<div class="animate__animated animate__bounceIn text-green-400">🎉 Correct! +10 points!</div>';
    wordInput.classList.add('hidden');
    
    // Start next round after delay
    setTimeout(() => {
        startWordRound();
    }, 1500);
}

function showFailure() {
    const wordDisplay = document.getElementById('wordDisplay');
    const wordInput = document.getElementById('wordInput');
    const startButton = document.getElementById('startWordGame');
    
    wordDisplay.innerHTML = `<div class="animate__animated animate__shakeX text-red-400">❌ Wrong! The word was: ${currentWord}</div>`;
    wordInput.classList.add('hidden');
    
    // Reset score to zero when answer is wrong
    wordGameScore = 0;
    updateScore();
    
    // Show start button after delay
    setTimeout(() => {
        startButton.classList.remove('hidden');
    }, 2000);
}

function updateScore() {
    const scoreElement = document.getElementById('wordScore');
    scoreElement.textContent = wordGameScore;
}

function resetGame() {
    wordGameLevel = 1;
    wordGameScore = 0;
    currentWord = '';
    updateScore();
    const wordInput = document.getElementById('wordInput');
    const startButton = document.getElementById('startWordGame');
    const wordDisplay = document.getElementById('wordDisplay');
    const errorMessage = document.getElementById('errorMessage');
    
    wordInput.classList.add('hidden');
    wordInput.value = '';
    startButton.classList.remove('hidden');
    wordDisplay.innerHTML = '';
    errorMessage.classList.add('hidden');
}

function retryWordGame() {
    document.getElementById('errorMessage').classList.add('hidden');
    startWordRound();
}

// Number Game Variables
let currentNumber = '';
let numberScore = 0;
let numberGameStarted = false;
let numberDisplayTimeout;

function startNumberRound() {
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');
    const numberInput = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');

    // Reset display
    errorMessage.classList.add('hidden');
    numberInput.classList.add('hidden');
    numberInput.value = '';
    startButton.textContent = 'Memorize...';
    startButton.disabled = true;

    // Generate random number (length increases with score)
    const length = Math.min(3 + Math.floor(numberScore / 2), 9);
    currentNumber = '';
    for (let i = 0; i < length; i++) {
        currentNumber += Math.floor(Math.random() * 10).toString();
    }

    // Display number
    numberDisplay.textContent = currentNumber;
    
    // Hide number after delay and focus input
    const displayTime = Math.max(3000 - (numberScore * 200), 1000);
    numberDisplayTimeout = setTimeout(() => {
        numberDisplay.textContent = '?';
        numberInput.classList.remove('hidden');
        numberInput.focus(); // Add focus here
        startButton.textContent = 'Submit';
        startButton.disabled = false;
        numberGameStarted = true;
    }, displayTime);
}

function checkNumber() {
    const input = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');
    const errorText = document.getElementById('numberErrorText');
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');

    if (input.value === currentNumber) {
        numberScore++;
        document.getElementById('numberScore').textContent = numberScore;
        startNumberRound();
        setTimeout(() => {
            input.focus();
        }, Math.max(3000 - (numberScore * 200), 1000) + 100);
    } else {
        // Reset score to zero
        numberScore = 0;
        document.getElementById('numberScore').textContent = numberScore;
        
        // Display error message with animation
        numberDisplay.innerHTML = `<div class="animate__animated animate__shakeX text-red-400">❌ Wrong! The number was: ${currentNumber}</div>`;
        numberInput.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Show start button after delay
        startButton.textContent = 'Try Again';
        numberGameStarted = false;
        setTimeout(() => {
            startButton.disabled = false;
        }, 2000);
    }
}

function resetNumberGame(continue_game = false) {
    const startButton = document.getElementById('startNumberGame');
    const numberDisplay = document.getElementById('numberDisplay');
    const numberInput = document.getElementById('numberInput');
    const errorMessage = document.getElementById('numberErrorMessage');

    clearTimeout(numberDisplayTimeout);
    numberDisplay.textContent = continue_game ? 'Ready for next number?' : 'Ready to start?';
    numberInput.classList.add('hidden');
    errorMessage.classList.add('hidden');
    startButton.textContent = 'Start Game';
    startButton.disabled = false;
    numberGameStarted = false;
}

function retryNumberGame() {
    numberScore = 0;
    document.getElementById('numberScore').textContent = numberScore;
    resetNumberGame();
}

// Visual Game Variables
let visualGameLevel = 1;
let visualScore = 0;
let visualLives = 3;
let visualPattern = [];
let userPattern = [];
let isShowingPattern = false;
let correctAttempts = 0;

function startVisualGame() {
    visualGameLevel = 1;
    visualScore = 0;
    visualLives = 3;
    correctAttempts = 0;
    updateVisualStats();
    showVisualPattern();
}

function updateVisualStats() {
    document.getElementById('visualLevel').textContent = visualGameLevel;
    document.getElementById('visualScore').textContent = visualScore;
    document.getElementById('visualLives').textContent = '❤️'.repeat(visualLives);
}

function createVisualGrid() {
    const grid = document.getElementById('visualGrid');
    // Adjust grid size based on level progression
    const size = visualGameLevel <= 2 ? 3 : 
                 visualGameLevel <= 4 ? 4 : 
                 visualGameLevel <= 6 ? 5 : 6;
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        // Enhanced cell styling with hover effects
        cell.className = 'w-16 h-16 bg-white/10 backdrop-blur-lg rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-pink-500/30 hover:shadow-lg hover:shadow-pink-500/25';
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));
        grid.appendChild(cell);
    }
}

function showVisualPattern() {
    isShowingPattern = true;
    createVisualGrid();
    const size = visualGameLevel <= 2 ? 3 : 
                 visualGameLevel <= 4 ? 4 : 
                 visualGameLevel <= 6 ? 5 : 6;
    const totalCells = size * size;
    const numCellsToShow = Math.min(visualGameLevel + 2, Math.floor(totalCells / 2));
    
    visualPattern = [];
    while (visualPattern.length < numCellsToShow) {
        const randomCell = Math.floor(Math.random() * totalCells);
        if (!visualPattern.includes(randomCell)) {
            visualPattern.push(randomCell);
        }
    }

    // Show pattern with animation
    visualPattern.forEach((cellIndex, i) => {
        setTimeout(() => {
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            cell.classList.add('bg-pink-500');
            
            // Remove highlight and enable interaction after last square
            setTimeout(() => {
                cell.classList.remove('bg-pink-500');
                if (i === visualPattern.length - 1) {
                    isShowingPattern = false;
                    userPattern = [];
                }
            }, 800);
        }, i * 1000);
    });
}

function handleCellClick(index) {
    if (isShowingPattern) return;

    const cell = document.querySelector(`[data-index="${index}"]`);
    // Enhanced click animation with color transition
    cell.classList.add('bg-pink-500', 'animate__animated', 'animate__flipInY');
    setTimeout(() => {
        cell.classList.remove('bg-violet-500', 'animate__animated', 'animate__flipInY');
        cell.classList.add('bg-white/30');
        setTimeout(() => cell.classList.remove('bg-white/30'), 300);
    }, 300);

    userPattern.push(index);
    checkPattern();
}

function checkPattern() {
    const currentLength = userPattern.length;
    const isCorrect = userPattern[currentLength - 1] === visualPattern[currentLength - 1];

    if (!isCorrect) {
        visualLives--;
        updateVisualStats();
        showFailureAnimation();
        
        if (visualLives <= 0) {
            gameOverVisual();
            return;
        }
        
        setTimeout(showVisualPattern, 1000);
        return;
    }

    if (currentLength === visualPattern.length) {
        visualScore += 10;
        correctAttempts++;
        
        if (correctAttempts >= 2) {
            visualGameLevel++;
            correctAttempts = 0;
        }
        
        updateVisualStats();
        showSuccessAnimation();
        setTimeout(showVisualPattern, 1000);
    }
}

function showSuccessAnimation() {
    const grid = document.getElementById('visualGrid');
    grid.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => grid.classList.remove('animate__animated', 'animate__pulse'), 500);
}

function showFailureAnimation() {
    const grid = document.getElementById('visualGrid');
    grid.classList.add('animate__animated', 'animate__shakeX');
    setTimeout(() => grid.classList.remove('animate__animated', 'animate__shakeX'), 500);
}

function gameOverVisual() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full">
            <h2 class="text-2xl font-bold text-white mb-4">Game Over! 🎮</h2>
            <p class="text-gray-300 mb-4">Final Score: ${visualScore}</p>
            <p class="text-gray-300 mb-4">Level Reached: ${visualGameLevel}</p>
            <button onclick="this.parentElement.parentElement.remove(); startVisualGame();" 
                    class="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-6 py-2 rounded-full">
                Try Again
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Reaction Game Variables
let reactionStartTime = 0;
let reactionTimeout = null;
let bestReactionTime = Infinity;
let isReactionGameStarted = false;

function startReactionGame() {
    const reactionBox = document.getElementById('reactionBox');
    const startButton = document.getElementById('startReactionGame');
    
    startButton.classList.add('hidden');
    reactionBox.style.backgroundColor = 'rgb(31, 41, 55)';
    reactionBox.textContent = 'Wait for green...';
    
    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000;
    reactionTimeout = setTimeout(() => {
        reactionBox.style.backgroundColor = '#22c55e';
        reactionBox.textContent = 'Click Now!';
        reactionStartTime = Date.now();
        isReactionGameStarted = true;
    }, delay);

    // Add click handler
    reactionBox.onclick = handleReactionClick;
}

function handleReactionClick() {
    const reactionBox = document.getElementById('reactionBox');
    const startButton = document.getElementById('startReactionGame');
    
    if (!isReactionGameStarted) {
        // Clicked too early
        clearTimeout(reactionTimeout);
        reactionBox.style.backgroundColor = '#ef4444';
        reactionBox.textContent = 'Too early! Try again.';
        startButton.classList.remove('hidden');
        return;
    }

    const reactionTime = Date.now() - reactionStartTime;
    bestReactionTime = Math.min(bestReactionTime, reactionTime);
    
    // Update displays
    document.getElementById('lastReactionTime').textContent = `${reactionTime}ms`;
    document.getElementById('bestReactionTime').textContent = `${bestReactionTime}ms`;
    
    // Reset for next round
    reactionBox.style.backgroundColor = '#8b5cf6';
    reactionBox.textContent = 'Click to try again!';
    startButton.classList.remove('hidden');
    isReactionGameStarted = false;
}

// Chatbot Game Variables
let chatGameState = {
    isPlaying: false,
    currentGame: null,
    score: 0,
    level: 1
};

// Chatbot Game Functions
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    
    try {
        // Get AI response using relative URL
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Add bot response to chat
        addMessageToChat(data.response, 'bot');
        
        // Handle game state based on response
        handleGameState(data.response);
    } catch (error) {
        console.error('Chat error:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message mb-4`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `bg-white/20 rounded-lg p-3 inline-block max-w-[80%] ${sender === 'user' ? 'ml-auto' : ''}`;
    messageContent.innerHTML = `<p class="text-white">${message}</p>`;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleGameState(response) {
    if (response.toLowerCase().includes('start')) {
        chatGameState.isPlaying = true;
        chatGameState.currentGame = 'memory';
        chatGameState.score = 0;
        chatGameState.level = 1;
    }
}

// Initialize all games when the document loads
document.addEventListener('DOMContentLoaded', () => {
    // Memory Game initialization
    const startGameButton = document.getElementById('startGame');
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    }

    // Word Game initialization
    const startWordGameButton = document.getElementById('startWordGame');
    const wordInput = document.getElementById('wordInput');

    if (startWordGameButton) {
        startWordGameButton.addEventListener('click', startWordRound);
    }

    if (wordInput) {
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !wordInput.classList.contains('hidden')) {
                e.preventDefault();
                checkWord();
            }
        });
    }

    // Number Game initialization
    const startNumberGameButton = document.getElementById('startNumberGame');
    const numberInput = document.getElementById('numberInput');

    if (startNumberGameButton) {
        startNumberGameButton.addEventListener('click', () => {
            if (!numberGameStarted) {
                startNumberRound();
                numberGameStarted = true;
            } else {
                checkNumber();
            }
        });
    }

    if (numberInput) {
        numberInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && numberGameStarted) {
                e.preventDefault();
                checkNumber();
            }
        });
    }

    // Visual Game initialization
    const startVisualGameButton = document.getElementById('startVisualGame');
    if (startVisualGameButton) {
        startVisualGameButton.addEventListener('click', startVisualGame);
    }

    // Initialize visual game stats
    const visualLevelElement = document.getElementById('visualLevel');
    const visualScoreElement = document.getElementById('visualScore');
    const visualLivesElement = document.getElementById('visualLives');
    
    if (visualLevelElement && visualScoreElement && visualLivesElement) {
        visualLevelElement.textContent = '1';
        visualScoreElement.textContent = '0';
        visualLivesElement.textContent = '❤️❤️❤️';
    }

    // Reaction Game initialization
    const startReactionGameButton = document.getElementById('startReactionGame');
    if (startReactionGameButton) {
        startReactionGameButton.addEventListener('click', startReactionGame);
    }
    
    // Chatbot Game initialization
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    
    if (chatInput && sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // Initialize all games
    resetGame();
    resetNumberGame();
    resetMemoryGame();
});
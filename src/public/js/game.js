/**
 * Memory Game Frontend Logic
 * Handles UI interactions, API calls, and game state management
 */

// Game state
let gameState = {
  cards: [],
  moves: 0,
  startTime: null,
  isComplete: false,
  gameId: null
};

// Card tracking state
let flippedCards = [];
let canFlip = true;
let timerInterval = null;

// DOM Elements - only declare if not already defined
const gameBoard = document.getElementById('gameBoard');
const gameBoardContainer = document.getElementById('gameBoardContainer');
const gameComplete = document.getElementById('gameComplete');
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const startGameBtn = document.getElementById('startGameBtn');
const fileCount = document.getElementById('fileCount');
const moveCount = document.getElementById('moveCount');
const timer = document.getElementById('timer');
const finalMoveCount = document.getElementById('finalMoveCount');
const finalTime = document.getElementById('finalTime');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const menuBtn = document.getElementById('menuBtn');

// Reference shared elements that might be defined in auth.js
const _gameSetup = document.getElementById('gameSetup');
const _previousGames = document.getElementById('previousGames');

/**
 * Initializes the game
 */
function initGame() {
  // Add event listeners
  uploadForm.addEventListener('submit', handleUpload);
  imageInput.addEventListener('change', handleImageSelection);
  resetBtn.addEventListener('click', resetGame);
  backBtn.addEventListener('click', goToMenu);
  playAgainBtn.addEventListener('click', resetGame);
  menuBtn.addEventListener('click', goToMenu);
}

/**
 * Handles image file selection
 * @param {Event} event - Input change event
 */
function handleImageSelection(event) {
  const files = event.target.files;
  fileCount.textContent = `${files.length} file(s) selected`;
  startGameBtn.disabled = files.length < 2 || files.length > 10;
  
  // Clear previous preview
  imagePreview.innerHTML = '';
  
  // Show image previews
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Handles image upload and game creation
 * @param {Event} event - Form submit event
 */
async function handleUpload(event) {
  event.preventDefault();
  
  const formData = new FormData(uploadForm);
  
  try {
    const response = await fetch('/api/game/upload', {
      method: 'POST',
      body: formData,
      headers: window.accessToken ? {
        'Authorization': `Bearer ${window.accessToken}`
      } : {}
    });
    
    const data = await response.json();
    
    if (data.success) {
      gameState.gameId = data.gameId;
      const gameResponse = await fetch(`/api/game/${data.gameId}`, {
        headers: window.accessToken ? {
          'Authorization': `Bearer ${window.accessToken}`
        } : {}
      });
      const gameData = await gameResponse.json();
      
      if (gameData.success) {
        startGame(gameData.game);
      }
    } else {
      alert('Error uploading images. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error uploading images. Please try again.');
  }
}

/**
 * Starts the game with the provided game data
 * @param {Object} gameData - The game data to initialize
 */
function startGame(gameData) {
  // Initialize game state
  gameState = {
    cards: gameData.cards,
    moves: gameData.moves,
    startTime: gameData.startTime ? new Date(gameData.startTime) : null,
    isComplete: gameData.isComplete,
    gameId: gameData.id
  };
  
  // Update UI
  _gameSetup.style.display = 'none';
  gameBoardContainer.style.display = 'block';
  gameComplete.style.display = 'none';
  
  // Create game board
  createGameBoard();
  
  // Start timer if game is in progress
  if (gameState.startTime && !gameState.isComplete) {
    startTimer();
  }
  
  // Update move counter
  updateMoveCount();
}

/**
 * Creates the game board with cards
 */
function createGameBoard() {
  gameBoard.innerHTML = '';
  
  // Calculate grid size
  const numCards = gameState.cards.length;
  const gridCols = Math.ceil(Math.sqrt(numCards));
  gameBoard.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
  
  gameState.cards.forEach(card => {
    const cardElement = createCardElement(card);
    gameBoard.appendChild(cardElement);
  });
}

/**
 * Creates a card element
 * @param {Object} card - Card data
 * @returns {HTMLElement} The card element
 */
function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = 'card';
  cardElement.dataset.imageId = btoa(card.imageUrl); // Use base64 encoded image URL as identifier
  
  cardElement.innerHTML = `
    <div class="card-inner">
      <div class="card-front">?</div>
      <div class="card-back">
        <img src="${card.imageUrl}" alt="Card">
      </div>
    </div>
  `;
  
  cardElement.addEventListener('click', handleCardClick);
  return cardElement;
}

/**
 * Handles card click events
 * @param {Event} event - Click event
 */
async function handleCardClick(event) {
  if (!canFlip || gameState.isComplete) return;
  
  const clickedCard = event.currentTarget;
  const imageId = clickedCard.dataset.imageId;
  
  // Prevent clicking same card twice or clicking more than 2 cards
  if (clickedCard.classList.contains('flipped') || flippedCards.length >= 2) return;
  
  // Flip card
  clickedCard.classList.add('flipped');
  flippedCards.push(clickedCard);
  
  // If we have 2 cards flipped, check for match
  if (flippedCards.length === 2) {
    canFlip = false;
    gameState.moves++;
    updateMoveCount();
    
    // Start timer on first move
    if (!gameState.startTime) {
      gameState.startTime = new Date();
      startTimer();
    }
    
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.imageId === card2.dataset.imageId;
    
    if (isMatch) {
      // Mark cards as matched
      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        // Reset for next pair
        flippedCards = [];
        canFlip = true;
        
        // Check if game is complete
        const allCards = document.querySelectorAll('.card');
        const matchedCards = document.querySelectorAll('.card.matched');
        
        if (allCards.length === matchedCards.length) {
          gameState.isComplete = true;
          gameComplete.style.display = 'block';
          finalMoveCount.textContent = gameState.moves;
          finalTime.textContent = timer.textContent;
          stopTimer();
        }
      }, 500);
    } else {
      // Flip cards back after delay
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        canFlip = true;
      }, 1000);
    }
  }
}

/**
 * Updates a card element's visual state
 * @param {string} cardId - ID of the card to update
 */
function updateCardElement(cardId) {
  const cardElement = gameBoard.querySelector(`[data-id="${cardId}"]`);
  const card = gameState.cards.find(c => c.id === cardId);
  
  if (cardElement && card) {
    cardElement.className = `card${card.isFlipped ? ' flipped' : ''}${card.isMatched ? ' matched' : ''}`;
  }
}

/**
 * Updates the move counter display
 */
function updateMoveCount() {
  moveCount.textContent = gameState.moves;
}

/**
 * Starts the game timer
 */
function startTimer() {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((new Date() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

/**
 * Stops the game timer
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Resets the current game
 */
async function resetGame() {
  // Reset game state
  gameState.moves = 0;
  gameState.startTime = null;
  gameState.isComplete = false;
  flippedCards = [];
  canFlip = true;
  
  // Reset UI
  stopTimer();
  timer.textContent = '00:00';
  updateMoveCount();
  gameComplete.style.display = 'none';
  
  // Shuffle and recreate cards
  const cards = gameState.cards;
  for(let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  createGameBoard();
}

/**
 * Returns to the main menu
 */
function goToMenu() {
  // Stop the timer
  stopTimer();
  
  // Reset game state
  gameState = {
    cards: [],
    moves: 0,
    startTime: null,
    isComplete: false,
    gameId: null
  };
  
  // Clear file input and preview
  uploadForm.reset();
  imagePreview.innerHTML = '';
  fileCount.textContent = 'No files selected';
  startGameBtn.disabled = true;
  
  // Update UI
  gameBoardContainer.style.display = 'none';
  gameComplete.style.display = 'none';
  
  // Show appropriate menu based on auth state
  if (window.currentUser) {
    _previousGames.style.display = 'block';
    // Refresh games list
    if (typeof loadUserGames === 'function') {
      loadUserGames();
    }
  } else {
    _gameSetup.style.display = 'block';
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
/**
 * Memory Game Frontend Logic
 * Handles UI interactions, API calls, and game state management
 */

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const fileCount = document.getElementById('fileCount');
const imagePreview = document.getElementById('imagePreview');
const startGameBtn = document.getElementById('startGameBtn');
const gameSetup = document.getElementById('gameSetup');
const gameBoardContainer = document.getElementById('gameBoardContainer');
const gameBoard = document.getElementById('gameBoard');
const moveCount = document.getElementById('moveCount');
const timer = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const gameComplete = document.getElementById('gameComplete');
const finalMoveCount = document.getElementById('finalMoveCount');
const finalTime = document.getElementById('finalTime');
const playAgainBtn = document.getElementById('playAgainBtn');
const newGameBtn = document.getElementById('newGameBtn');

// Game state
let gameId = null;
let cards = [];
let flippedCards = [];
let canFlip = true;
let timerInterval = null;
let timerSeconds = 0;

/**
 * Initializes the game
 */
function initGame() {
  // Listen for file input changes
  imageInput.addEventListener('change', handleFileInputChange);
  
  // Listen for form submission
  uploadForm.addEventListener('submit', handleFormSubmit);
  
  // Listen for reset button click
  resetBtn.addEventListener('click', handleResetClick);
  
  // Listen for play again button click
  playAgainBtn.addEventListener('click', handlePlayAgainClick);
  
  // Listen for new game button click
  newGameBtn.addEventListener('click', handleNewGameClick);
}

/**
 * Handles file input changes
 * @param {Event} event - The change event
 */
function handleFileInputChange(event) {
  const files = event.target.files;
  
  if (files.length === 0) {
    fileCount.textContent = 'No files selected';
    startGameBtn.disabled = true;
    imagePreview.innerHTML = '';
    return;
  }
  
  if (files.length > 10) {
    alert('Please select a maximum of 10 images');
    event.target.value = '';
    fileCount.textContent = 'No files selected';
    startGameBtn.disabled = true;
    imagePreview.innerHTML = '';
    return;
  }
  
  fileCount.textContent = files.length === 1 
    ? '1 file selected' 
    : `${files.length} files selected`;
  
  startGameBtn.disabled = false;
  
  // Preview images
  imagePreview.innerHTML = '';
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = file.name;
      imagePreview.appendChild(img);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Handles form submission for image uploads
 * @param {Event} event - The submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(uploadForm);
  
  try {
    startGameBtn.disabled = true;
    startGameBtn.textContent = 'Uploading...';
    
    const response = await fetch('/api/game/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload images');
    }
    
    // Start the game with the uploaded images
    gameId = data.gameId;
    startGame();
  } catch (error) {
    console.error('Error uploading images:', error);
    alert('Failed to upload images. Please try again.');
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'Start Game';
  }
}

/**
 * Starts the game
 */
async function startGame() {
  try {
    if (!gameId) return;
    
    // Get game data
    const response = await fetch(`/api/game/${gameId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to start game');
    }
    
    // Initialize game state
    cards = data.game.cards;
    flippedCards = [];
    canFlip = true;
    timerSeconds = 0;
    updateTimerDisplay();
    
    // Show game board
    gameSetup.style.display = 'none';
    gameBoardContainer.style.display = 'block';
    gameComplete.style.display = 'none';
    
    // Render cards
    renderGameBoard();
    
    // Start timer
    startTimer();
  } catch (error) {
    console.error('Error starting game:', error);
    alert('Failed to start the game. Please try again.');
  }
}

/**
 * Renders the game board with cards
 */
function renderGameBoard() {
  gameBoard.innerHTML = '';
  
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`;
    cardElement.dataset.cardId = card.id;
    cardElement.dataset.pairId = card.pairId;
    
    cardElement.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <span>?</span>
        </div>
        <div class="card-back">
          <img src="${card.imageUrl}" alt="Card">
        </div>
      </div>
    `;
    
    // Add click event
    cardElement.addEventListener('click', () => handleCardClick(card.id));
    
    gameBoard.appendChild(cardElement);
  });
  
  // Update move counter
  moveCount.textContent = '0';
}

/**
 * Handles card click event
 * @param {string} cardId - The ID of the clicked card
 */
async function handleCardClick(cardId) {
  if (!canFlip) return;
  
  // Find card in state
  const card = cards.find(c => c.id === cardId);
  
  // Don't flip if card is already flipped or matched
  if (!card || card.isFlipped || card.isMatched) return;
  
  // Don't flip if two cards are already flipped
  const flippedCount = cards.filter(c => c.isFlipped && !c.isMatched).length;
  if (flippedCount >= 2) return;
  
  try {
    const response = await fetch(`/api/game/${gameId}/card/${cardId}/flip`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to flip card');
    }
    
    // Update local card state
    card.isFlipped = data.card.isFlipped;
    card.isMatched = data.card.isMatched;
    
    // Update the UI for this card
    updateCardUI(cardId);
    
    // Check if two cards are flipped
    if (data.flippedCount === 2) {
      // Update move counter
      moveCount.textContent = data.moves;
      
      if (data.isMatch) {
        // Mark cards as matched
        const matchedCards = cards.filter(c => c.isFlipped && !c.isMatched);
        matchedCards.forEach(c => {
          c.isMatched = true;
          updateCardUI(c.id);
        });
        
        // Check if game is complete
        if (data.isComplete) {
          endGame();
        }
      } else {
        // Prevent further flips until the timeout completes
        canFlip = false;
        
        // Flip back after delay
        setTimeout(() => {
          // Get all flipped but unmatched cards
          const unmatched = cards.filter(c => c.isFlipped && !c.isMatched);
          unmatched.forEach(c => {
            c.isFlipped = false;
            updateCardUI(c.id);
          });
          
          // Re-enable flipping
          canFlip = true;
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Error flipping card:', error);
    // Ensure canFlip is reset in case of error
    canFlip = true;
  }
}

/**
 * Updates the UI for a specific card
 * @param {string} cardId - The ID of the card to update
 */
function updateCardUI(cardId) {
  const cardElement = document.querySelector(`.card[data-card-id="${cardId}"]`);
  const card = cards.find(c => c.id === cardId);
  
  if (cardElement && card) {
    cardElement.className = `card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`;
  }
}

/**
 * Starts the game timer
 */
function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerSeconds = 0;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

/**
 * Updates the timer display
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  
  timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Ends the game and shows completion screen
 */
function endGame() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  gameBoardContainer.style.display = 'none';
  gameComplete.style.display = 'block';
  
  finalMoveCount.textContent = moveCount.textContent;
  finalTime.textContent = timer.textContent;
}

/**
 * Handles reset button click
 */
async function handleResetClick() {
  try {
    const response = await fetch(`/api/game/${gameId}/reset`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to reset game');
    }
    
    // Update game state
    cards = data.cards;
    flippedCards = [];
    canFlip = true;
    
    // Reset timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerSeconds = 0;
    updateTimerDisplay();
    
    // Re-render game board
    renderGameBoard();
    moveCount.textContent = '0';
    
    // Start timer
    startTimer();
  } catch (error) {
    console.error('Error resetting game:', error);
    alert('Failed to reset the game. Please try again.');
  }
}

/**
 * Handles play again button click
 */
function handlePlayAgainClick() {
  gameComplete.style.display = 'none';
  gameBoardContainer.style.display = 'block';
  
  handleResetClick();
}

/**
 * Handles new game button click
 */
function handleNewGameClick() {
  gameComplete.style.display = 'none';
  gameSetup.style.display = 'block';
  
  // Reset file input
  uploadForm.reset();
  imagePreview.innerHTML = '';
  fileCount.textContent = 'No files selected';
  startGameBtn.disabled = true;
  startGameBtn.textContent = 'Start Game';
  
  // Clear game state
  gameId = null;
  cards = [];
  flippedCards = [];
  
  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
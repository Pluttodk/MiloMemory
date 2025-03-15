// filepath: c:\Code\dev\FindFriends\src\public\js\auth.js
/**
 * Authentication Module
 * Handles user authentication, registration, and profile management
 */

// DOM Elements for Authentication
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authButtons = document.getElementById('authButtons');
const userProfile = document.getElementById('userProfile');
const userDisplayName = document.getElementById('userDisplayName');

// DOM Elements for Modals
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeModalButtons = document.querySelectorAll('.close-modal');

// DOM Elements for Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// DOM Elements for Content Sections
const gameSetup = document.getElementById('gameSetup');
const previousGames = document.getElementById('previousGames');
const newGameBtn = document.getElementById('newGameBtn');
const gamesList = document.getElementById('gamesList');

// Current user state
let currentUser = null;
let accessToken = null;

/**
 * Initializes authentication functionality
 */
function initAuth() {
  // Check if user is already logged in
  checkAuthState();
  
  // Add event listeners for auth buttons
  loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
  });
  
  registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'flex';
  });
  
  logoutBtn.addEventListener('click', handleLogout);
  
  // Close modals when clicking the X
  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      loginModal.style.display = 'none';
      registerModal.style.display = 'none';
    });
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = 'none';
    }
    if (event.target === registerModal) {
      registerModal.style.display = 'none';
    }
  });
  
  // Form submissions
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  
  // New game button in previous games section
  newGameBtn.addEventListener('click', () => {
    previousGames.style.display = 'none';
    gameSetup.style.display = 'block';
  });
}

/**
 * Checks the current authentication state
 */
async function checkAuthState() {
  try {
    // Try to get stored auth token
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) return;
    
    accessToken = storedToken;
    
    // Fetch the current user profile
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    
    const data = await response.json();
    
    if (data.success && data.profile) {
      currentUser = data.profile;
      updateUIForLoggedInUser();
      loadUserGames();
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
    // Clear any invalid tokens
    localStorage.removeItem('accessToken');
    accessToken = null;
    currentUser = null;
  }
}

/**
 * Handles user login form submission
 * @param {Event} event - The form submit event
 */
async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = '';
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token and user info
      accessToken = data.session.accessToken;
      localStorage.setItem('accessToken', accessToken);
      currentUser = data.user;
      
      // Update UI
      updateUIForLoggedInUser();
      
      // Close modal
      loginModal.style.display = 'none';
      loginForm.reset();
      
      // Load user's games
      loadUserGames();
    } else {
      loginError.textContent = data.message || 'Login failed. Please try again.';
    }
  } catch (error) {
    console.error('Error during login:', error);
    loginError.textContent = 'An error occurred. Please try again.';
  }
}

/**
 * Handles user registration form submission
 * @param {Event} event - The form submit event
 */
async function handleRegister(event) {
  event.preventDefault();
  registerError.textContent = '';
  
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const displayName = document.getElementById('registerDisplayName').value;
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, displayName })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      registerError.textContent = 'Registration successful! Please log in.';
      registerError.style.color = 'var(--success-color)';
      
      // Reset form
      registerForm.reset();
      
      // Switch to login modal after a delay
      setTimeout(() => {
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
      }, 1500);
    } else {
      registerError.textContent = data.message || 'Registration failed. Please try again.';
    }
  } catch (error) {
    console.error('Error during registration:', error);
    registerError.textContent = 'An error occurred. Please try again.';
  }
}

/**
 * Handles user logout
 */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Clear local storage and state
    localStorage.removeItem('accessToken');
    accessToken = null;
    currentUser = null;
    
    // Update UI
    updateUIForLoggedOutUser();
  } catch (error) {
    console.error('Error during logout:', error);
    // Still clear local state in case of error
    localStorage.removeItem('accessToken');
    accessToken = null;
    currentUser = null;
    updateUIForLoggedOutUser();
  }
}

/**
 * Updates the UI for a logged-in user
 */
function updateUIForLoggedInUser() {
  // Show/hide auth elements
  authButtons.style.display = 'none';
  userProfile.style.display = 'flex';
  userDisplayName.textContent = currentUser.displayName || currentUser.email;
  
  // Show previous games section instead of game setup
  gameSetup.style.display = 'none';
  previousGames.style.display = 'block';
}

/**
 * Updates the UI for a logged-out user
 */
function updateUIForLoggedOutUser() {
  // Show/hide auth elements
  authButtons.style.display = 'flex';
  userProfile.style.display = 'none';
  
  // Show game setup section
  gameSetup.style.display = 'block';
  previousGames.style.display = 'none';
}

/**
 * Loads and displays the user's games
 */
async function loadUserGames() {
  if (!currentUser) return;
  
  try {
    const response = await fetch('/api/game/user/games', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load games');
    }
    
    const data = await response.json();
    
    if (data.success && data.games) {
      renderGamesList(data.games);
    }
  } catch (error) {
    console.error('Error loading user games:', error);
  }
}

/**
 * Renders the list of user's games
 * @param {Array} games - Array of game objects
 */
function renderGamesList(games) {
  gamesList.innerHTML = '';
  
  if (games.length === 0) {
    gamesList.innerHTML = '<p>You haven\'t created any games yet. Click "Create New Game" to get started!</p>';
    return;
  }
  
  games.forEach(game => {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    
    // Format date
    const createdDate = new Date(game.created_at);
    const formattedDate = createdDate.toLocaleDateString();
    
    // Determine game status
    const gameStatus = game.is_complete ? 'Completed' : game.start_time ? 'In Progress' : 'Not Started';
    
    // Calculate time played if applicable
    let timePlayed = 'Not started';
    if (game.start_time) {
      const startTime = new Date(game.start_time);
      const endTime = game.end_time ? new Date(game.end_time) : new Date();
      const seconds = Math.floor((endTime - startTime) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timePlayed = `${minutes}m ${remainingSeconds}s`;
    }
    
    gameCard.innerHTML = `
      <h3>Game #${game.id.substring(0, 8)}</h3>
      <div class="game-card-stats">
        <div><strong>Created:</strong> ${formattedDate}</div>
        <div><strong>Status:</strong> ${gameStatus}</div>
        <div><strong>Moves:</strong> ${game.moves}</div>
        <div><strong>Time:</strong> ${timePlayed}</div>
      </div>
      <div class="game-card-actions">
        <button class="btn btn-primary play-game" data-game-id="${game.id}">Play Game</button>
        <button class="btn delete-game" data-game-id="${game.id}">Delete</button>
      </div>
    `;
    
    gamesList.appendChild(gameCard);
    
    // Add event listeners to buttons
    const playButton = gameCard.querySelector('.play-game');
    const deleteButton = gameCard.querySelector('.delete-game');
    
    playButton.addEventListener('click', () => {
      loadExistingGame(game.id);
    });
    
    deleteButton.addEventListener('click', () => {
      deleteGame(game.id);
    });
  });
}

/**
 * Loads an existing game from the user's games
 * @param {string} gameId - ID of the game to load
 */
async function loadExistingGame(gameId) {
  try {
    // Fetch the game data
    const response = await fetch(`/api/game/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load game');
    }
    
    const data = await response.json();
    
    if (data.success && data.game) {
      // Set the global gameId (used in game.js)
      window.gameId = gameId;
      
      // Hide previous games and show game board
      previousGames.style.display = 'none';
      
      // Trigger startGame function from game.js
      if (typeof startGame === 'function') {
        startGame(data.game);
      } else {
        console.error('startGame function not available');
      }
    }
  } catch (error) {
    console.error('Error loading existing game:', error);
    alert('Failed to load the game. Please try again.');
  }
}

/**
 * Deletes a game from the user's games
 * @param {string} gameId - ID of the game to delete
 */
async function deleteGame(gameId) {
  if (!confirm('Are you sure you want to delete this game?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/game/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete game');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Reload the games list
      loadUserGames();
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    alert('Failed to delete the game. Please try again.');
  }
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', initAuth);
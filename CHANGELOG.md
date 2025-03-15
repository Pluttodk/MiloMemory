# Changelog

## [1.0.1] - 2023-10-29

### Fixed
- Fixed game freezing issue that occurred after flipping two non-matching cards
- Added additional error handling to ensure game remains playable even if API calls fail
- Improved client-side card state management for better synchronization with server

## [1.0.0] - 2023-10-29

### Added
- Initial release of the Memory Game
- Image upload functionality supporting multiple images
- Responsive design for both mobile and web
- Game statistics tracking (moves and time)
- Match finding gameplay with card flipping animations

# Memory Game Changelog

## Initial Implementation - Memory Game with Image Upload

### Added
- Created a full-stack memory card game application using Node.js, Express, and TypeScript
- Implemented the backend with a RESTful API for game logic
- Created a responsive frontend UI that works on both mobile and web devices
- Added image upload functionality to allow users to create custom memory games
- Implemented game mechanics including card matching, move counting, and timer

### Technical Details
- **Backend**: Node.js with Express and TypeScript
- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Data Management**: In-memory storage for game state
- **File Handling**: Express-fileupload for handling image uploads

### Components
- Card and Game models for managing game state
- Game controller for handling API requests
- Frontend JavaScript for user interactions
- Responsive CSS for cross-device compatibility

### Game Features
- Upload 2-10 custom images to create a memory game
- Automatic creation of card pairs for each image
- Card flipping and matching logic
- Game timer and move counter
- Game completion detection
- Ability to reset or start a new game
import express from 'express';
import { GameController } from '../controllers/gameController';

/**
 * Router for game-related API endpoints
 */
export const gameRouter = express.Router();

/**
 * POST /api/game/upload
 * Endpoint for uploading images for a new memory game
 */
gameRouter.post('/upload', GameController.uploadImages);

/**
 * POST /api/game/create
 * Endpoint for creating a new memory game
 */
gameRouter.post('/create', GameController.createGame);

/**
 * GET /api/game/:gameId
 * Endpoint for getting the current state of a game
 */
gameRouter.get('/:gameId', GameController.getGame);

/**
 * GET /api/game/user/games
 * Endpoint for getting all games for the current user
 */
gameRouter.get('/user/games', GameController.getUserGames);

/**
 * POST /api/game/:gameId/card/:cardId/flip
 * Endpoint for flipping a card in a game
 */
gameRouter.post('/:gameId/card/:cardId/flip', GameController.flipCard);

/**
 * POST /api/game/:gameId/reset
 * Endpoint for resetting a game
 */
gameRouter.post('/:gameId/reset', GameController.resetGame);

/**
 * DELETE /api/game/:gameId
 * Endpoint for deleting a user's game
 */
gameRouter.delete('/:gameId', GameController.deleteGame);
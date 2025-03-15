import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import { Game } from '../models/Game';

// In-memory storage for games
const games: Map<string, Game> = new Map();

/**
 * Controller for handling memory game operations
 */
export class GameController {
  /**
   * Handles image uploads for the game
   * @param req Express request object
   * @param res Express response object
   */
  public static uploadImages(req: Request, res: Response): void {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).json({ 
          success: false, 
          message: 'No files were uploaded.' 
        });
        return;
      }
      
      const uploadedFiles = req.files.images;
      const uploadedImages: string[] = [];
      
      // Handle single file upload
      if (!Array.isArray(uploadedFiles)) {
        const fileName = `${uuidv4()}${path.extname(uploadedFiles.name)}`;
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
        
        uploadedFiles.mv(uploadPath, (err) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: 'Error uploading file',
              error: err 
            });
          }
        });
        
        uploadedImages.push(`/uploads/${fileName}`);
      } else {
        // Handle multiple file uploads
        uploadedFiles.forEach((file: UploadedFile) => {
          const fileName = `${uuidv4()}${path.extname(file.name)}`;
          const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
          
          file.mv(uploadPath, (err) => {
            if (err) {
              return res.status(500).json({ 
                success: false, 
                message: 'Error uploading file',
                error: err 
              });
            }
          });
          
          uploadedImages.push(`/uploads/${fileName}`);
        });
      }
      
      // Create a new game with the uploaded images
      const game = new Game(uploadedImages);
      games.set(game.id, game);
      
      res.status(200).json({
        success: true,
        gameId: game.id,
        message: 'Files uploaded successfully',
        imageCount: uploadedImages.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error
      });
    }
  }

  /**
   * Creates a new game with the specified images
   * @param req Express request object
   * @param res Express response object
   */
  public static createGame(req: Request, res: Response): void {
    try {
      const { images } = req.body;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No images provided for the game'
        });
        return;
      }
      
      // Create a new game
      const game = new Game(images);
      game.start();
      games.set(game.id, game);
      
      res.status(201).json({
        success: true,
        gameId: game.id,
        cards: game.cards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating game',
        error: error
      });
    }
  }

  /**
   * Gets the current state of a game
   * @param req Express request object
   * @param res Express response object
   */
  public static getGame(req: Request, res: Response): void {
    try {
      const { gameId } = req.params;
      const game = games.get(gameId);
      
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        game: {
          id: game.id,
          cards: game.cards,
          moves: game.moves,
          isComplete: game.isComplete,
          elapsedTime: game.getElapsedTime()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving game',
        error: error
      });
    }
  }

  /**
   * Flips a card in the game
   * @param req Express request object
   * @param res Express response object
   */
  public static flipCard(req: Request, res: Response): void {
    try {
      const { gameId, cardId } = req.params;
      const game = games.get(gameId);
      
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }
      
      const card = game.cards.find(c => c.id === cardId);
      
      if (!card) {
        res.status(404).json({
          success: false,
          message: 'Card not found'
        });
        return;
      }
      
      // Start the game if it hasn't started yet
      if (!game.startTime) {
        game.start();
      }
      
      // Flip the card
      card.flip();
      
      // Find all currently flipped cards
      const flippedCards = game.cards.filter(c => c.isFlipped && !c.isMatched);
      
      // Check for a match if two cards are flipped
      if (flippedCards.length === 2) {
        game.incrementMoves();
        
        // Check if the two flipped cards have the same pairId
        if (flippedCards[0].pairId === flippedCards[1].pairId) {
          // Mark both cards as matched
          flippedCards.forEach(c => c.match());
          
          // Check if the game is complete
          game.checkCompletion();
        } else {
          // Flip both cards back after a delay (handled by the frontend)
        }
      }
      
      res.status(200).json({
        success: true,
        card: card,
        flippedCount: flippedCards.length,
        isMatch: flippedCards.length === 2 ? flippedCards[0].pairId === flippedCards[1].pairId : false,
        isComplete: game.isComplete,
        moves: game.moves
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing card flip',
        error: error
      });
    }
  }

  /**
   * Resets a game to its initial state
   * @param req Express request object
   * @param res Express response object
   */
  public static resetGame(req: Request, res: Response): void {
    try {
      const { gameId } = req.params;
      const game = games.get(gameId);
      
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }
      
      game.reset();
      
      res.status(200).json({
        success: true,
        gameId: game.id,
        message: 'Game reset successfully',
        cards: game.cards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error resetting game',
        error: error
      });
    }
  }
}
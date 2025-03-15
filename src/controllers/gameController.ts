import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import { Game } from '../models/Game';
import { DatabaseService } from '../services/databaseService';
import { AuthService } from '../services/authService';
import { supabase } from '../config/supabase';

/**
 * Controller for handling memory game operations
 */
export class GameController {
  /**
   * Handles image uploads for the game
   * @param req Express request object
   * @param res Express response object
   */
  public static async uploadImages(req: Request, res: Response): Promise<void> {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({ 
                success: false, 
                message: 'No files were uploaded.' 
            });
            return;
        }
        
        // Get current user if authenticated
        const user = await AuthService.getCurrentUser();
        const userId = user ? user.id : null;
        
        const uploadedFiles = req.files.images;
        const uploadedImages: string[] = [];
        
        // Handle single or multiple file uploads
        const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
        
        for (const file of files) {
            const fileName = `${uuidv4()}${path.extname(file.name)}`;
            
            // Direct upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('game-images')
                .upload(`uploads/${fileName}`, file.data, {
                    contentType: file.mimetype,
                    upsert: true
                });
                
            if (error) {
                throw error;
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('game-images')
                .getPublicUrl(`uploads/${fileName}`);
                
            uploadedImages.push(urlData.publicUrl);
        }
        
        // Create a new game with the uploaded images and user ID
        const game = new Game(uploadedImages, userId);
        
        // Save game to database
        await DatabaseService.saveGame(game);
        
        res.status(200).json({
            success: true,
            gameId: game.id,
            message: 'Files uploaded successfully',
            imageCount: uploadedImages.length
        });
    } catch (error) {
        console.error('Error in uploadImages:', error);
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
  public static async createGame(req: Request, res: Response): Promise<void> {
    try {
      const { images } = req.body;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No images provided for the game'
        });
        return;
      }
      
      // Get current user if authenticated
      const user = await AuthService.getCurrentUser();
      const userId = user ? user.id : null;
      
      // Create a new game
      const game = new Game(images, userId);
      game.start();
      
      // Save game to database
      await DatabaseService.saveGame(game);
      
      res.status(201).json({
        success: true,
        gameId: game.id,
        cards: game.cards
      });
    } catch (error) {
      console.error('Error in createGame:', error);
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
  public static async getGame(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      
      // Get game from database
      const game = await DatabaseService.getGame(gameId);
      
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
          elapsedTime: game.getElapsedTime(),
          userId: game.userId
        }
      });
    } catch (error) {
      console.error('Error in getGame:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving game',
        error: error
      });
    }
  }

  /**
   * Gets all games for the current user
   * @param req Express request object
   * @param res Express response object
   */
  public static async getUserGames(req: Request, res: Response): Promise<void> {
    try {
      // Get current user if authenticated
      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }
      
      // Get user games from database
      const games = await DatabaseService.getUserGames(user.id);
      
      res.status(200).json({
        success: true,
        games: games
      });
    } catch (error) {
      console.error('Error in getUserGames:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user games',
        error: error
      });
    }
  }

  /**
   * Flips a card in the game
   * @param req Express request object
   * @param res Express response object
   */
  public static async flipCard(req: Request, res: Response): Promise<void> {
    try {
      const { gameId, cardId } = req.params;
      
      // Get game from database
      const game = await DatabaseService.getGame(gameId);
      
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
        await DatabaseService.updateGame(game);
      }
      
      // Don't allow flipping if card is already matched
      if (card.isMatched) {
        res.status(400).json({
          success: false,
          message: 'Card is already matched'
        });
        return;
      }
      
      // Flip the card
      card.flip();
      await DatabaseService.updateCard(card, gameId);
      
      // Find all currently flipped cards
      const flippedCards = game.cards.filter(c => c.isFlipped && !c.isMatched);
      
      let isMatch = false;
      let isComplete = false;
      
      // Check for a match if two cards are flipped
      if (flippedCards.length === 2) {
        game.incrementMoves();
        
        // Check if the two flipped cards have the same pairId
        if (flippedCards[0].pairId === flippedCards[1].pairId) {
          // Mark both cards as matched
          flippedCards.forEach(c => c.match());
          
          // Update both cards in the database
          await Promise.all(flippedCards.map(c => DatabaseService.updateCard(c, gameId)));
          
          isMatch = true;
          
          // Check if the game is complete
          isComplete = game.checkCompletion();
          
          if (isComplete) {
            game.end();
          }
          
          // Update game state in database
          await DatabaseService.updateGame(game);
        }
      }
      
      res.status(200).json({
        success: true,
        card: card,
        flippedCount: flippedCards.length,
        isMatch,
        isComplete,
        moves: game.moves,
        matchedPairs: game.getMatchedPairsCount(),
        totalPairs: game.getTotalPairsCount()
      });
    } catch (error) {
      console.error('Error in flipCard:', error);
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
  public static async resetGame(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      
      // Get game from database
      const game = await DatabaseService.getGame(gameId);
      
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }
      
      game.reset();
      
      // Update game in database
      await DatabaseService.saveGame(game);
      
      res.status(200).json({
        success: true,
        gameId: game.id,
        message: 'Game reset successfully',
        cards: game.cards
      });
    } catch (error) {
      console.error('Error in resetGame:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting game',
        error: error
      });
    }
  }

  /**
   * Deletes a user's game
   * @param req Express request object
   * @param res Express response object
   */
  public static async deleteGame(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      
      // Get current user if authenticated
      const user = await AuthService.getCurrentUser();
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }
      
      // Delete the game
      await DatabaseService.deleteGame(gameId, user.id);
      
      res.status(200).json({
        success: true,
        message: 'Game deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteGame:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting game',
        error: error
      });
    }
  }
}
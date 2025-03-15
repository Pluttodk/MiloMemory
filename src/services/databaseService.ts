// filepath: c:\Code\dev\FindFriends\src\services\databaseService.ts
import { supabase } from '../config/supabase';
import { Game } from '../models/Game';
import { Card } from '../models/Card';

/**
 * Service for handling database operations with Supabase
 */
export class DatabaseService {
  /**
   * Saves a game to the Supabase database
   * @param game The game to save
   * @returns The saved game data
   */
  public static async saveGame(game: Game): Promise<Game> {
    const { data, error } = await supabase
      .from('games')
      .upsert({
        id: game.id,
        is_complete: game.isComplete,
        moves: game.moves,
        start_time: game.startTime,
        end_time: game.endTime,
        user_id: game.userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving game:', error);
      throw error;
    }
    
    // Save cards for this game
    await this.saveCards(game.cards, game.id);
    
    return game;
  }
  
  /**
   * Saves cards to the Supabase database
   * @param cards Array of cards to save
   * @param gameId ID of the game these cards belong to
   */
  private static async saveCards(cards: Card[], gameId: string): Promise<void> {
    const cardsData = cards.map(card => ({
      id: card.id,
      game_id: gameId,
      image_url: card.imageUrl,
      is_flipped: card.isFlipped,
      is_matched: card.isMatched,
      pair_id: card.pairId
    }));
    
    const { error } = await supabase
      .from('cards')
      .upsert(cardsData);
    
    if (error) {
      console.error('Error saving cards:', error);
      throw error;
    }
  }
  
  /**
   * Gets a game from the Supabase database
   * @param gameId ID of the game to get
   * @returns The retrieved game or null if not found
   */
  public static async getGame(gameId: string): Promise<Game | null> {
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      if (gameError.code === 'PGRST116') {
        // Record not found
        return null;
      }
      console.error('Error getting game:', gameError);
      throw gameError;
    }
    
    // Get cards for this game
    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('game_id', gameId);
    
    if (cardsError) {
      console.error('Error getting cards:', cardsError);
      throw cardsError;
    }
    
    // Create and return game object
    const game = new Game([]);
    game.id = gameData.id;
    game.isComplete = gameData.is_complete;
    game.moves = gameData.moves;
    game.startTime = gameData.start_time ? new Date(gameData.start_time) : null;
    game.endTime = gameData.end_time ? new Date(gameData.end_time) : null;
    game.userId = gameData.user_id;
    
    // Convert cards
    game.cards = cardsData.map(cardData => {
      const card = new Card(cardData.id, cardData.image_url, cardData.pair_id);
      card.isFlipped = cardData.is_flipped;
      card.isMatched = cardData.is_matched;
      return card;
    });
    
    return game;
  }

  /**
   * Gets games for a specific user from the Supabase database
   * @param userId ID of the user
   * @param limit Maximum number of games to return (default 20)
   * @returns Array of user games
   */
  public static async getUserGames(userId: string, limit: number = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting user games:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Updates a card in the Supabase database
   * @param card The card to update
   * @param gameId ID of the game this card belongs to
   */
  public static async updateCard(card: Card, gameId: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .update({
        is_flipped: card.isFlipped,
        is_matched: card.isMatched
      })
      .eq('id', card.id)
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }
  
  /**
   * Updates a game in the Supabase database
   * @param game The game to update
   */
  public static async updateGame(game: Game): Promise<void> {
    const { error } = await supabase
      .from('games')
      .update({
        is_complete: game.isComplete,
        moves: game.moves,
        end_time: game.endTime
      })
      .eq('id', game.id);
    
    if (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }
  
  /**
   * Initializes the database tables if they don't exist
   */
  public static async initDatabase(): Promise<void> {
    console.log('Checking database tables...');
    
    // For Supabase, tables should be created through the dashboard or migrations
    // This method will be used for logging connection status
    const { data, error } = await supabase.from('games').select('id').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connection successful!');
    }
  }

  /**
   * Deletes a game from the database
   * @param gameId ID of the game to delete
   * @param userId ID of the user who owns the game
   */
  public static async deleteGame(gameId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }
}
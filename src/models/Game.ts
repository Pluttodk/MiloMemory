import { v4 as uuidv4 } from 'uuid';
import { Card } from './Card';

/**
 * Represents the state and logic of a memory game
 */
export class Game {
  public id: string;
  public cards: Card[];
  public isComplete: boolean;
  public moves: number;
  public startTime: Date | null;
  public endTime: Date | null;

  /**
   * Creates a new game instance
   * @param images Array of image URLs for the game
   */
  constructor(images: string[]) {
    this.id = uuidv4();
    this.cards = this.createCards(images);
    this.isComplete = false;
    this.moves = 0;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Creates a deck of cards from the provided images
   * @param images Array of image URLs
   * @returns Array of Card objects
   */
  private createCards(images: string[]): Card[] {
    // Create pairs of cards for each image
    const cards: Card[] = [];
    
    images.forEach(imageUrl => {
      const pairId = uuidv4();
      
      // Create two cards with the same image and pair ID
      cards.push(new Card(uuidv4(), imageUrl, pairId));
      cards.push(new Card(uuidv4(), imageUrl, pairId));
    });
    
    // Shuffle the cards
    return this.shuffleCards(cards);
  }

  /**
   * Shuffles the array of cards
   * @param cards Array of Card objects to shuffle
   * @returns Shuffled array of Card objects
   */
  private shuffleCards(cards: Card[]): Card[] {
    const shuffled = [...cards];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Starts the game timer
   */
  public start(): void {
    this.startTime = new Date();
  }

  /**
   * Ends the game and records completion time
   */
  public end(): void {
    this.endTime = new Date();
    this.isComplete = true;
  }

  /**
   * Gets the elapsed time in seconds
   * @returns Seconds elapsed or 0 if game not started
   */
  public getElapsedTime(): number {
    if (!this.startTime) return 0;
    
    const endTime = this.endTime || new Date();
    return Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);
  }

  /**
   * Checks if all cards have been matched
   * @returns True if all cards are matched
   */
  public checkCompletion(): boolean {
    const allMatched = this.cards.every(card => card.isMatched);
    
    if (allMatched && !this.isComplete) {
      this.end();
    }
    
    return allMatched;
  }

  /**
   * Increments the move counter
   */
  public incrementMoves(): void {
    this.moves++;
  }

  /**
   * Resets the game state
   */
  public reset(): void {
    this.cards.forEach(card => card.reset());
    this.cards = this.shuffleCards(this.cards);
    this.moves = 0;
    this.startTime = null;
    this.endTime = null;
    this.isComplete = false;
  }
}
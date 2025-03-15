/**
 * Represents a card in the memory game
 */
export class Card {
  public id: string;
  public imageUrl: string;
  public isFlipped: boolean;
  public isMatched: boolean;
  public pairId: string;

  /**
   * Creates a new card instance
   * @param id Unique identifier for the card
   * @param imageUrl URL to the card image
   * @param pairId Identifier linking this card to its matching pair
   */
  constructor(id: string, imageUrl: string, pairId: string) {
    this.id = id;
    this.imageUrl = imageUrl;
    this.isFlipped = false;
    this.isMatched = false;
    this.pairId = pairId;
  }

  /**
   * Flips the card to show its image
   */
  public flip(): void {
    this.isFlipped = !this.isFlipped;
  }

  /**
   * Marks the card as matched
   */
  public match(): void {
    this.isMatched = true;
  }

  /**
   * Resets the card to its initial state
   */
  public reset(): void {
    this.isFlipped = false;
    this.isMatched = false;
  }
}

import Phaser from 'phaser';
import { Card, MatchState, PlayerData } from './types';

export default class GameScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Group;
  private matchState: MatchState | null = null;
  // Fix: changed myId type from string to number to match PlayerData.id
  private myId: number = 0;
  private onCardPlayed: (card: Card) => void;

  // Manually declare Phaser properties to satisfy TypeScript compiler
  public load: Phaser.Loader.LoaderPlugin;
  public add: Phaser.GameObjects.GameObjectFactory;
  public scale: Phaser.Scale.ScaleManager;

  constructor() {
    super('GameScene');
  }

  // Fix: updated init signature to accept number for myId and handle possible undefined data
  init(data: { myId: number, onCardPlayed: (card: Card) => void }) {
    this.myId = data?.myId ?? 0;
    this.onCardPlayed = data?.onCardPlayed;
  }

  preload() {
    // Caricamento dinamico asset carte
    const suits = ['foglia', 'onda', 'roccia', 'stella'];
    suits.forEach(suit => {
      for (let i = 1; i <= 10; i++) {
        this.load.image(`${suit}-${i}`, `assets/cards/${suit}/${i}.png`);
      }
    });
    this.load.image('table', 'https://labs.phaser.io/assets/textures/felt.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(width / 2, height / 2, width, height, 'table').setAlpha(0.4);
    this.cards = this.add.group();
    
    this.add.text(width / 2, 20, 'Joker Briscola - Tavolo', { 
      fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#fbbf24' 
    }).setOrigin(0.5);
  }

  updateState(state: MatchState) {
    this.matchState = state;
    this.renderBoard();
  }

  private renderBoard() {
    if (!this.matchState) return;
    this.cards.clear(true, true);
    const { width, height } = this.scale;
    // Fix: both sides are now numbers (p.id and this.myId)
    const me = this.matchState.players.find(p => p.id === this.myId);
    
    if (me && me.hand) {
      me.hand.forEach((card, i) => {
        const x = width / 2 - (me.hand!.length - 1) * 50 + i * 100;
        const y = height - 100;
        const sprite = this.add.image(x, y, card.id)
          .setInteractive({ useHandCursor: true })
          .setScale(0.6);
        
        if (this.matchState?.turnIndex === me.index) {
          // Fix: added optional chaining for safety when onCardPlayed is not provided
          sprite.on('pointerdown', () => this.onCardPlayed?.(card));
          sprite.setTint(0xffffff);
        } else {
          sprite.setTint(0x888888);
        }
        this.cards.add(sprite);
      });
    }

    // Renderizza carte giocate al centro
    this.matchState.playedCards.forEach((pc, i) => {
      const angle = (i * 45) - 45;
      const x = width / 2 + Math.cos(angle) * 50;
      const y = height / 2 + Math.sin(angle) * 50;
      const sprite = this.add.image(x, y, pc.card.id).setScale(0.5).setAngle(angle * 10);
      this.cards.add(sprite);
    });
  }
}

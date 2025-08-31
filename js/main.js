// Basic app initialization
class CardDeckApp {
    constructor() {
        this.decks = [];
        this.selectedCards = new Set();
        this.standardDeck = this.generateStandardDeck();
        this.init();
    }

    generateStandardDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        
        suits.forEach(suit => {
            ranks.forEach(rank => {
                deck.push({
                    suit: suit,
                    rank: rank,
                    id: `${rank}${suit}`,
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            });
        });
        
        return deck;
    }

    init() {
        this.loadDecks();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Main add deck button
        document.getElementById('addDeckBtn').addEventListener('click', () => {
            this.showDeckCreation();
        });

        // Modal close button
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeDeckCreation();
        });

        // Click outside modal to close
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeckCreation();
            }
        });

        // Filter header toggle
        document.querySelector('[data-filter="custom"]').addEventListener('click', () => {
            this.toggleFilterSection('custom');
        });

        // Custom filter name input
        document.getElementById('customFilterName').addEventListener('input', () => {
            this.updateCreateButton();
        });

        // Create deck button
        document.getElementById('createDeckBtn').addEventListener('click', () => {
            this.createCustomDeck();
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDeckCreation();
            }
        });
    }

    loadDecks() {
        const savedDecks = localStorage.getItem('cardDecks');
        if (savedDecks) {
            this.decks = JSON.parse(savedDecks);
        }
    }

    saveDecks() {
        localStorage.setItem('cardDecks', JSON.stringify(this.decks));
    }

    render() {
        const container = document.getElementById('decksContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.decks.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            this.renderDecks();
        }
    }

    renderDecks() {
        const container = document.getElementById('decksContainer');
        
        // Clear existing deck cards (but keep empty state element)
        const existingCards = container.querySelectorAll('.deck-card');
        existingCards.forEach(card => card.remove());
        
        // Create deck cards
        this.decks.forEach(deck => {
            const deckCard = this.createDeckCard(deck);
            container.appendChild(deckCard);
        });
    }

    createDeckCard(deck) {
        const deckCard = document.createElement('div');
        deckCard.className = 'deck-card';
        deckCard.dataset.deckId = deck.id;
        
        // Calculate some stats about the deck
        const totalCards = deck.cards.length;
        const remainingCards = totalCards - deck.currentIndex;
        const suitCounts = this.getSuitCounts(deck.cards);
        
        deckCard.innerHTML = `
            <div class="deck-card-header">
                <h3 class="deck-name">${deck.name}</h3>
                <div class="deck-stats">
                    <span class="card-count">${remainingCards}/${totalCards}</span>
                </div>
            </div>
            <div class="deck-preview">
                <div class="suit-distribution">
                    ${Object.entries(suitCounts).map(([suit, count]) => 
                        `<span class="suit-count" style="color: ${(suit === '♥' || suit === '♦') ? '#f87171' : '#e4e4e7'}">${suit} ${count}</span>`
                    ).join('')}
                </div>
                <div class="deck-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((totalCards - remainingCards) / totalCards) * 100}%"></div>
                    </div>
                </div>
            </div>
            <div class="deck-meta">
                <span class="created-date">Created ${this.formatDate(deck.createdAt)}</span>
            </div>
        `;
        
        // Add click handler
        deckCard.addEventListener('click', () => {
            this.selectDeck(deck);
        });
        
        return deckCard;
    }

    getSuitCounts(cards) {
        const counts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
        cards.forEach(card => {
            counts[card.suit]++;
        });
        return counts;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'today';
        if (diffDays === 2) return 'yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    }

    selectDeck(deck) {
        // Placeholder for deck selection (next step)
        console.log(`Selected deck: ${deck.name} with ${deck.cards.length} cards`);
    }

    showDeckCreation() {
        this.selectedCards.clear();
        document.getElementById('customFilterName').value = '';
        this.generateCardGrid();
        this.updateCreateButton();
        
        const modal = document.getElementById('modalOverlay');
        modal.classList.add('active');
        
        // Auto-expand the custom filter section
        this.toggleFilterSection('custom', true);
    }

    closeDeckCreation() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
    }

    generateCardGrid() {
        const cardGrid = document.getElementById('cardGrid');
        cardGrid.innerHTML = '';
        
        const suits = [
            { symbol: '♠', name: 'Spades' },
            { symbol: '♥', name: 'Hearts' },
            { symbol: '♦', name: 'Diamonds' },
            { symbol: '♣', name: 'Clubs' }
        ];

        suits.forEach(suit => {
            // Add suit label
            const suitLabel = document.createElement('div');
            suitLabel.className = 'suit-label';
            suitLabel.textContent = suit.name + ' ' + suit.symbol;
            cardGrid.appendChild(suitLabel);

            // Add cards for this suit
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            ranks.forEach(rank => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card-selector';
                cardElement.textContent = rank;
                cardElement.dataset.cardId = `${rank}${suit.symbol}`;
                
                // Color the card text appropriately
                if (suit.symbol === '♥' || suit.symbol === '♦') {
                    cardElement.style.color = '#f87171';
                }
                
                cardElement.addEventListener('click', () => {
                    this.toggleCardSelection(cardElement);
                });
                
                cardGrid.appendChild(cardElement);
            });
        });
    }

    toggleCardSelection(cardElement) {
        const cardId = cardElement.dataset.cardId;
        
        if (this.selectedCards.has(cardId)) {
            this.selectedCards.delete(cardId);
            cardElement.classList.remove('selected');
        } else {
            this.selectedCards.add(cardId);
            cardElement.classList.add('selected');
        }
        
        this.updateCreateButton();
    }

    toggleFilterSection(filterName, forceOpen = false) {
        const header = document.querySelector(`[data-filter="${filterName}"]`);
        const content = document.getElementById(`${filterName}FilterContent`);
        const chevron = header.querySelector('.chevron');
        
        const isExpanded = content.classList.contains('expanded') && !forceOpen;
        
        if (isExpanded) {
            content.classList.remove('expanded');
            header.classList.remove('active');
            chevron.classList.remove('rotated');
        } else {
            content.classList.add('expanded');
            header.classList.add('active');
            chevron.classList.add('rotated');
        }
    }

    updateCreateButton() {
        const filterName = document.getElementById('customFilterName').value.trim();
        const hasCards = this.selectedCards.size > 0;
        const createBtn = document.getElementById('createDeckBtn');
        
        if (filterName && hasCards) {
            createBtn.disabled = false;
            createBtn.textContent = `Create Deck (${this.selectedCards.size} cards)`;
        } else {
            createBtn.disabled = true;
            createBtn.textContent = 'Create Deck';
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createCustomDeck() {
        const filterName = document.getElementById('customFilterName').value.trim();
        
        // Get selected cards from the standard deck
        const selectedCardObjects = this.standardDeck.filter(card => 
            this.selectedCards.has(card.id)
        );
        
        // Create shuffled deck
        const shuffledCards = this.shuffleArray(selectedCardObjects);
        
        // Create deck object
        const newDeck = {
            id: Date.now().toString(),
            name: filterName,
            cards: shuffledCards,
            currentIndex: 0,
            createdAt: new Date().toISOString()
        };
        
        // Add to decks array and save
        this.decks.push(newDeck);
        this.saveDecks();
        
        // Close modal and refresh view
        this.closeDeckCreation();
        this.render();
        
        console.log(`Created deck "${filterName}" with ${shuffledCards.length} cards`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CardDeckApp();
});

export {CardDeckApp}
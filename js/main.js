// Basic app initialization
class CardDeckApp {
    constructor() {
        this.decks = [];
        this.selectedCards = new Set();
        this.standardDeck = this.generateStandardDeck();
        this.init();
    }

    generateStandardDeck() {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        const ranks = [
            { name: 'ace', display: 'A' },
            { name: '2', display: '2' },
            { name: '3', display: '3' },
            { name: '4', display: '4' },
            { name: '5', display: '5' },
            { name: '6', display: '6' },
            { name: '7', display: '7' },
            { name: '8', display: '8' },
            { name: '9', display: '9' },
            { name: '10', display: '10' },
            { name: 'jack', display: 'J' },
            { name: 'queen', display: 'Q' },
            { name: 'king', display: 'K' }
        ];
        const deck = [];
        
        suits.forEach(suit => {
            ranks.forEach(rank => {
                const suitSymbol = this.getSuitSymbol(suit);
                deck.push({
                    suit: suitSymbol,
                    suitName: suit,
                    rank: rank.display,
                    rankName: rank.name,
                    id: `${rank.display}${suitSymbol}`,
                    fileName: `${rank.name}_of_${suit}.svg`,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
                });
            });
        });
        
        return deck;
    }

    getSuitSymbol(suitName) {
        const symbols = {
            'spades': '♠',
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣'
        };
        return symbols[suitName];
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

        // Exit deck playing view
        document.getElementById('exitDeckBtn').addEventListener('click', () => {
            this.exitDeckView();
        });

        // ESC key to close modal or exit deck view
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('deckPlayingView').classList.contains('active')) {
                    this.exitDeckView();
                } else {
                    this.closeDeckCreation();
                }
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
                <div class="deck-options">
                    <button class="deck-options-btn" data-deck-id="${deck.id}">⋮</button>
                    <div class="deck-options-menu" id="options-${deck.id}">
                        <div class="deck-option-item" data-action="rename" data-deck-id="${deck.id}">Rename Deck</div>
                        <div class="deck-option-item" data-action="duplicate" data-deck-id="${deck.id}">Duplicate Deck</div>
                        <div class="deck-option-item" data-action="reset" data-deck-id="${deck.id}">Clear Progress</div>
                        <div class="deck-option-item danger" data-action="delete" data-deck-id="${deck.id}">Delete Deck</div>
                    </div>
                </div>
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
        
        // Add click handler for deck selection (but not on options)
        deckCard.addEventListener('click', (e) => {
            // Don't trigger deck selection if clicking on options
            if (!e.target.closest('.deck-options')) {
                this.selectDeck(deck);
            }
        });
        
        // Add options menu handlers
        this.setupDeckOptionsHandlers(deckCard, deck);
        
        return deckCard;
    }

    setupDeckOptionsHandlers(deckCard, deck) {
        const optionsBtn = deckCard.querySelector('.deck-options-btn');
        const optionsMenu = deckCard.querySelector('.deck-options-menu');
        const optionItems = deckCard.querySelectorAll('.deck-option-item');
        
        // Toggle menu
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllOptionsMenus();
            optionsMenu.classList.add('active');
        });
        
        // Handle option clicks
        optionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                optionsMenu.classList.remove('active');
                
                this.handleDeckAction(action, deck);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => {
            optionsMenu.classList.remove('active');
        });
    }

    closeAllOptionsMenus() {
        document.querySelectorAll('.deck-options-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    handleDeckAction(action, deck) {
        switch (action) {
            case 'rename':
                this.renameDeck(deck);
                break;
            case 'duplicate':
                this.duplicateDeck(deck);
                break;
            case 'reset':
                this.resetDeckProgress(deck);
                break;
            case 'delete':
                this.confirmDeleteDeck(deck);
                break;
        }
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
        this.currentDeck = deck;
        this.showDeckPlayingView();
    }

    showDeckPlayingView() {
        // Update deck info
        document.getElementById('playingDeckTitle').textContent = this.currentDeck.name;
        this.updateDeckPlayingUI();
        
        // Show the playing view
        document.getElementById('deckPlayingView').classList.add('active');
        
        // Setup card click handler
        this.setupCardClickHandler();
    }

    setupCardClickHandler() {
        const cardBack = document.getElementById('cardBack');
        const remainingDeckArea = document.getElementById('remainingDeckArea');
        
        // Remove existing listeners
        cardBack.replaceWith(cardBack.cloneNode(true));
        const newCardBack = document.getElementById('cardBack');
        
        if (this.currentDeck.currentIndex < this.currentDeck.cards.length) {
            // Still have cards to flip
            newCardBack.addEventListener('click', () => {
                this.flipNextCard();
            });
        } else {
            // Deck is empty, show reset option
            remainingDeckArea.innerHTML = `
                <div class="empty-deck" id="emptyDeck">
                    <div class="empty-deck-text">Click to Restart</div>
                </div>
            `;
            
            document.getElementById('emptyDeck').addEventListener('click', () => {
                this.resetDeck();
            });
        }
    }

    updateDeckPlayingUI() {
        const totalCards = this.currentDeck.cards.length;
        const remaining = totalCards - this.currentDeck.currentIndex;
        
        document.getElementById('cardsRemaining').textContent = `${remaining} of ${totalCards} cards remaining`;
        
        const resetHint = document.getElementById('resetHint');
        if (remaining === 0) {
            resetHint.style.display = 'block';
        } else {
            resetHint.style.display = 'none';
        }
    }

    flipNextCard() {
        if (this.currentDeck.currentIndex >= this.currentDeck.cards.length) return;
        
        const card = this.currentDeck.cards[this.currentDeck.currentIndex];
        this.currentDeck.currentIndex++;
        
        // Update the deck in storage
        this.saveDecks();
        
        // Create flipped card element
        this.showFlippedCard(card);
        
        // Update UI
        this.updateDeckPlayingUI();
        this.setupCardClickHandler();
    }

    showFlippedCard(card) {
        const flippedCardArea = document.getElementById('flippedCardArea');
        
        const cardElement = document.createElement('div');
        cardElement.className = 'flipped-card';
        cardElement.style.backgroundImage = `url('svg/${card.fileName}')`;
        
        // Clear previous card and show new one
        flippedCardArea.innerHTML = '';
        flippedCardArea.appendChild(cardElement);
        
        // Add a subtle animation
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.8) rotateY(180deg)';
        setTimeout(() => {
            cardElement.style.transition = 'all 0.4s ease';
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'scale(1) rotateY(0deg)';
        }, 10);
    }

    resetDeck() {
        this.currentDeck.currentIndex = 0;
        
        // Clear flipped card
        document.getElementById('flippedCardArea').innerHTML = '';
        
        // Reset the deck display
        const remainingDeckArea = document.getElementById('remainingDeckArea');
        remainingDeckArea.innerHTML = `
            <div class="card-display" id="deckDisplay">
                <div class="card-back" id="cardBack"></div>
            </div>
        `;
        
        // Update UI and setup handlers
        this.updateDeckPlayingUI();
        this.setupCardClickHandler();
    }

    exitDeckView() {
        document.getElementById('deckPlayingView').classList.remove('active');
        this.currentDeck = null;
        
        // Refresh main view to show updated deck states
        this.render();
    }

    // Deck Management Functions
    renameDeck(deck) {
        const newName = prompt('Enter new deck name:', deck.name);
        if (newName && newName.trim() && newName.trim() !== deck.name) {
            deck.name = newName.trim();
            this.saveDecks();
            this.render();
        }
    }

    duplicateDeck(deck) {
        const newDeck = {
            id: Date.now().toString(),
            name: `${deck.name} (Copy)`,
            cards: [...deck.cards], // Copy the cards array
            currentIndex: 0, // Reset progress for duplicate
            createdAt: new Date().toISOString()
        };
        
        // Shuffle the duplicated deck
        newDeck.cards = this.shuffleArray(newDeck.cards);
        
        this.decks.push(newDeck);
        this.saveDecks();
        this.render();
    }

    resetDeckProgress(deck) {
        deck.currentIndex = 0;
        // Re-shuffle the deck
        deck.cards = this.shuffleArray(deck.cards);
        this.saveDecks();
        this.render();
    }

    confirmDeleteDeck(deck) {
        this.showConfirmationModal(
            '🗑️',
            'Delete Deck',
            `Are you sure you want to delete "${deck.name}"? This action cannot be undone.`,
            'Delete',
            () => this.deleteDeck(deck)
        );
    }

    deleteDeck(deck) {
        this.decks = this.decks.filter(d => d.id !== deck.id);
        this.saveDecks();
        this.render();
    }

    showConfirmationModal(icon, title, message, confirmText, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        const iconEl = document.getElementById('confirmationIcon');
        const titleEl = document.getElementById('confirmationTitle');
        const messageEl = document.getElementById('confirmationMessage');
        const confirmBtn = document.getElementById('confirmationConfirm');
        const cancelBtn = document.getElementById('confirmationCancel');
        
        iconEl.textContent = icon;
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        
        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new listeners
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmationModal();
            onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => {
            this.hideConfirmationModal();
        });
        
        // Show modal
        modal.classList.add('active');
        
        // Close on ESC
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                this.hideConfirmationModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    hideConfirmationModal() {
        document.getElementById('confirmationModal').classList.remove('active');
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
            { name: 'spades', symbol: '♠', displayName: 'Spades' },
            { name: 'hearts', symbol: '♥', displayName: 'Hearts' },
            { name: 'diamonds', symbol: '♦', displayName: 'Diamonds' },
            { name: 'clubs', symbol: '♣', displayName: 'Clubs' }
        ];

        suits.forEach(suit => {
            // Add suit label
            const suitLabel = document.createElement('div');
            suitLabel.className = 'suit-label';
            suitLabel.textContent = suit.name + ' ' + suit.symbol;
            cardGrid.appendChild(suitLabel);

            // Add cards for this suit
            const ranks = [
                { name: 'ace', display: 'A' },
                { name: '2', display: '2' },
                { name: '3', display: '3' },
                { name: '4', display: '4' },
                { name: '5', display: '5' },
                { name: '6', display: '6' },
                { name: '7', display: '7' },
                { name: '8', display: '8' },
                { name: '9', display: '9' },
                { name: '10', display: '10' },
                { name: 'jack', display: 'J' },
                { name: 'queen', display: 'Q' },
                { name: 'king', display: 'K' }
            ];
            
            ranks.forEach(rank => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card-selector';
                const cardId = `${rank.display}${suit.symbol}`;
                const fileName = `${rank.name}_of_${suit.name}.svg`;
                
                cardElement.dataset.cardId = cardId;
                cardElement.style.backgroundImage = `url('svg/${fileName}')`;
                
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
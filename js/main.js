// Basic app initialization
class CardDeckApp {
    constructor() {
        this.decks = [];
        this.selectedCards = new Set();
        this.standardDeck = this.generateStandardDeck();
        this.currentFilterType = null;
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

        // Filter header toggles
        document.querySelector('[data-filter="random"]').addEventListener('click', () => {
            this.toggleFilterSection('random');
        });

        // Filter header toggle
        document.querySelector('[data-filter="custom"]').addEventListener('click', () => {
            this.toggleFilterSection('custom');
        });

        // Random filter controls
        document.getElementById('randomFilterName').addEventListener('input', () => {
            this.updateCreateButton();
        });

        const sizeNumberInput = document.getElementById('sizeNumberInput');
        const sizeSlider = document.getElementById('sizeSlider');

        sizeNumberInput.addEventListener('input', (e) => {
            const value = Math.max(1, Math.min(52, parseInt(e.target.value) || 1));
            e.target.value = value;
            sizeSlider.value = value;
            this.updateCreateButton();
        });

        sizeSlider.addEventListener('input', (e) => {
            sizeNumberInput.value = e.target.value;
            this.updateCreateButton();
        });

        // Custom filter name input
        document.getElementById('customFilterName').addEventListener('input', () => {
            this.updateCreateButton();
        });

        // Create deck button
        document.getElementById('createDeckBtn').addEventListener('click', () => {
            this.createDeck();
        });

        // Exit deck playing view
        document.getElementById('exitDeckBtn').addEventListener('click', () => {
            this.exitDeckView();
        });

        // Reset deck button
        document.getElementById('resetDeckBtn').addEventListener('click', () => {
            this.resetDeckInView();
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
        
        deckCard.innerHTML = `
            <div class="deck-card-header">
                <h3 class="deck-name">${deck.name}</h3>
                <div class="deck-options">
                    <button class="deck-options-btn" data-deck-id="${deck.id}">⋮</button>
                    <div class="deck-options-menu" id="options-${deck.id}">
                        <div class="deck-option-item" data-action="rename" data-deck-id="${deck.id}">Rename Deck</div>
                        <div class="deck-option-item" data-action="duplicate" data-deck-id="${deck.id}">Duplicate Deck</div>
                        <div class="deck-option-item danger" data-action="delete" data-deck-id="${deck.id}">Delete Deck</div>
                    </div>
                </div>
            </div>
            <div class="deck-stats">
                <span class="card-count">${totalCards} cards</span>
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
            case 'delete':
                this.confirmDeleteDeck(deck);
                break;
        }
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
        // Create a session copy of the deck for playing
        this.currentDeck = {
            ...deck,
            cards: [...deck.cards], // create a copy
            currentIndex: 0 // Always start fresh
        };

        // Clear any flipped card
        document.getElementById('flippedCardArea').innerHTML = '';
        
        this.showDeckPlayingView();
    }

    showDeckPlayingView() {
        // Update deck info
        document.getElementById('playingDeckTitle').textContent = this.currentDeck.name;
        this.updateDeckPlayingUI();
        
        // Show the playing view
        document.getElementById('deckPlayingView').classList.add('active');

        // Initialize layout with invisible left-hand placeholder
        this.initializeDeckLayout();
        
        // Setup card click handler
        this.setupCardClickHandler();
    }

    setupCardClickHandler() {
        const remainingDeckArea = document.getElementById('remainingDeckArea');
        
        if (this.currentDeck.currentIndex < this.currentDeck.cards.length) {
            // Still have cards to flip
            const cardStack = remainingDeckArea.querySelector('.card-stack');
            if (cardStack) {
                cardStack.addEventListener('click', () => {
                    this.flipNextCardGroup();
                });
            }
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
            resetHint.classList.add('visible');
        } else {
            resetHint.classList.remove('visible');
        }
    }

    initializeDeckLayout() {
        const flippedCardArea = document.getElementById('flippedCardArea');
        const remainingDeckArea = document.getElementById('remainingDeckArea');

        // Add placeholder to maintain consistent layout when flipping cards
        flippedCardArea.innerHTML = `
            <div class="card-placeholder" id="cardPlaceholder"></div>
        `;

        this.updateRemainingCardsDisplay();

        // Hide reset hint on unflipped decks
        const resetHint = document.getElementById('resetHint');
        resetHint.classList.remove('visible');
    }

    updateRemainingCardsDisplay() {
        const remainingDeckArea = document.getElementById('remainingDeckArea');
        const remainingCards = this.currentDeck.cards.length - this.currentDeck.currentIndex;

        if (remainingCards <= 0) {
            remainingDeckArea.innerHTML = `
                <div class="empty-deck" id="emptyDeck">
                    <div class="empty-deck-text">Click to Restart</div>
                </div>
                `;
                return;
        }

        // Create the appropriate number of card backs based on remaining cards
        const cardsToShow = Math.min(3, remainingCards);
        let stackHTML = '<div class="card-stack">';

        for (let i = 0; i < cardsToShow; i++) {
            stackHTML += '<div class="card-back"></div>';
        }

        stackHTML += '</div>';

        remainingDeckArea.innerHTML = `
            <div class="card-display" id="deckDisplay">
                ${stackHTML}
            </div>
        `;
    }

    flipNextCardGroup() {
        const remainingCards = this.currentDeck.cards.length - this.currentDeck.currentIndex;
        if (remainingCards <= 0) return;
        
        const cardsToFlip = Math.min(3, remainingCards);
        const flippedCards = []

        // Get the cards to flip
        for (let i = 0; i < cardsToFlip; i++) {
            if (this.currentDeck.currentIndex < this.currentDeck.cards.length) {
                flippedCards.push(this.currentDeck.cards[this.currentDeck.currentIndex]);
                this.currentDeck.currentIndex++;
            }
        }
        
        // Show flipped cards
        this.showFlippedCardGroup(flippedCards);
        
        // Update UI
        this.updateDeckPlayingUI();
        this.updateRemainingCardsDisplay();
        this.setupCardClickHandler();
    }

    showFlippedCardGroup(cards) {
        const flippedCardArea = document.getElementById('flippedCardArea');
        
        // Create stack container
        const stackContainer = document.createElement('div');
        stackContainer.className = 'flipped-card-stack';

        // Add each card to the stack
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'flipped-card';
            cardElement.style.backgroundImage = `url('svg/${card.fileName}')`;
            stackContainer.appendChild(cardElement);
        });

        // Replace placeholder or existing flipped cards
        const placeholder = document.getElementById('cardPlaceholder');
        if (placeholder) {
            placeholder.replaceWith(stackContainer);
        } else {
            // placeholder not preset, replace existing flipped card
            flippedCardArea.innerHTML = '';
            flippedCardArea.appendChild(stackContainer);
        }
        
        // Add a subtle animation
        stackContainer.style.opacity = '0';
        stackContainer.style.transform = 'scale(0.8)';
        setTimeout(() => {
            stackContainer.style.transition = 'all 0.3s ease';
            stackContainer.style.opacity = '1';
            stackContainer.style.transform = 'scale(1)';
        }, 10);
    }

    resetDeck() {
        this.currentDeck.currentIndex = 0;
        
        // Clear flipped card
        document.getElementById('flippedCardArea').innerHTML = '';
        
        // Reset the deck display
        this.initializeDeckLayout();
        
        // Update UI and setup handlers
        this.updateDeckPlayingUI();
        this.setupCardClickHandler();
    }

    resetDeckInView() {
        // Same as resetDeck but called from the reset button
        this.resetDeck();
    }

    exitDeckView() {
        document.getElementById('deckPlayingView').classList.remove('active');
        this.currentDeck = null;
        
        // Refresh main view to show decks
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
        this.currentFilterType = null;
        document.getElementById('customFilterName').value = '';
        document.getElementById('randomFilterName').value = '';
        document.getElementById('sizeNumberInput').value = '26';
        document.getElementById('sizeSlider').value = '26';
        this.generateCardGrid();
        this.updateCreateButton();
        
        const modal = document.getElementById('modalOverlay');
        modal.classList.add('active');
        
        // Collapse all sections initially
        this.collapseAllFilterSections();
    }

    closeDeckCreation() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
    }

    collapseAllFilterSections() {
        ['random', 'custom'].forEach(filterName => {
            const header = document.querySelector(`[data-filter="${filterName}"]`);
            const content = document.getElementById(`${filterName}FilterContent`);
            const chevron = header.querySelector('.chevron');
            
            content.classList.remove('expanded');
            header.classList.remove('active');
            chevron.classList.remove('rotated');
        });
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

    toggleFilterSection(filterName) {
        const header = document.querySelector(`[data-filter="${filterName}"]`);
        const content = document.getElementById(`${filterName}FilterContent`);
        const chevron = header.querySelector('.chevron');
        
        const isExpanded = content.classList.contains('expanded');
        
        // Collapse all sections first
        this.collapseAllFilterSections();
        
        if (!isExpanded) {
            // Expand the clicked section
            content.classList.add('expanded');
            header.classList.add('active');
            chevron.classList.add('rotated');
            this.currentFilterType = filterName;
        } else {
            this.currentFilterType = null;
        }
        
        this.updateCreateButton();
    }

    updateCreateButton() {
        const createBtn = document.getElementById('createDeckBtn');
        
        if (this.currentFilterType === 'random') {
            const filterName = document.getElementById('randomFilterName').value.trim();
            const deckSize = parseInt(document.getElementById('sizeNumberInput').value);
            
            if (filterName && deckSize >= 1 && deckSize <= 52) {
                createBtn.disabled = false;
                createBtn.textContent = `Create Random Deck (${deckSize} cards)`;
            } else {
                createBtn.disabled = true;
                createBtn.textContent = 'Create Deck';
            }
        } else if (this.currentFilterType === 'custom') {
            const filterName = document.getElementById('customFilterName').value.trim();
            const hasCards = this.selectedCards.size > 0;
            
            if (filterName && hasCards) {
                createBtn.disabled = false;
                createBtn.textContent = `Create Custom Deck (${this.selectedCards.size} cards)`;
            } else {
                createBtn.disabled = true;
                createBtn.textContent = 'Create Deck';
            }
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

    createDeck() {
        if (this.currentFilterType === 'random') {
            this.createRandomDeck();
        } else if (this.currentFilterType === 'custom') {
            this.createCustomDeck();
        }
    }

    createRandomDeck() {
        const filterName = document.getElementById('randomFilterName').value.trim();
        const deckSize = parseInt(document.getElementById('sizeNumberInput').value);
        
        // Get random selection of cards
        const shuffledStandardDeck = this.shuffleArray(this.standardDeck);
        const randomCards = shuffledStandardDeck.slice(0, deckSize);
        
        // Shuffle again for practice order
        const shuffledCards = this.shuffleArray(randomCards);
        
        const newDeck = {
            id: Date.now().toString(),
            name: filterName,
            cards: shuffledCards,
            currentIndex: 0,
            createdAt: new Date().toISOString()
        };
        
        this.decks.push(newDeck);
        this.saveDecks();
        
        this.closeDeckCreation();
        this.render();
        
        console.log(`Created random deck "${filterName}" with ${shuffledCards.length} cards`);
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
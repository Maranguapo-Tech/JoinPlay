document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await db.initialize();
    
    // Theme handling
    const themeToggle = document.getElementById('darkModeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Sync theme with modal if open
            const modal = document.getElementById('newGameModal');
            if (modal) {
                const iframe = modal.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'themeChange', theme: newTheme }, '*');
                }
            }
        });
    }

    // Modal handling
    const newGameBtn = document.getElementById('newGameBtn');
    const modal = document.getElementById('newGameModal');
    
    if (newGameBtn && modal) {
        const modalOverlay = modal.querySelector('.modal-overlay');

        newGameBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Send current theme to iframe when it opens
            const iframe = modal.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                iframe.contentWindow.postMessage({ type: 'themeChange', theme: currentTheme }, '*');
            }
        });

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    // Handle messages from iframe
    window.addEventListener('message', async (event) => {
        if (event.data === 'closeModal') {
            const modal = document.getElementById('newGameModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        } else if (event.data.type === 'newGame') {
            try {
                // Save game to Supabase
                const game = await db.createGame(event.data.game);
                // Refresh games list
                await loadGames();
                // Close modal
                const modal = document.getElementById('newGameModal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            } catch (error) {
                console.error('Error creating game:', error);
                alert('Erro ao criar pelada. Por favor, tente novamente.');
            }
        } else if (event.data.type === 'updateGame') {
            try {
                // Update game in Supabase
                const game = await db.updateGame(event.data.game.id, event.data.game);
                // Refresh games list
                await loadGames();
                // Close modal
                const modal = document.getElementById('newGameModal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            } catch (error) {
                console.error('Error updating game:', error);
                alert('Erro ao atualizar pelada. Por favor, tente novamente.');
            }
        }
    });

    // Load and display games
    async function loadGames() {
        try {
            const games = await db.getGames();
            const gamesContainer = document.querySelector('.games-list');
            
            if (!gamesContainer) return;
            
            if (games.length === 0) {
                return;
            }

            gamesContainer.innerHTML = games.map(game => `
                <div class="game-card">
                    <div class="game-header">
                        <h3>${game.name}</h3>
                        <div class="game-actions">
                            <button class="action-btn edit-btn" data-game-id="${game.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" data-game-id="${game.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="location"><strong>Local:</strong> ${game.location}</p>
                    <p><strong>Dia:</strong> ${game.weekDay}</p>
                    <p><strong>Horário:</strong> ${game.time}</p>
                    <p><strong>Mensalidade:</strong> R$ ${game.monthlyFee}</p>
                    <p><strong>Diária:</strong> R$ ${game.dailyFee}</p>
                    <button class="join-btn">Participar</button>
                </div>
            `).join('');

            // Add event listeners to join buttons
            document.querySelectorAll('.join-btn').forEach((btn, index) => {
                btn.addEventListener('click', () => handleJoinGame(games[index]));
            });

            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-btn').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const gameId = e.currentTarget.dataset.gameId;
                    const game = games.find(g => g.id === gameId);
                    if (game) {
                        handleEditGame(game);
                    }
                });
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const gameId = e.currentTarget.dataset.gameId;
                    const game = games.find(g => g.id === gameId);
                    if (game) {
                        handleDeleteGame(game);
                    }
                });
            });

        } catch (error) {
            console.error('Error loading games:', error);
            alert('Erro ao carregar peladas. Por favor, recarregue a página.');
        }
    }

    async function handleJoinGame(game) {
        // TODO: Implement join game functionality
        alert('Em breve você poderá se juntar a esta pelada!');
    }

    async function handleEditGame(game) {
        const modal = document.getElementById('newGameModal');
        const iframe = modal.querySelector('iframe');
        
        if (modal && iframe) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Send current theme to iframe
            const currentTheme = document.documentElement.getAttribute('data-theme');
            iframe.contentWindow.postMessage({ type: 'themeChange', theme: currentTheme }, '*');
            
            // Send game data to iframe
            iframe.contentWindow.postMessage({ type: 'editGame', game }, '*');
        }
    }

    async function handleDeleteGame(game) {
        if (confirm('Tem certeza que deseja excluir esta pelada?')) {
            try {
                await db.deleteGame(game.id);
                await loadGames();
            } catch (error) {
                console.error('Error deleting game:', error);
                alert('Erro ao excluir pelada. Por favor, tente novamente.');
            }
        }
    }

    // Initial load
    await loadGames();
});

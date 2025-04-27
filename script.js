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
                // Envia mensagem para limpar o formulário
                const iframe = modal.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('resetForm', '*');
                }
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
                    // Envia mensagem para limpar o formulário
                    const iframe = modal.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage('resetForm', '*');
                    }
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

            console.log("chamou o loadGames()");
            console.log("Games", games);
            console.log("gamesContainer", gamesContainer);
            
            if (!gamesContainer) return;
            
            if (games.length === 0) {
                gamesContainer.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                        <p>Nenhuma pelada cadastrada ainda</p>
                        <button onclick="document.getElementById('newGameBtn').click()" class="secondary-btn">
                            Cadastrar Primeira Pelada
                        </button>
                    </div>
                `;
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
                    <div class="game-info">
                        <p><strong>Local:</strong> ${game.location}</p>
                        <p><strong>Dia:</strong> ${game.weekDay}</p>
                        <p><strong>Horário:</strong> ${game.time}</p>
                        <p><strong>Mensalistas:</strong> ${game.monthlyPlayers}</p>
                        <p><strong>Diária:</strong> R$ ${game.dailyFee}</p>
                    </div>
                </div>
            `).join('');

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

// Dropdown menu do botão de perfil - executa sempre
function setupProfileMenu() {
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });
        // Fecha o menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (profileMenu.classList.contains('active')) {
                profileMenu.classList.remove('active');
            }
        });
        // Impede que o menu feche ao clicar dentro dele
        profileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// Executa ao carregar o DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProfileMenu);
} else {
    setupProfileMenu();
}

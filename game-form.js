document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await db.initialize();
    
    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Listen for theme changes from parent window
    window.addEventListener('message', (event) => {
        if (event.data.type === 'themeChange') {
            document.documentElement.setAttribute('data-theme', event.data.theme);
        } else if (event.data.type === 'editGame') {
            loadGameData(event.data.game);
        }
    });

    // Handle form submission
    const form = document.getElementById('gameForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const gameId = document.getElementById('gameId').value;
            const gameData = {
                name: document.getElementById('gameName').value,
                location: document.getElementById('location').value,
                weekDay: document.getElementById('weekDay').value,
                time: document.getElementById('time').value,
                monthlyFee: parseFloat(document.getElementById('monthlyFee').value),
                dailyFee: parseFloat(document.getElementById('dailyFee').value)
            };

            if (gameId) {
                // Update existing game
                gameData.id = gameId;
                window.parent.postMessage({
                    type: 'updateGame',
                    game: gameData
                }, '*');
            } else {
                // Create new game
                gameData.created_at = new Date().toISOString();
                window.parent.postMessage({
                    type: 'newGame',
                    game: gameData
                }, '*');
            }
        });
    }

    // Function to close modal
    window.closeModal = () => {
        window.parent.postMessage('closeModal', '*');
    };

    // Function to load game data for editing
    function loadGameData(game) {
        document.getElementById('gameId').value = game.id;
        document.getElementById('gameName').value = game.name;
        document.getElementById('location').value = game.location;
        document.getElementById('weekDay').value = game.weekDay;
        document.getElementById('time').value = game.time;
        document.getElementById('monthlyFee').value = game.monthlyFee;
        document.getElementById('dailyFee').value = game.dailyFee;

        // Update form title and button
        document.getElementById('formTitle').textContent = 'Editar Pelada';
        document.getElementById('submitBtn').textContent = 'Salvar Alterações';
    }
});

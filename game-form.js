document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await db.initialize();
    
    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Format currency input
    const dailyFeeInput = document.getElementById('dailyFee');
    if (dailyFeeInput) {
        dailyFeeInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = (parseInt(value) / 100).toFixed(2);
            e.target.value = value;
        });
    }

    // Listen for theme changes from parent window
    window.addEventListener('message', (event) => {
        if (event.data.type === 'themeChange') {
            document.documentElement.setAttribute('data-theme', event.data.theme);
        } else if (event.data.type === 'editGame') {
            loadGameData(event.data.game);
        } else if (event.data === 'closeModal' || event.data === 'resetForm') {
            resetForm();
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
                monthlyPlayers: parseInt(document.getElementById('monthlyPlayers').value),
                dailyFee: parseFloat(document.getElementById('dailyFee').value),
                renewal_day_of_month: parseInt(document.getElementById('renewalDay').value)
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
        document.getElementById('monthlyPlayers').value = game.monthlyPlayers;
        document.getElementById('dailyFee').value = game.dailyFee.toFixed(2);
        document.getElementById('renewalDay').value = game.renewal_day_of_month;

        // Update form title and button
        document.getElementById('formTitle').textContent = 'Editar Pelada';
        document.getElementById('submitBtn').textContent = 'Salvar Alterações';
    }

    // Function to reset form
    function resetForm() {
        document.getElementById('gameId').value = '';
        document.getElementById('gameName').value = '';
        document.getElementById('location').value = '';
        document.getElementById('weekDay').value = '';
        document.getElementById('time').value = '';
        document.getElementById('monthlyPlayers').value = '';
        document.getElementById('dailyFee').value = '';
        document.getElementById('renewalDay').value = '';

        // Reset form title and button
        document.getElementById('formTitle').textContent = 'Nova Pelada';
        document.getElementById('submitBtn').textContent = 'Criar Pelada';
    }
});

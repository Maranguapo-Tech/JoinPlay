document.addEventListener('DOMContentLoaded', () => {
    // Dark mode functionality
    const themeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    function updateTheme(newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // If we're in the main window, update the iframe
        const modal = document.getElementById('newGameModal');
        if (modal) {
            const iframe = modal.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'themeChange', theme: newTheme }, '*');
            }
        }
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        updateTheme(newTheme);
    });

    // Modal functionality
    const modal = document.getElementById('newGameModal');
    const newGameBtn = document.getElementById('newGameBtn');
    const modalOverlay = modal?.querySelector('.modal-overlay');

    // Only setup modal events if we're on the main page
    if (modal && newGameBtn) {
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

        modalOverlay.addEventListener('click', () => {
            closeModal();
        });

        // Handle messages from iframe
        window.addEventListener('message', (event) => {
            if (event.data === 'closeModal') {
                closeModal();
            } else if (event.data.type === 'gameCreated') {
                closeModal();
                addGameToList(event.data.game);
            }
        });

        window.closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
    }

    // Listen for theme changes if we're in the iframe
    if (window !== window.parent) {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'themeChange') {
                document.documentElement.setAttribute('data-theme', event.data.theme);
            }
        });
    }

    // Form functionality (only on new-game.html)
    const form = document.getElementById('gameForm');
    if (form) {
        // Price input mask
        const priceInput = document.getElementById('dailyPrice');
        
        function formatPrice(value) {
            value = value.replace(/\D/g, '');
            value = (parseInt(value) / 100).toFixed(2);
            if (isNaN(value)) {
                return '';
            }
            return value;
        }

        priceInput.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const oldLength = e.target.value.length;
            
            e.target.value = formatPrice(e.target.value);
            
            const newLength = e.target.value.length;
            const newPosition = cursorPosition + (newLength - oldLength);
            e.target.setSelectionRange(newPosition, newPosition);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const gameData = {
                name: document.getElementById('gameName').value,
                location: document.getElementById('location').value,
                weekDay: document.getElementById('weekDay').value,
                time: document.getElementById('time').value,
                monthlySpots: parseInt(document.getElementById('monthlySpots').value),
                dailyPrice: parseFloat(document.getElementById('dailyPrice').value)
            };

            try {
                const submitBtn = form.querySelector('.submit-btn');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;

                // Simulate API call (remove this in production)
                console.log('Dados enviados:', gameData);
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Send message to parent window
                window.parent.postMessage({
                    type: 'gameCreated',
                    game: gameData
                }, '*');

                // Success feedback
                submitBtn.textContent = '✓ Pelada Cadastrada!';
                submitBtn.style.backgroundColor = 'var(--success-color)';
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    form.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                    
                    // Close modal
                    window.parent.postMessage('closeModal', '*');
                }, 2000);

            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao cadastrar pelada. Por favor, tente novamente.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Games list functionality
    function addGameToList(game) {
        const gamesList = document.getElementById('gamesList');
        const emptyState = gamesList.querySelector('.empty-state');
        
        if (emptyState) {
            emptyState.remove();
        }

        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <div class="game-header">
                <h3>${game.name}</h3>
                <span class="badge">${game.weekDay}</span>
            </div>
            <div class="game-info">
                <p><strong>Local:</strong> ${game.location}</p>
                <p><strong>Horário:</strong> ${game.time}</p>
                <p><strong>Vagas Mensalistas:</strong> ${game.monthlySpots}</p>
                <p><strong>Valor Diarista:</strong> R$ ${game.dailyPrice.toFixed(2)}</p>
            </div>
        `;
        
        gamesList.insertBefore(gameCard, gamesList.firstChild);
    }
});

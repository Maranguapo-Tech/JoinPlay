// organizer-crud.js
// CRUD de organizadores (usuários) via Supabase

// Depende de: services/database.js, supabase.js, config.js

// Utilitário para gerar o empty-state padronizado (igual index)
function renderEmptyStateOrganizer() {
    return `
        <div class="empty-state-organizer">
            <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            <p>Nenhum organizador cadastrado ainda</p>
            <button onclick="document.getElementById('addOrganizerBtn').click()" class="secondary-btn">
                Cadastrar Organizador
            </button>
        </div>
    `;
}

// Listar organizadores
async function loadOrganizers() {
    const list = document.getElementById('organizersList');
    const emptyState = document.getElementById('emptyStateOrganizer');
    if (!list || !emptyState) return;
    // Estado inicial: loading
    emptyState.style.display = 'block';
    emptyState.innerHTML = `<p>Carregando organizadores...</p>`;
    try {
        const organizers = await db.getOrganizers();
        list.setAttribute('data-loaded', 'true');
        if (!organizers || organizers.length === 0) {
            emptyState.innerHTML = renderEmptyStateOrganizer();
            list.querySelectorAll('.game-card').forEach(el => el.remove());
            return;
        }
        emptyState.style.display = 'none';
        list.innerHTML = '<div id="emptyStateOrganizer" class="empty-state-organizer" style="display:none"></div>' + organizers.map(org => `
            <div class="game-card" style="display: flex; align-items: center; gap: 1rem;">
                <div class="organizer-info">
                    <div class="organizer-name">${org.name}</div>
                    <div class="organizer-contact">${org.email} | ${org.phone}</div>
                    <div class="organizer-role"><span class="badge">${org.role === 'admin' ? 'Administrador' : 'Membro'}</span></div>
                </div>
                <div class="game-actions">
                    <button class="action-btn edit-btn" title="Editar" onclick="editOrganizer('${org.id}')"><i class="fa fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Excluir" onclick="deleteOrganizer('${org.id}')"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `<p>Erro ao carregar organizadores: ${error.message}</p>`;
        list.querySelectorAll('.game-card').forEach(el => el.remove());
    }
}

// Criar organizador
async function createOrganizer(data) {
    try {
        await db.createOrganizer(data);
        loadOrganizers();
    } catch (error) {
        alert('Erro ao criar organizador: ' + error.message);
    }
}

// Editar organizador (carrega dados no formulário)
function editOrganizer(id) {
    // Open organizer form in modal instead of new window
    const modal = document.getElementById('organizerModal');
    if (modal) {
        const iframe = modal.querySelector('iframe');
        iframe.src = `organizer-form.html?id=${id}`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Sync theme with iframe
        const theme = document.documentElement.getAttribute('data-theme');
        iframe.contentWindow.postMessage({ type: 'themeChange', theme }, '*');
    }
}

// Atualizar organizador
async function updateOrganizer(id, data) {
    try {
        await db.updateOrganizer(id, data);
        loadOrganizers();
    } catch (error) {
        alert('Erro ao atualizar organizador: ' + error.message);
    }
}

// Excluir organizador
async function deleteOrganizer(id) {
    if (!confirm('Tem certeza que deseja excluir este organizador?')) return;
    try {
        await db.deleteOrganizer(id);
        loadOrganizers();
    } catch (error) {
        alert('Erro ao excluir organizador: ' + error.message);
    }
}

// Utilitário para iniciais
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Exporta funções para uso global
window.loadOrganizers = loadOrganizers;
window.createOrganizer = createOrganizer;
window.editOrganizer = editOrganizer;
window.updateOrganizer = updateOrganizer;
window.deleteOrganizer = deleteOrganizer;
window.getInitials = getInitials;

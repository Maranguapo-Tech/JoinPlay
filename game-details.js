import { requireAuth } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Access global DatabaseService instance in module
  const db = window.db;

  // Default values for new participants
  const now = new Date();
  const defaultRefMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const defaultPaymentStatus = 'paid';

  // Ensure user is authenticated
  await requireAuth('login.html');
  await db.initialize();

  // Parse game ID from URL
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('id');
  if (!gameId) {
    alert('ID da pelada não fornecido.');
    window.location.href = 'index.html';
    return;
  }

  // Fetch game data
  const games = await db.getGames();
  const game = games.find(g => g.id === gameId);
  if (!game) {
    alert('Pelada não encontrada.');
    window.location.href = 'index.html';
    return;
  }

  // Render game details into #gameDetails
  const detailsTarget = document.getElementById('gameDetails');
  detailsTarget.innerHTML = `
    <div class="game-card">
      <div class="game-header">
        <h3>${game.name}</h3>
      </div>
      <div class="game-info">
        <p><strong>Local:</strong> ${game.location}</p>
        <p><strong>Dia da Semana:</strong> ${game.weekDay}</p>
        <p><strong>Horário:</strong> ${game.time}</p>
        <p><strong>Mensalistas:</strong> ${game.participants?.length || 0}/${game.monthlyPlayers}</p>
        <p><strong>Diária:</strong> R$ ${game.dailyFee}</p>
        <p><strong>Dia Renovação:</strong> ${game.renewal_day_of_month || '-'}</p>
        <p><strong>Organizador:</strong> ${game.profiles?.name || '-'}</p>
      </div>
    </div>
  `;

  // Participants UI
  // Phone input mask helper
  function maskPhoneInput(e) {
    const d = e.target.value.replace(/\D/g, '').slice(0, 13); // CC(AA)+NNNNN+NNNN
    let out = '';
    if (d.length <= 2) {
      out = '+' + d;
    } else if (d.length <= 4) {
      out = '+' + d.slice(0,2) + ' (' + d.slice(2);
    } else if (d.length <= 9) {
      out = '+' + d.slice(0,2) + ' (' + d.slice(2,4) + ') ' + d.slice(4);
    } else {
      out = '+' + d.slice(0,2) + ' (' + d.slice(2,4) + ') ' + d.slice(4,9) + '-' + d.slice(9);
    }
    e.target.value = out;
  }

  // Format raw phone digits into mask +CC (AA) NNNNN-NNNN
  function formatPhoneRaw(d) {
    const num = d.replace(/\D/g, '').slice(0,13);
    let out = '';
    if (num.length <= 2) out = '+' + num;
    else if (num.length <= 4) out = '+' + num.slice(0,2) + ' (' + num.slice(2);
    else if (num.length <= 9) out = '+' + num.slice(0,2) + ' (' + num.slice(2,4) + ') ' + num.slice(4);
    else out = '+' + num.slice(0,2) + ' (' + num.slice(2,4) + ') ' + num.slice(4,9) + '-' + num.slice(9);
    return out;
  }

  // Create a participant row element (new or existing)
  function createRow(name='', phoneRaw='', id=null) {
    const row = document.createElement('div');
    row.classList.add('participant-row');
    if (id) row.dataset.id = id;
    row.innerHTML = `
      <input type="text" name="name" placeholder="Nome" required />
      <input type="text" name="phone" placeholder="+CC (AA) NNNNN-NNNN" required title="+CC (AA) NNNNN-NNNN" />
      <button type="button" class="remove-btn">&times;</button>
    `;
    const nameInput = row.querySelector('input[name="name"]');
    const phoneInput = row.querySelector('input[name="phone"]');
    nameInput.value = name;
    phoneInput.value = formatPhoneRaw(phoneRaw);
    phoneInput.addEventListener('input', maskPhoneInput);
    row.querySelector('.remove-btn').addEventListener('click', () => {
      row.remove();
      updateEmptyState();
    });
    return row;
  }

  const staticContainer = document.getElementById('participantStatic');
  const inputContainer = document.getElementById('participantRows');
  const buttonGroup = document.querySelector('.participants-section .button-group');
  const editBtn = document.getElementById('editParticipantsBtn');
  const participantRows = inputContainer;
  const addBtn = document.getElementById('addParticipantBtn');
  const saveBtn = document.getElementById('saveParticipantsBtn');
  const cancelBtn = document.getElementById('cancelParticipantsBtn');

  // Empty state management for participants
  function updateEmptyState() {
    if (participantRows.children.length === 0) {
      participantRows.innerHTML = '<div class="empty-state">Nenhum mensalista adicionado.</div>';
    } else {
      const empty = participantRows.querySelector('.empty-state');
      if (empty) empty.remove();
    }
  }

  // Render static participants cards
  function renderStaticList(list) {
    if (!list.length) {
      staticContainer.innerHTML = '<div class="empty-state">Nenhum mensalista adicionado.</div>';
    } else {
      staticContainer.innerHTML = list.map(p =>
        `<div class="participant-card">
           <div class="name">${p.name}</div>
           <div class="phone">${formatPhoneRaw(p.phone)}</div>
         </div>`
      ).join('');
    }
  }

  // Initial view: show static, hide inputs and buttons
  staticContainer.style.display = '';
  inputContainer.style.display = 'none';
  buttonGroup.style.display = 'none';

  // Load existing participants
  try {
    const existing = await db.getParticipants(gameId);
    renderStaticList(existing);
    // Prepare editable rows hidden
    existing.forEach(p => participantRows.appendChild(createRow(p.name, p.phone, p.id)));
  } catch (e) { console.error('Error loading participants', e); }
  updateEmptyState();

  // Add a new blank participant row
  function addParticipantRow() {
    const row = createRow();
    participantRows.appendChild(row);
    updateEmptyState();
  }
  addBtn.addEventListener('click', addParticipantRow);

  // Editing toggle: replace static cards with inputs
  editBtn.addEventListener('click', () => {
    staticContainer.style.display = 'none';
    inputContainer.style.display = 'block';
    buttonGroup.style.display = 'flex';
  });

  saveBtn.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja atualizar os mensalistas para o mês corrente?')) return;
    // collect all rows as new list
    const rows = participantRows.querySelectorAll('.participant-row');
    const participants = [];
    for (const row of rows) {
      const nameInput = row.querySelector('input[name="name"]');
      const phoneInput = row.querySelector('input[name="phone"]');
      const rawPhone = phoneInput.value.replace(/\D/g, '');
      if (!nameInput.value.trim() || rawPhone.length !== 13) {
        alert('Preencha corretamente nome e telefone no formato +CC (AA) NNNNN-NNNN para todos os mensalistas.');
        return;
      }
      participants.push({ name: nameInput.value.trim(), phone: rawPhone, ref_month: defaultRefMonth, payment_status: defaultPaymentStatus });
    }
    // replace current month entries
    try {
      const { error: delError } = await window.supabaseClient
        .from('participants')
        .delete()
        .eq('game_id', gameId)
        .eq('ref_month', defaultRefMonth);
      if (delError) console.error('Error deleting participants:', delError);
      else console.log('Direct deletion succeeded');
    } catch (e) {
      console.error('Exception during direct delete:', e);
    }
    // Fallback to service method
    await db.deleteParticipantsByMonth(gameId, defaultRefMonth);
    if (participants.length) {
      await db.createParticipants(gameId, participants);
    }
    alert('Mensalistas atualizados com sucesso.');
    // reload and switch back to static view
    const all = await db.getParticipants(gameId);
    renderStaticList(all);
    staticContainer.style.display = '';
    inputContainer.style.display = 'none';
    buttonGroup.style.display = 'none';
    // refresh editable rows for next edit
    participantRows.innerHTML = '';
    all.forEach(p => participantRows.appendChild(createRow(p.name, p.phone, p.id)));
    updateEmptyState();
  });

  // Cancel editing: revert to static cards
  cancelBtn.addEventListener('click', async () => {
    // Fetch unchanged participants
    const all = await db.getParticipants(gameId);
    // Render static and hide inputs
    renderStaticList(all);
    staticContainer.style.display = '';
    inputContainer.style.display = 'none';
    buttonGroup.style.display = 'none';
    // Reset input rows for next edit
    participantRows.innerHTML = '';
    all.forEach(p => participantRows.appendChild(createRow(p.name, p.phone, p.id)));
    updateEmptyState();
  });
});

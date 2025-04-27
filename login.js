// login.js - Autenticação com Supabase

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';
        try {
            // Autentica usuário
            const { user, session } = await db.signIn(email, password);
            if (!user) throw new Error('Usuário ou senha inválidos.');

            // Busca perfil do usuário
            const profile = await db.getProfile(user.id);
            if (!profile) throw new Error('Perfil não encontrado.');

            // Checa status de pagamento
            if (profile.payment_status !== 'active') {
                alert('Seu pagamento está pendente. Regularize para acessar a ferramenta.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
                return;
            }

            // Login OK, redireciona para home
            window.location.href = '/index.html';
        } catch (error) {
            alert(error.message || 'Erro ao fazer login.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
});

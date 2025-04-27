// auth-guard.js
// Lógica reutilizável para proteger páginas por autenticação e role (Supabase)

/**
 * Protege uma página exigindo autenticação.
 * Redireciona para login.html se não houver sessão ativa.
 */
export async function requireAuth(loginRedirect = 'login.html') {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = loginRedirect;
        return false;
    }
    return true;
}

/**
 * Protege uma página exigindo autenticação e role específica.
 * Redireciona para login.html se não houver sessão ativa.
 * Redireciona para index.html se não tiver a role exigida.
 * @param {string} requiredRole - Ex: 'admin'
 * @param {string} loginRedirect
 * @param {string} noRoleRedirect
 */
export async function requireRole(requiredRole, loginRedirect = 'login.html', noRoleRedirect = 'index.html') {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = loginRedirect;
        return false;
    }
    await window.db.initialize();
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const profile = await window.db.getProfile(user.id);
    const role = profile.role;
    if (role !== requiredRole) {
        alert('Acesso restrito: apenas usuários autorizados podem acessar esta página.');
        window.location.href = noRoleRedirect;
        return false;
    }
    return true;
}

/**
 * Protege páginas em iframe (ex: modais), usando window.parent para redirecionar.
 * @param {string} requiredRole
 * @param {string} loginRedirect
 * @param {string} noRoleRedirect
 */
export async function requireRoleIframe(requiredRole, loginRedirect = 'login.html', noRoleRedirect = 'index.html') {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.parent.location.href = loginRedirect;
        return false;
    }
    await window.db.initialize();
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const profile = await window.db.getProfile(user.id);
    const role = profile.role;
    if (role !== requiredRole) {
        alert('Acesso restrito: apenas usuários autorizados podem acessar esta página.');
        window.parent.location.href = noRoleRedirect;
        return false;
    }
    return true;
}

class DatabaseService {
    constructor() {
        this.supabase = null;
    }

    async initialize() {
        if (!this.supabase) {
            this.supabase = window.supabaseClient;
        }
    }

    // Auth methods
    async signUp(email, password) {
        await this.initialize();
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        await this.initialize();
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        await this.initialize();
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    // Games methods
    async createGame(gameData) {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('games')
            .insert([gameData])
            .select();
        if (error) throw error;
        return data[0];
    }

    async getGames() {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('games')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async updateGame(gameId, updates) {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('games')
            .update(updates)
            .eq('id', gameId)
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteGame(gameId) {
        await this.initialize();
        const { error } = await this.supabase
            .from('games')
            .delete()
            .eq('id', gameId);
        if (error) throw error;
    }

    // Profile methods
    async getProfile(userId) {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    }

    async updateProfile(userId, updates) {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select();
        if (error) throw error;
        return data[0];
    }

    // Organizadores (CRUD)
    async getOrganizers() {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('profiles')
            .select('id, name, email, phone, role')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    }

    async createOrganizer(data) {
        await this.initialize();
        const { data: result, error } = await this.supabase
            .from('profiles')
            .insert([{ ...data }])
            .select();
        if (error) throw error;
        return result[0];
    }

    async updateOrganizer(id, updates) {
        await this.initialize();
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }

    async deleteOrganizer(id) {
        await this.initialize();
        const { error } = await this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // Storage methods
    async uploadAvatar(userId, file) {
        await this.initialize();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;
        const { error } = await this.supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });
        if (error) throw error;
        return this.supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
    }

    // Envia email de boas-vindas com senha temporária
    async sendWelcomeEmail(email, name, tempPassword) {
        // Ajuste para seu backend/email provider real
        // Aqui apenas simula envio (substitua pelo fetch para sua API de email ou Supabase Function)
        try {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: 'YOUR_SERVICE_ID',
                    template_id: 'YOUR_TEMPLATE_ID',
                    user_id: 'YOUR_USER_ID',
                    template_params: {
                        to_email: email,
                        to_name: name,
                        temp_password: tempPassword
                    }
                })
            });
        } catch (e) {
            // Não bloqueia cadastro se falhar envio
            console.warn('Falha ao enviar email de boas-vindas:', e);
        }
    }
}

const db = new DatabaseService();
// Expose db globally for auth-guard and other scripts
window.db = db;

class DatabaseService {
    constructor() {
        this.supabase = null;
    }

    async initialize() {
        if (!this.supabase) {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
}

const db = new DatabaseService();

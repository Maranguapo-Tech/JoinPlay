document.addEventListener('DOMContentLoaded', async () => {
    // Load logged-in user profile
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const existingProfile = await db.getProfile(user.id);
    document.getElementById('name').value = existingProfile.name || '';
    document.getElementById('email').value = existingProfile.email || '';
    document.getElementById('phone').value = existingProfile.phone || '';

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    
    function formatPhoneNumber(value) {
        // Remove all non-numeric characters
        let phoneNumber = value.replace(/\D/g, '');
        
        // Format the number
        if (phoneNumber.length === 0) {
            return '';
        }
        
        // Add country code if not present
        if (phoneNumber.length <= 2) {
            return '+' + phoneNumber;
        }
        
        // Format with country code
        if (phoneNumber.length <= 4) {
            return '+' + phoneNumber.slice(0, 2) + ' (' + phoneNumber.slice(2);
        }
        
        // Add DDD parentheses
        if (phoneNumber.length <= 6) {
            return '+' + phoneNumber.slice(0, 2) + ' (' + phoneNumber.slice(2, 4) + ') ' + phoneNumber.slice(4);
        }
        
        // Add first part of number
        if (phoneNumber.length <= 11) {
            return '+' + phoneNumber.slice(0, 2) + ' (' + phoneNumber.slice(2, 4) + ') ' + 
                   phoneNumber.slice(4, 9) + '-' + phoneNumber.slice(9);
        }
        
        // Complete number
        return '+' + phoneNumber.slice(0, 2) + ' (' + phoneNumber.slice(2, 4) + ') ' + 
               phoneNumber.slice(4, 9) + '-' + phoneNumber.slice(9, 13);
    }

    phoneInput.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        const oldLength = e.target.value.length;
        
        e.target.value = formatPhoneNumber(e.target.value);
        
        // Adjust cursor position after formatting
        const newLength = e.target.value.length;
        const newPosition = cursorPosition + (newLength - oldLength);
        e.target.setSelectionRange(newPosition, newPosition);
    });

    // Profile form submission
    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const profileData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };

        try {
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Salvando...';
            submitBtn.disabled = true;

            // Simulate API call (remove this in production)
            console.log('Dados enviados:', profileData);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Success feedback
            submitBtn.textContent = '✓ Perfil Atualizado!';
            submitBtn.style.backgroundColor = 'var(--success-color)';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.backgroundColor = '';
                submitBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao atualizar perfil. Por favor, tente novamente.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

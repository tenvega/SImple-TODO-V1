export class UserProfile {
    constructor(authService, onLogout) {
        this.authService = authService;
        this.onLogout = onLogout;
        this.container = this.createProfileElement();
    }

    createProfileElement() {
        const container = document.createElement('div');
        container.className = 'user-profile';
        
        // Get current user from auth service
        const user = this.authService.getCurrentUser();
        
        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-info">
                    <span class="user-name">${user ? user.name : 'User'}</span>
                    <span class="user-email">${user ? user.email : ''}</span>
                </div>
                <button id="logoutButton" class="logout-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Logout
                </button>
            </div>
        `;

        this.addEventListeners(container);
        return container;
    }

    addEventListeners(container) {
        const logoutButton = container.querySelector('#logoutButton');
        logoutButton.addEventListener('click', async () => {
            try {
                await this.authService.logout();
                this.onLogout();
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error during logout. Please try again.');
            }
        });
    }

    // Method to update profile info if needed
    updateProfile(user) {
        if (!user) return;
        
        const nameElement = this.container.querySelector('.user-name');
        const emailElement = this.container.querySelector('.user-email');
        
        if (nameElement) nameElement.textContent = user.name;
        if (emailElement) emailElement.textContent = user.email;
    }
} 
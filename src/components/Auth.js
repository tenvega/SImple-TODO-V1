// src/components/Auth.js
export class Auth {
    constructor(authService, onLoginSuccess) {
        this.authService = authService;
        this.onLoginSuccess = onLoginSuccess;
        this.container = document.createElement('div');
        this.container.className = 'auth-container';
        this.isLoginView = true;
        this.isSubmitting = false;
        
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="auth-card">
                <h2>${this.isLoginView ? 'Login' : 'Create Account'}</h2>
                <form id="authForm" class="auth-form">
                    ${!this.isLoginView ? `
                        <div class="form-group">
                            <label for="nameInput">Full Name</label>
                            <input type="text" id="nameInput" placeholder="Enter your full name" required>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="emailInput">Email</label>
                        <input type="email" id="emailInput" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label for="passwordInput">Password</label>
                        <input type="password" id="passwordInput" placeholder="Enter your password" required>
                    </div>
                    <div class="error-message" id="authError"></div>
                    <button type="submit" class="submit-btn" id="authSubmitBtn">
                        ${this.isLoginView ? 'Login' : 'Create Account'}
                    </button>
                </form>
                <p class="auth-switch">
                    ${this.isLoginView ? 
                        "Don't have an account? <a href='#' id='switchToRegister'>Register</a>" : 
                        "Already have an account? <a href='#' id='switchToLogin'>Login</a>"}
                </p>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        const form = this.container.querySelector('#authForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Switch between login and register
        const switchLink = this.isLoginView ? 
            this.container.querySelector('#switchToRegister') : 
            this.container.querySelector('#switchToLogin');
            
        switchLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.isLoginView = !this.isLoginView;
            this.render();
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        const errorElement = this.container.querySelector('#authError');
        errorElement.textContent = '';
        
        try {
            this.setSubmitting(true);
            
            if (this.isLoginView) {
                // Handle login
                const email = this.container.querySelector('#emailInput').value;
                const password = this.container.querySelector('#passwordInput').value;
                
                const user = await this.authService.login(email, password);
                this.onLoginSuccess(user);
            } else {
                // Handle registration
                const name = this.container.querySelector('#nameInput').value;
                const email = this.container.querySelector('#emailInput').value;
                const password = this.container.querySelector('#passwordInput').value;
                
                const user = await this.authService.register(name, email, password);
                this.onLoginSuccess(user);
            }
        } catch (error) {
            errorElement.textContent = error.message;
        } finally {
            this.setSubmitting(false);
        }
    }

    setSubmitting(submitting) {
        this.isSubmitting = submitting;
        const submitBtn = this.container.querySelector('#authSubmitBtn');
        submitBtn.disabled = submitting;
        submitBtn.textContent = submitting ? 
            (this.isLoginView ? 'Logging in...' : 'Creating account...') : 
            (this.isLoginView ? 'Login' : 'Create Account');
    }
}

// src/components/UserProfile.js
export class UserProfile {
    constructor(authService, onLogout) {
        this.authService = authService;
        this.onLogout = onLogout;
        this.user = this.authService.getCurrentUser();
        this.container = document.createElement('div');
        this.container.className = 'user-profile';
        
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${this.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="profile-info">
                        <h3>${this.user.name}</h3>
                        <p>${this.user.email}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button id="logoutBtn" class="logout-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 2H10C11.1046 2 12 2.89543 12 4V12C12 13.1046 11.1046 14 10 14H6C4.89543 14 4 13.1046 4 12V4C4 2.89543 4.89543 2 6 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                            <path d="M9 8H1M1 8L3 6M1 8L3 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;

        const logoutBtn = this.container.querySelector('#logoutBtn');
        logoutBtn.addEventListener('click', () => {
            this.authService.logout();
            this.onLogout();
        });
    }
}

// Add these styles to your CSS file
/*
.auth-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
}

.auth-card {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.auth-card h2 {
    margin-bottom: 1.5rem;
    text-align: center;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: bold;
    font-size: 0.875rem;
}

.error-message {
    color: var(--destructive);
    font-size: 0.875rem;
    min-height: 1.25rem;
}

.submit-btn {
    margin-top: 1rem;
    height: 2.75rem;
}

.auth-switch {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
}

.user-profile {
    margin-bottom: 1.5rem;
}

.profile-card {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.profile-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--primary);
    color: var(--primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
}

.profile-info h3 {
    margin: 0;
    font-size: 1rem;
}

.profile-info p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.875rem;
}

.logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: transparent;
    color: var(--destructive);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
}

.logout-btn:hover {
    background-color: color-mix(in srgb, var(--destructive) 5%, transparent);
}
*/

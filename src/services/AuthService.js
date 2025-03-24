// src/services/AuthService.js
export class AuthService {
    constructor() {
        this.tokenKey = 'authToken';
        this.userKey = 'userData';
        this.listeners = [];
        this.baseUrl = 'http://localhost:3001/api/users';
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Get auth token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Subscribe to auth changes
    subscribe(listener) {
        this.listeners.push(listener);
        // Immediately notify the listener of current auth state
        listener(this.isAuthenticated(), this.getCurrentUser());
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners of auth changes
    notifyListeners() {
        this.listeners.forEach(listener => {
            listener(this.isAuthenticated(), this.getCurrentUser());
        });
    }

    // Register a new user
    async register(name, email, password) {
        try {
            const response = await fetch('http://localhost:3001/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            this.setToken(data.token);
            this.setUser(data.user);
            return data.user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            this.setToken(data.token);
            this.setUser(data.user);
            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        // Optionally dispatch an event to notify other parts of the app
        window.dispatchEvent(new Event('logout'));
    }

    // Set session data
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await fetch('http://localhost:3001/api/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.logout();
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get profile');
            }

            const user = await response.json();
            this.setUser(user);
            this.notifyListeners();
            return user;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    async updateProfile(userData) {
        try {
            const response = await fetch('http://localhost:3001/api/users/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Profile update failed');
            }

            const updatedUser = await response.json();
            this.setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await fetch('http://localhost:3001/api/users/refresh-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.setToken(data.token);
            return data.token;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
        }
    }
}
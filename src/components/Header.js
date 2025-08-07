/**
 * Header Component
 * Modular header extracted from index.html
 */

export class Header {
    constructor() {
        this.element = null;
    }

    render() {
        const header = document.createElement('header');
        header.className = 'header';
        header.innerHTML = `
            <div class="header-content">
                <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Guest Communication</span>
                </div>
                <nav class="nav" role="navigation" aria-label="Main navigation">
                    <a href="#dashboard" class="nav-link active" data-section="dashboard">Dashboard</a>
                    <a href="#feedback" class="nav-link" data-section="feedback">Feedback</a>
                    <a href="#analytics" class="nav-link" data-section="analytics">Analytics</a>
                    <a href="#integrations" class="nav-link" data-section="integrations">Integrations</a>
                    <a href="#settings" class="nav-link" data-section="settings">Settings</a>
                </nav>
                <div class="user-menu">
                    <button class="btn btn-secondary" id="user-menu-btn" aria-label="User menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span class="user-name">Hotel Admin</span>
                    </button>
                </div>
            </div>
        `;

        this.element = header;
        this.attachEventListeners();
        return header;
    }

    attachEventListeners() {
        // Navigation link clicks
        const navLinks = this.element.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(link);
            });
        });

        // User menu button
        const userMenuBtn = this.element.querySelector('#user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                this.toggleUserMenu();
            });
        }
    }

    handleNavigation(clickedLink) {
        // Remove active class from all links
        this.element.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to clicked link
        clickedLink.classList.add('active');

        // Dispatch navigation event
        const section = clickedLink.dataset.section;
        const event = new CustomEvent('navigation', { detail: { section } });
        document.dispatchEvent(event);
    }

    toggleUserMenu() {
        // Create or toggle user dropdown menu
        let dropdown = this.element.querySelector('.user-dropdown');
        
        if (!dropdown) {
            dropdown = this.createUserDropdown();
            this.element.querySelector('.user-menu').appendChild(dropdown);
        } else {
            dropdown.classList.toggle('active');
        }
    }

    createUserDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-menu">
                <a href="#profile" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                </a>
                <a href="#account" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                    Account Settings
                </a>
                <hr class="dropdown-divider">
                <a href="#logout" class="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                </a>
            </div>
        `;

        // Add dropdown styles
        const style = document.createElement('style');
        style.textContent = `
            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 0.5rem;
                background: var(--surface);
                border-radius: var(--border-radius-sm);
                box-shadow: var(--shadow-lg);
                display: none;
                z-index: 1001;
            }
            .user-dropdown.active {
                display: block;
            }
            .dropdown-menu {
                padding: 0.5rem;
                min-width: 200px;
            }
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                color: var(--text-medium);
                text-decoration: none;
                border-radius: var(--border-radius-sm);
                transition: all var(--transition-fast);
            }
            .dropdown-item:hover {
                background: var(--border-light);
                color: var(--primary-color);
            }
            .dropdown-divider {
                margin: 0.5rem 0;
                border: none;
                border-top: 1px solid var(--border-light);
            }
            .user-menu {
                position: relative;
            }
        `;
        document.head.appendChild(style);

        return dropdown;
    }

    updateUserInfo(userName) {
        const userNameElement = this.element.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    setActiveSection(section) {
        this.element.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.section === section) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}
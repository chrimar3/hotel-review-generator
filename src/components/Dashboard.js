/**
 * Dashboard Component
 * Main dashboard view extracted from index.html
 */

export class Dashboard {
    constructor(services) {
        this.services = services;
        this.element = null;
        this.stats = {
            totalFeedback: 0,
            averageRating: 0,
            responseRate: 0,
            activeIntegrations: 0
        };
    }

    render() {
        const dashboard = document.createElement('div');
        dashboard.className = 'dashboard-container';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h1 class="dashboard-title">Hotel Dashboard</h1>
                <div class="dashboard-actions">
                    <button class="btn btn-primary" id="new-feedback-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Request Feedback
                    </button>
                    <button class="btn btn-secondary" id="export-data-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export Data
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                ${this.renderStatCards()}
            </div>

            <div class="dashboard-content">
                <div class="dashboard-row">
                    <div class="card flex-2">
                        <div class="card-header">
                            <h2 class="card-title">Recent Feedback</h2>
                            <button class="btn-link" id="view-all-feedback">View All</button>
                        </div>
                        <div class="card-body" id="recent-feedback-list">
                            ${this.renderRecentFeedback()}
                        </div>
                    </div>
                    <div class="card flex-1">
                        <div class="card-header">
                            <h2 class="card-title">Quick Actions</h2>
                        </div>
                        <div class="card-body">
                            ${this.renderQuickActions()}
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Analytics Overview</h2>
                            <select class="form-select" id="analytics-period">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                            </select>
                        </div>
                        <div class="card-body">
                            <canvas id="analytics-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">System Status</h2>
                        </div>
                        <div class="card-body" id="system-status">
                            ${this.renderSystemStatus()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.element = dashboard;
        this.attachEventListeners();
        this.loadDashboardData();
        return dashboard;
    }

    renderStatCards() {
        return `
            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary-color)" stroke="none">
                        <path d="M21 8.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5zm-3 8c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5zm-6-4c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5zm-6 4c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5zm-3-8c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5c0 .829.672 1.5 1.5 1.5s1.5-.671 1.5-1.5z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="total-feedback">${this.stats.totalFeedback}</div>
                    <div class="stat-label">Total Feedback</div>
                    <div class="stat-change positive">+12% from last month</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--success-color)" stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="avg-rating">${this.stats.averageRating.toFixed(1)}</div>
                    <div class="stat-label">Average Rating</div>
                    <div class="stat-change positive">+0.3 from last month</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--warning-color)" stroke="none">
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="response-rate">${this.stats.responseRate}%</div>
                    <div class="stat-label">Response Rate</div>
                    <div class="stat-change positive">+5% from last month</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--secondary-color)" stroke="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value" id="active-integrations">${this.stats.activeIntegrations}</div>
                    <div class="stat-label">Active Integrations</div>
                    <div class="stat-change neutral">No change</div>
                </div>
            </div>
        `;
    }

    renderRecentFeedback() {
        // Mock recent feedback - in production, fetch from service
        const recentFeedback = [
            { guest: 'John Doe', rating: 5, date: '2024-01-20', summary: 'Excellent service!' },
            { guest: 'Jane Smith', rating: 4, date: '2024-01-19', summary: 'Very good stay' },
            { guest: 'Mike Johnson', rating: 5, date: '2024-01-19', summary: 'Will definitely return' }
        ];

        return recentFeedback.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <span class="feedback-guest">${feedback.guest}</span>
                    <span class="feedback-rating">${'⭐'.repeat(feedback.rating)}</span>
                </div>
                <p class="feedback-summary">${feedback.summary}</p>
                <span class="feedback-date">${feedback.date}</span>
            </div>
        `).join('');
    }

    renderQuickActions() {
        return `
            <div class="quick-actions">
                <button class="quick-action-btn" data-action="send-feedback-request">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                    <span>Send Feedback Request</span>
                </button>
                <button class="quick-action-btn" data-action="view-analytics">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span>View Analytics</span>
                </button>
                <button class="quick-action-btn" data-action="manage-templates">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Manage Templates</span>
                </button>
                <button class="quick-action-btn" data-action="sync-data">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                    <span>Sync Data</span>
                </button>
            </div>
        `;
    }

    renderSystemStatus() {
        return `
            <div class="system-status-grid">
                <div class="status-item">
                    <span class="status-indicator success"></span>
                    <span class="status-label">CRM Integration</span>
                    <span class="status-value">Connected</span>
                </div>
                <div class="status-item">
                    <span class="status-indicator success"></span>
                    <span class="status-label">Email Service</span>
                    <span class="status-value">Operational</span>
                </div>
                <div class="status-item">
                    <span class="status-indicator warning"></span>
                    <span class="status-label">Analytics Engine</span>
                    <span class="status-value">Processing</span>
                </div>
                <div class="status-item">
                    <span class="status-indicator success"></span>
                    <span class="status-label">Database</span>
                    <span class="status-value">Healthy</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // New feedback button
        const newFeedbackBtn = this.element.querySelector('#new-feedback-btn');
        if (newFeedbackBtn) {
            newFeedbackBtn.addEventListener('click', () => {
                this.openFeedbackModal();
            });
        }

        // Export data button
        const exportBtn = this.element.querySelector('#export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Quick action buttons
        const quickActionBtns = this.element.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleQuickAction(btn.dataset.action);
            });
        });

        // Analytics period selector
        const periodSelector = this.element.querySelector('#analytics-period');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.updateAnalytics(e.target.value);
            });
        }
    }

    loadDashboardData() {
        // Load data from services
        if (this.services?.feedbackService) {
            const feedbackData = this.services.feedbackService.getAllFeedback();
            this.stats.totalFeedback = feedbackData.length;
            this.stats.averageRating = this.calculateAverageRating(feedbackData);
        }

        if (this.services?.crmService) {
            const integrations = this.services.crmService.getConnectedSystems();
            this.stats.activeIntegrations = integrations.length;
        }

        this.stats.responseRate = 67; // Mock value

        this.updateStatDisplays();
    }

    calculateAverageRating(feedbackData) {
        if (!feedbackData || feedbackData.length === 0) return 0;
        const sum = feedbackData.reduce((acc, item) => acc + (item.rating || 0), 0);
        return sum / feedbackData.length;
    }

    updateStatDisplays() {
        const elements = {
            'total-feedback': this.stats.totalFeedback,
            'avg-rating': this.stats.averageRating.toFixed(1),
            'response-rate': this.stats.responseRate,
            'active-integrations': this.stats.activeIntegrations
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = this.element.querySelector(`#${id}`);
            if (element) {
                element.textContent = value;
            }
        });
    }

    openFeedbackModal() {
        const event = new CustomEvent('openModal', { detail: { type: 'feedback' } });
        document.dispatchEvent(event);
    }

    exportData() {
        if (this.services?.exportService) {
            this.services.exportService.exportDashboardData();
        }
    }

    handleQuickAction(action) {
        const event = new CustomEvent('quickAction', { detail: { action } });
        document.dispatchEvent(event);
    }

    updateAnalytics(period) {
        // Update analytics chart based on selected period
        if (this.services?.analyticsService) {
            this.services.analyticsService.updatePeriod(period);
        }
    }

    refresh() {
        this.loadDashboardData();
    }
}
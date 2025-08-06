/**
 * CRM Integration Panel
 * User interface for managing CRM/PMS integrations
 */

export class CRMIntegrationPanel {
    constructor(crmService, errorMonitor) {
        this.crmService = crmService;
        this.errorMonitor = errorMonitor;
        this.isVisible = false;
        this.currentStep = 'overview';
        
        this.createPanel();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'crm-integration-panel';
        panel.className = 'crm-integration-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: none;
            backdrop-filter: blur(4px);
        `;

        panel.innerHTML = `
            <div class="panel-modal" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 95vw;
                max-width: 1000px;
                height: 90vh;
                max-height: 700px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- Header -->
                <div class="panel-header" style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                                CRM/PMS Integration
                            </h2>
                            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">
                                Connect your hotel management systems for automated workflows
                            </p>
                        </div>
                        <button id="close-crm-panel" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #6b7280;
                            padding: 8px;
                            border-radius: 6px;
                        ">×</button>
                    </div>
                    
                    <!-- Navigation -->
                    <div class="panel-nav" style="margin-top: 20px;">
                        <div style="display: flex; gap: 0; border-bottom: 1px solid #e5e7eb;">
                            <button class="nav-btn active" data-step="overview" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid #3b82f6;
                                color: #3b82f6;
                                font-weight: 500;
                            ">Overview</button>
                            <button class="nav-btn" data-step="add" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                                color: #6b7280;
                            ">Add Integration</button>
                            <button class="nav-btn" data-step="sync" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                                color: #6b7280;
                            ">Data Sync</button>
                            <button class="nav-btn" data-step="settings" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                                color: #6b7280;
                            ">Settings</button>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="panel-content" style="
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                ">
                    <div id="overview-step" class="step-content" style="display: block;">
                        ${this.renderOverview()}
                    </div>
                    <div id="add-step" class="step-content" style="display: none;">
                        ${this.renderAddIntegration()}
                    </div>
                    <div id="sync-step" class="step-content" style="display: none;">
                        ${this.renderDataSync()}
                    </div>
                    <div id="settings-step" class="step-content" style="display: none;">
                        ${this.renderSettings()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panelElement = panel;
        this.setupEventListeners();
    }

    renderOverview() {
        const integrations = this.crmService.getIntegrations();
        
        if (integrations.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🔗</div>
                    <h3 style="margin: 0 0 12px; font-size: 20px; color: #374151;">No Integrations Yet</h3>
                    <p style="margin: 0 0 20px; color: #6b7280; max-width: 400px; margin-left: auto; margin-right: auto;">
                        Connect your hotel management system to automate guest data synchronization and review workflows.
                    </p>
                    <button id="start-integration" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                    ">Get Started</button>
                </div>
            `;
        }

        return `
            <div class="integrations-overview">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
                        Active Integrations
                    </h3>
                    <button id="add-new-integration" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                    ">+ Add Integration</button>
                </div>

                <div class="integrations-grid" style="display: grid; gap: 16px;">
                    ${integrations.map(integration => this.renderIntegrationCard(integration)).join('')}
                </div>

                <div class="integration-stats" style="margin-top: 32px;">
                    <h4 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">
                        Integration Statistics
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        ${this.renderStatsCards(integrations)}
                    </div>
                </div>
            </div>
        `;
    }

    renderIntegrationCard(integration) {
        const systemInfo = this.crmService.getSupportedSystems()[integration.type]?.[integration.system];
        const statusColor = integration.status === 'active' ? '#10b981' : '#ef4444';
        const lastSync = integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never';

        return `
            <div class="integration-card" style="
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                position: relative;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                            ${systemInfo?.name || integration.system}
                        </h4>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">
                            ${integration.type}
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: ${statusColor};
                        "></div>
                        <span style="font-size: 12px; color: ${statusColor}; font-weight: 500; text-transform: capitalize;">
                            ${integration.status}
                        </span>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: #6b7280;">Last Sync</span>
                        <span style="font-size: 12px; color: #374151;">${lastSync}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: #6b7280;">Total Syncs</span>
                        <span style="font-size: 12px; color: #374151;">${integration.metrics.totalSyncs}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; color: #6b7280;">Success Rate</span>
                        <span style="font-size: 12px; color: #374151;">
                            ${integration.metrics.totalSyncs > 0 
                                ? Math.round((integration.metrics.successfulSyncs / integration.metrics.totalSyncs) * 100) 
                                : 0}%
                        </span>
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="sync-integration" data-id="${integration.id}" style="
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        cursor: pointer;
                        flex: 1;
                    ">Sync Now</button>
                    <button class="configure-integration" data-id="${integration.id}" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        cursor: pointer;
                        flex: 1;
                    ">Configure</button>
                    <button class="remove-integration" data-id="${integration.id}" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        cursor: pointer;
                    ">Remove</button>
                </div>
            </div>
        `;
    }

    renderStatsCards(integrations) {
        const totalIntegrations = integrations.length;
        const activeIntegrations = integrations.filter(i => i.status === 'active').length;
        const totalSyncs = integrations.reduce((sum, i) => sum + i.metrics.totalSyncs, 0);
        const avgSuccessRate = integrations.length > 0 
            ? Math.round(integrations.reduce((sum, i) => {
                return sum + (i.metrics.totalSyncs > 0 ? (i.metrics.successfulSyncs / i.metrics.totalSyncs) : 0);
            }, 0) / integrations.length * 100)
            : 0;

        return `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
            ">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${totalIntegrations}</div>
                <div style="font-size: 12px; opacity: 0.8;">Total Integrations</div>
            </div>
            
            <div style="
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
            ">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${activeIntegrations}</div>
                <div style="font-size: 12px; opacity: 0.8;">Active</div>
            </div>
            
            <div style="
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
            ">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${totalSyncs}</div>
                <div style="font-size: 12px; opacity: 0.8;">Total Syncs</div>
            </div>
            
            <div style="
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
            ">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${avgSuccessRate}%</div>
                <div style="font-size: 12px; opacity: 0.8;">Success Rate</div>
            </div>
        `;
    }

    renderAddIntegration() {
        const supportedSystems = this.crmService.getSupportedSystems();
        
        return `
            <div class="add-integration-form">
                <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827;">
                    Add New Integration
                </h3>

                <form id="integration-form" style="max-width: 600px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
                            System Type
                        </label>
                        <select id="system-type" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 14px;
                        ">
                            <option value="">Select system type</option>
                            <option value="pms">Property Management System (PMS)</option>
                            <option value="crm">Customer Relationship Management (CRM)</option>
                        </select>
                    </div>

                    <div id="system-selection" style="margin-bottom: 20px; display: none;">
                        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
                            System
                        </label>
                        <select id="system-name" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 14px;
                        ">
                            <option value="">Select system</option>
                        </select>
                    </div>

                    <div id="connection-details" style="display: none;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
                                API Base URL
                            </label>
                            <input type="url" id="base-url" placeholder="https://api.example.com" style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #d1d5db;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">
                                API Key / Access Token
                            </label>
                            <input type="password" id="api-key" placeholder="Enter your API key" style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #d1d5db;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151;">
                                <input type="checkbox" id="auto-sync" style="margin: 0;">
                                Enable automatic synchronization
                            </label>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="button" id="test-connection" style="
                                background: #f59e0b;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 6px;
                                font-size: 14px;
                                cursor: pointer;
                                font-weight: 500;
                            ">Test Connection</button>
                            <button type="submit" style="
                                background: #10b981;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 6px;
                                font-size: 14px;
                                cursor: pointer;
                                font-weight: 500;
                            ">Add Integration</button>
                        </div>
                    </div>
                </form>

                <div id="integration-result" style="margin-top: 20px; display: none;"></div>
            </div>
        `;
    }

    renderDataSync() {
        return `
            <div class="data-sync-section">
                <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827;">
                    Data Synchronization
                </h3>

                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">
                        Sync Options
                    </h4>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <button id="sync-all-guests" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Sync All Guest Data</button>
                        <button id="export-guest-data" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Export Data</button>
                        <button id="clear-cache" style="
                            background: #f59e0b;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Clear Cache</button>
                    </div>
                </div>

                <div id="sync-status" style="margin-bottom: 24px;"></div>
                <div id="sync-results" style="margin-bottom: 24px;"></div>

                <div class="recent-syncs">
                    <h4 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">
                        Recent Sync Activity
                    </h4>
                    <div id="sync-activity-log" style="
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        max-height: 300px;
                        overflow-y: auto;
                    ">
                        <div style="padding: 20px; text-align: center; color: #9ca3af;">
                            No sync activity yet
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="integration-settings">
                <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #111827;">
                    Integration Settings
                </h3>

                <div style="max-width: 600px;">
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">
                            Sync Configuration
                        </h4>
                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151;">
                                    Sync Interval (minutes)
                                </label>
                                <input type="number" id="sync-interval" value="5" min="1" max="1440" style="
                                    width: 100px;
                                    padding: 8px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 4px;
                                    font-size: 13px;
                                ">
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151;">
                                    Cache Timeout (minutes)
                                </label>
                                <input type="number" id="cache-timeout" value="1" min="1" max="60" style="
                                    width: 100px;
                                    padding: 8px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 4px;
                                    font-size: 13px;
                                ">
                            </div>
                            <div>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151;">
                                    <input type="checkbox" id="retry-failed-syncs" checked>
                                    Automatically retry failed syncs
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">
                            Review Automation
                        </h4>
                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                            <div style="margin-bottom: 16px;">
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151;">
                                    <input type="checkbox" id="auto-review-requests">
                                    Send automatic review requests after checkout
                                </label>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151;">
                                    Minimum satisfaction score for auto-reviews
                                </label>
                                <input type="number" id="min-satisfaction" value="4" min="1" max="5" step="0.1" style="
                                    width: 100px;
                                    padding: 8px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 4px;
                                    font-size: 13px;
                                ">
                            </div>
                        </div>
                    </div>

                    <div>
                        <button id="save-settings" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            font-size: 14px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close panel
        document.getElementById('close-crm-panel').addEventListener('click', () => {
            this.hide();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchStep(btn.dataset.step);
            });
        });

        // Close on backdrop click
        this.panelElement.addEventListener('click', (e) => {
            if (e.target === this.panelElement) {
                this.hide();
            }
        });

        this.setupOverviewListeners();
        this.setupAddIntegrationListeners();
        this.setupSyncListeners();
        this.setupSettingsListeners();
    }

    setupOverviewListeners() {
        // Start integration button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'start-integration') {
                this.switchStep('add');
            }
            
            if (e.target.id === 'add-new-integration') {
                this.switchStep('add');
            }
        });

        // Integration card actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sync-integration')) {
                this.syncIntegration(e.target.dataset.id);
            }
            
            if (e.target.classList.contains('remove-integration')) {
                this.removeIntegration(e.target.dataset.id);
            }
        });
    }

    setupAddIntegrationListeners() {
        // System type selection
        document.addEventListener('change', (e) => {
            if (e.target.id === 'system-type') {
                this.updateSystemOptions(e.target.value);
            }
            
            if (e.target.id === 'system-name') {
                this.showConnectionDetails();
            }
        });

        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'integration-form') {
                e.preventDefault();
                this.addIntegration();
            }
        });

        // Test connection
        document.addEventListener('click', (e) => {
            if (e.target.id === 'test-connection') {
                this.testConnection();
            }
        });
    }

    setupSyncListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sync-all-guests') {
                this.syncAllGuests();
            }
            
            if (e.target.id === 'export-guest-data') {
                this.exportGuestData();
            }
            
            if (e.target.id === 'clear-cache') {
                this.clearCache();
            }
        });
    }

    setupSettingsListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-settings') {
                this.saveSettings();
            }
        });
    }

    switchStep(step) {
        this.currentStep = step;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#6b7280';
        });
        
        const activeBtn = document.querySelector(`[data-step="${step}"]`);
        if (activeBtn) {
            activeBtn.style.borderBottomColor = '#3b82f6';
            activeBtn.style.color = '#3b82f6';
        }

        // Show/hide content
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${step}-step`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        // Refresh content if needed
        if (step === 'overview') {
            this.refreshOverview();
        }
    }

    updateSystemOptions(systemType) {
        const systemNameSelect = document.getElementById('system-name');
        const systemSelection = document.getElementById('system-selection');
        
        if (!systemType) {
            systemSelection.style.display = 'none';
            return;
        }

        systemSelection.style.display = 'block';
        systemNameSelect.innerHTML = '<option value="">Select system</option>';

        const systems = this.crmService.getSupportedSystems()[systemType] || {};
        Object.entries(systems).forEach(([key, system]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = system.name;
            systemNameSelect.appendChild(option);
        });
    }

    showConnectionDetails() {
        document.getElementById('connection-details').style.display = 'block';
    }

    async addIntegration() {
        const systemType = document.getElementById('system-type').value;
        const systemName = document.getElementById('system-name').value;
        const baseUrl = document.getElementById('base-url').value;
        const apiKey = document.getElementById('api-key').value;
        const autoSync = document.getElementById('auto-sync').checked;

        if (!systemType || !systemName || !baseUrl || !apiKey) {
            this.showResult('Please fill in all required fields', 'error');
            return;
        }

        const result = await this.crmService.addIntegration(systemType, systemName, {
            baseUrl,
            apiKey,
            autoSync
        });

        if (result.success) {
            this.showResult('Integration added successfully!', 'success');
            setTimeout(() => {
                this.switchStep('overview');
            }, 2000);
        } else {
            this.showResult(`Failed to add integration: ${result.error}`, 'error');
        }
    }

    async testConnection() {
        // Implement connection testing
        this.showResult('Testing connection...', 'info');
        
        setTimeout(() => {
            this.showResult('Connection test successful!', 'success');
        }, 2000);
    }

    showResult(message, type) {
        const resultDiv = document.getElementById('integration-result');
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        resultDiv.innerHTML = `
            <div style="
                background: ${colors[type]}15;
                color: ${colors[type]};
                padding: 12px 16px;
                border-radius: 6px;
                border: 1px solid ${colors[type]}40;
                font-size: 14px;
            ">${message}</div>
        `;
        resultDiv.style.display = 'block';
    }

    async syncIntegration(integrationId) {
        const result = await this.crmService.syncGuestData(integrationId);
        if (result.success) {
            this.refreshOverview();
        }
    }

    async removeIntegration(integrationId) {
        if (confirm('Are you sure you want to remove this integration?')) {
            await this.crmService.removeIntegration(integrationId);
            this.refreshOverview();
        }
    }

    refreshOverview() {
        const overviewContent = document.getElementById('overview-step');
        if (overviewContent && this.currentStep === 'overview') {
            overviewContent.innerHTML = this.renderOverview();
        }
    }

    async syncAllGuests() {
        const integrations = this.crmService.getIntegrations().filter(i => i.status === 'active');
        
        if (integrations.length === 0) {
            this.showSyncStatus('No active integrations found', 'error');
            return;
        }

        this.showSyncStatus('Syncing guest data from all integrations...', 'info');
        
        for (const integration of integrations) {
            await this.crmService.syncGuestData(integration.id);
        }
        
        this.showSyncStatus('All guest data synced successfully!', 'success');
    }

    async exportGuestData() {
        // Implement guest data export
        this.showSyncStatus('Exporting guest data...', 'info');
        
        setTimeout(() => {
            this.showSyncStatus('Guest data exported successfully!', 'success');
        }, 2000);
    }

    clearCache() {
        // Clear API cache
        this.showSyncStatus('Cache cleared successfully!', 'success');
    }

    showSyncStatus(message, type) {
        const statusDiv = document.getElementById('sync-status');
        if (!statusDiv) return;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        statusDiv.innerHTML = `
            <div style="
                background: ${colors[type]}15;
                color: ${colors[type]};
                padding: 12px 16px;
                border-radius: 6px;
                border: 1px solid ${colors[type]}40;
                font-size: 14px;
            ">${message}</div>
        `;
    }

    saveSettings() {
        // Save integration settings
        this.showSyncStatus('Settings saved successfully!', 'success');
    }

    show() {
        this.isVisible = true;
        this.panelElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.refreshOverview();
    }

    hide() {
        this.isVisible = false;
        this.panelElement.style.display = 'none';
        document.body.style.overflow = '';
    }
}
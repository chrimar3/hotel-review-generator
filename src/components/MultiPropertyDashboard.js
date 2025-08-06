/**
 * Multi-Property Management Dashboard
 * Allows users to manage reviews for multiple hotel properties
 * Part of the Advanced Platform Integration feature set
 */

export class MultiPropertyDashboard {
    constructor(appCore) {
        this.appCore = appCore;
        this.properties = [];
        this.currentPropertyId = null;
        this.templates = {};
        this.isVisible = false;

        this.initialize();
    }

    initialize() {
        this.loadStoredProperties();
        this.createDashboardUI();
        this.setupEventListeners();
        
        if (typeof console !== 'undefined') {
            console.log('[MultiProperty] Dashboard initialized with', this.properties.length, 'properties');
        }
    }

    loadStoredProperties() {
        try {
            const stored = localStorage.getItem('hotel_properties');
            if (stored) {
                this.properties = JSON.parse(stored);
            } else {
                // Initialize with current hotel if available
                const currentHotel = this.appCore.getState().hotelName;
                if (currentHotel && currentHotel !== 'Your Hotel') {
                    this.properties = [{
                        id: this.generateId(),
                        name: currentHotel,
                        address: '',
                        type: 'hotel',
                        features: [...this.appCore.getConfig().features],
                        staff: [...this.appCore.getConfig().staffMembers],
                        templates: {},
                        active: true,
                        createdAt: new Date().toISOString()
                    }];
                    this.currentPropertyId = this.properties[0].id;
                }
            }
        } catch (error) {
            this.appCore.getServices().errorMonitor?.trackError('property_load_failed', error);
        }
    }

    saveProperties() {
        try {
            localStorage.setItem('hotel_properties', JSON.stringify(this.properties));
            this.appCore.getServices().errorMonitor?.trackUserAction('properties_saved', {
                count: this.properties.length
            });
        } catch (error) {
            this.appCore.getServices().errorMonitor?.trackError('property_save_failed', error);
        }
    }

    createDashboardUI() {
        // Create main dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'multi-property-dashboard';
        dashboard.className = 'multi-property-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            backdrop-filter: blur(4px);
        `;

        dashboard.innerHTML = `
            <div class="dashboard-modal" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 90vw;
                max-width: 1200px;
                height: 90vh;
                max-height: 800px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- Header -->
                <div class="dashboard-header" style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                                Multi-Property Management
                            </h2>
                            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">
                                Manage reviews and templates for multiple hotel properties
                            </p>
                        </div>
                        <button id="close-dashboard" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #6b7280;
                            padding: 8px;
                            border-radius: 6px;
                            transition: all 0.2s;
                        ">×</button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="dashboard-content" style="
                    display: flex;
                    flex: 1;
                    min-height: 0;
                ">
                    <!-- Sidebar -->
                    <div class="dashboard-sidebar" style="
                        width: 300px;
                        border-right: 1px solid #e5e7eb;
                        padding: 20px;
                        overflow-y: auto;
                        flex-shrink: 0;
                    ">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">
                                Properties
                            </h3>
                            <button id="add-property" style="
                                background: #3b82f6;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                cursor: pointer;
                                font-weight: 500;
                            ">+ Add</button>
                        </div>
                        <div id="properties-list" class="properties-list">
                            <!-- Properties will be inserted here -->
                        </div>
                    </div>

                    <!-- Main Panel -->
                    <div class="dashboard-main" style="
                        flex: 1;
                        padding: 20px;
                        overflow-y: auto;
                    ">
                        <div id="property-details" class="property-details">
                            <!-- Property details will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        this.dashboardElement = dashboard;
        
        this.renderPropertiesList();
        this.renderPropertyDetails();
    }

    setupEventListeners() {
        // Close dashboard
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hide();
        });

        // Close on backdrop click
        this.dashboardElement.addEventListener('click', (e) => {
            if (e.target === this.dashboardElement) {
                this.hide();
            }
        });

        // Add property button
        document.getElementById('add-property').addEventListener('click', () => {
            this.showAddPropertyForm();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Escape') {
                this.hide();
            }
        });
    }

    renderPropertiesList() {
        const container = document.getElementById('properties-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.properties.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🏨</div>
                    <p style="margin: 0; font-size: 14px;">No properties yet</p>
                    <p style="margin: 4px 0 0; font-size: 12px;">Add your first property to get started</p>
                </div>
            `;
            return;
        }

        this.properties.forEach(property => {
            const item = document.createElement('div');
            item.className = 'property-item';
            item.style.cssText = `
                padding: 12px;
                border: 1px solid ${property.id === this.currentPropertyId ? '#3b82f6' : '#e5e7eb'};
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                background: ${property.id === this.currentPropertyId ? '#eff6ff' : 'white'};
                transition: all 0.2s;
            `;

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">
                            ${property.name}
                        </h4>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">
                            ${property.type} • ${property.active ? 'Active' : 'Inactive'}
                        </p>
                        ${property.address ? `<p style="margin: 4px 0 0; font-size: 11px; color: #9ca3af;">${property.address}</p>` : ''}
                    </div>
                    <div class="property-actions" style="display: flex; gap: 4px;">
                        <button class="edit-property" data-id="${property.id}" style="
                            background: none;
                            border: none;
                            color: #6b7280;
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 4px;
                            font-size: 12px;
                        ">✏️</button>
                        <button class="delete-property" data-id="${property.id}" style="
                            background: none;
                            border: none;
                            color: #ef4444;
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 4px;
                            font-size: 12px;
                        ">🗑️</button>
                    </div>
                </div>
            `;

            // Select property on click
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.property-actions')) {
                    this.selectProperty(property.id);
                }
            });

            // Edit property
            item.querySelector('.edit-property').addEventListener('click', () => {
                this.editProperty(property.id);
            });

            // Delete property
            item.querySelector('.delete-property').addEventListener('click', () => {
                this.deleteProperty(property.id);
            });

            container.appendChild(item);
        });
    }

    renderPropertyDetails() {
        const container = document.getElementById('property-details');
        if (!container) return;

        if (!this.currentPropertyId) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🏨</div>
                    <h3 style="margin: 0 0 8px; font-size: 18px; color: #374151;">Select a Property</h3>
                    <p style="margin: 0; font-size: 14px;">Choose a property from the sidebar to view and manage its details</p>
                </div>
            `;
            return;
        }

        const property = this.properties.find(p => p.id === this.currentPropertyId);
        if (!property) return;

        container.innerHTML = `
            <div class="property-header" style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">
                            ${property.name}
                        </h3>
                        <p style="margin: 4px 0 0; color: #6b7280;">
                            ${property.type} ${property.address ? `• ${property.address}` : ''}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="use-property" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Use This Property</button>
                        <button id="duplicate-property" style="
                            background: #f59e0b;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Duplicate</button>
                    </div>
                </div>
            </div>

            <div class="property-tabs" style="margin-bottom: 20px;">
                <div style="border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; gap: 0;">
                        <button class="tab-button active" data-tab="features" style="
                            background: none;
                            border: none;
                            padding: 12px 16px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            border-bottom: 2px solid #3b82f6;
                            color: #3b82f6;
                        ">Features</button>
                        <button class="tab-button" data-tab="staff" style="
                            background: none;
                            border: none;
                            padding: 12px 16px;
                            font-size: 14px;
                            color: #6b7280;
                            cursor: pointer;
                            border-bottom: 2px solid transparent;
                        ">Staff</button>
                        <button class="tab-button" data-tab="templates" style="
                            background: none;
                            border: none;
                            padding: 12px 16px;
                            font-size: 14px;
                            color: #6b7280;
                            cursor: pointer;
                            border-bottom: 2px solid transparent;
                        ">Templates</button>
                        <button class="tab-button" data-tab="analytics" style="
                            background: none;
                            border: none;
                            padding: 12px 16px;
                            font-size: 14px;
                            color: #6b7280;
                            cursor: pointer;
                            border-bottom: 2px solid transparent;
                        ">Analytics</button>
                    </div>
                </div>
            </div>

            <div class="property-content">
                <div id="features-tab" class="tab-content" style="display: block;">
                    ${this.renderFeaturesTab(property)}
                </div>
                <div id="staff-tab" class="tab-content" style="display: none;">
                    ${this.renderStaffTab(property)}
                </div>
                <div id="templates-tab" class="tab-content" style="display: none;">
                    ${this.renderTemplatesTab(property)}
                </div>
                <div id="analytics-tab" class="tab-content" style="display: none;">
                    ${this.renderAnalyticsTab(property)}
                </div>
            </div>
        `;

        this.setupPropertyDetailsListeners();
    }

    renderFeaturesTab(property) {
        return `
            <div class="features-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">
                        Property Features
                    </h4>
                    <button id="add-feature" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">+ Add Feature</button>
                </div>
                <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
                    ${property.features.map(feature => `
                        <div class="feature-item" style="
                            background: #f9fafb;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid #e5e7eb;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="font-size: 13px; color: #374151;">${feature}</span>
                            <button class="remove-feature" data-feature="${feature}" style="
                                background: none;
                                border: none;
                                color: #ef4444;
                                cursor: pointer;
                                padding: 4px;
                                border-radius: 4px;
                                font-size: 12px;
                            ">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderStaffTab(property) {
        return `
            <div class="staff-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">
                        Staff Members
                    </h4>
                    <button id="add-staff" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">+ Add Staff</button>
                </div>
                <div class="staff-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${property.staff.map(staff => `
                        <div class="staff-item" style="
                            background: #f9fafb;
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid #e5e7eb;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="font-size: 13px; color: #374151;">${staff}</span>
                            <button class="remove-staff" data-staff="${staff}" style="
                                background: none;
                                border: none;
                                color: #ef4444;
                                cursor: pointer;
                                padding: 4px;
                                border-radius: 4px;
                                font-size: 12px;
                            ">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTemplatesTab(property) {
        const templates = property.templates || {};
        return `
            <div class="templates-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">
                        Review Templates
                    </h4>
                    <button id="create-template" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">+ Create Template</button>
                </div>
                <div class="templates-list">
                    ${Object.keys(templates).length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #9ca3af; border: 2px dashed #e5e7eb; border-radius: 8px;">
                            <div style="font-size: 32px; margin-bottom: 12px;">📝</div>
                            <p style="margin: 0; font-size: 14px;">No templates yet</p>
                            <p style="margin: 4px 0 0; font-size: 12px;">Create templates to speed up review generation</p>
                        </div>
                    ` : Object.entries(templates).map(([id, template]) => `
                        <div class="template-item" style="
                            background: white;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 12px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                <div>
                                    <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${template.name}</h5>
                                    <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${template.platform || 'Universal'} • Created ${new Date(template.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    <button class="use-template" data-id="${id}" style="
                                        background: #10b981;
                                        color: white;
                                        border: none;
                                        padding: 4px 8px;
                                        border-radius: 4px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">Use</button>
                                    <button class="edit-template" data-id="${id}" style="
                                        background: #f59e0b;
                                        color: white;
                                        border: none;
                                        padding: 4px 8px;
                                        border-radius: 4px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">Edit</button>
                                    <button class="delete-template" data-id="${id}" style="
                                        background: #ef4444;
                                        color: white;
                                        border: none;
                                        padding: 4px 8px;
                                        border-radius: 4px;
                                        font-size: 11px;
                                        cursor: pointer;
                                    ">Delete</button>
                                </div>
                            </div>
                            <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 12px; color: #374151; line-height: 1.4;">
                                ${template.content.substring(0, 150)}${template.content.length > 150 ? '...' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderAnalyticsTab(property) {
        // Mock analytics data for now
        const mockAnalytics = {
            reviewsGenerated: Math.floor(Math.random() * 50) + 10,
            avgRating: (4.0 + Math.random()).toFixed(1),
            platformDistribution: {
                booking: Math.floor(Math.random() * 20) + 5,
                expedia: Math.floor(Math.random() * 15) + 3,
                tripadvisor: Math.floor(Math.random() * 10) + 2,
                google: Math.floor(Math.random() * 8) + 1
            }
        };

        return `
            <div class="analytics-section">
                <h4 style="margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #374151;">
                    Analytics & Insights
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div class="metric-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">
                            ${mockAnalytics.reviewsGenerated}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">Reviews Generated</div>
                    </div>
                    <div class="metric-card" style="
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">
                            ${mockAnalytics.avgRating} ★
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">Average Rating</div>
                    </div>
                </div>

                <div class="platform-distribution">
                    <h5 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">
                        Platform Distribution
                    </h5>
                    <div style="space-y: 8px;">
                        ${Object.entries(mockAnalytics.platformDistribution).map(([platform, count]) => {
                            const total = Object.values(mockAnalytics.platformDistribution).reduce((a, b) => a + b, 0);
                            const percentage = ((count / total) * 100).toFixed(0);
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-size: 13px; color: #374151; text-transform: capitalize;">${platform}</span>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="
                                            width: 100px;
                                            height: 4px;
                                            background: #e5e7eb;
                                            border-radius: 2px;
                                            overflow: hidden;
                                        ">
                                            <div style="
                                                width: ${percentage}%;
                                                height: 100%;
                                                background: #3b82f6;
                                            "></div>
                                        </div>
                                        <span style="font-size: 12px; color: #6b7280; min-width: 30px;">${count}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupPropertyDetailsListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Use property button
        const useButton = document.getElementById('use-property');
        if (useButton) {
            useButton.addEventListener('click', () => {
                this.useProperty(this.currentPropertyId);
            });
        }

        // Duplicate property button
        const duplicateButton = document.getElementById('duplicate-property');
        if (duplicateButton) {
            duplicateButton.addEventListener('click', () => {
                this.duplicateProperty(this.currentPropertyId);
            });
        }

        this.setupFeatureListeners();
        this.setupStaffListeners();
        this.setupTemplateListeners();
    }

    setupFeatureListeners() {
        // Add feature
        const addFeatureBtn = document.getElementById('add-feature');
        if (addFeatureBtn) {
            addFeatureBtn.addEventListener('click', () => {
                this.addFeature();
            });
        }

        // Remove features
        document.querySelectorAll('.remove-feature').forEach(button => {
            button.addEventListener('click', () => {
                this.removeFeature(button.dataset.feature);
            });
        });
    }

    setupStaffListeners() {
        // Add staff
        const addStaffBtn = document.getElementById('add-staff');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', () => {
                this.addStaff();
            });
        }

        // Remove staff
        document.querySelectorAll('.remove-staff').forEach(button => {
            button.addEventListener('click', () => {
                this.removeStaff(button.dataset.staff);
            });
        });
    }

    setupTemplateListeners() {
        // Create template
        const createTemplateBtn = document.getElementById('create-template');
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => {
                this.createTemplate();
            });
        }

        // Template actions
        document.querySelectorAll('.use-template').forEach(button => {
            button.addEventListener('click', () => {
                this.useTemplate(button.dataset.id);
            });
        });

        document.querySelectorAll('.edit-template').forEach(button => {
            button.addEventListener('click', () => {
                this.editTemplate(button.dataset.id);
            });
        });

        document.querySelectorAll('.delete-template').forEach(button => {
            button.addEventListener('click', () => {
                this.deleteTemplate(button.dataset.id);
            });
        });
    }

    // Property Management Methods
    selectProperty(propertyId) {
        this.currentPropertyId = propertyId;
        this.renderPropertiesList();
        this.renderPropertyDetails();
        
        this.appCore.getServices().errorMonitor?.trackUserAction('property_selected', {
            propertyId: propertyId
        });
    }

    useProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        // Update main app with property data
        this.appCore.state.hotelName = property.name;
        this.appCore.config.hotelName = property.name;
        this.appCore.config.features = [...property.features];
        this.appCore.config.staffMembers = [...property.staff];

        // Update UI elements
        const hotelNameSpan = document.getElementById('hotelNameSpan');
        if (hotelNameSpan) {
            hotelNameSpan.textContent = property.name;
        }

        // Regenerate UI with new property data
        this.appCore.updateUI();

        this.appCore.getServices().errorMonitor?.trackUserAction('property_applied', {
            propertyId: propertyId,
            propertyName: property.name
        });

        this.hide();
        this.appCore.showSuccessMessage(`Now using ${property.name} settings`);
    }

    duplicateProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const duplicate = {
            ...property,
            id: this.generateId(),
            name: `${property.name} (Copy)`,
            createdAt: new Date().toISOString()
        };

        this.properties.push(duplicate);
        this.saveProperties();
        this.renderPropertiesList();

        this.appCore.showSuccessMessage(`Property duplicated: ${duplicate.name}`);
    }

    deleteProperty(propertyId) {
        if (this.properties.length <= 1) {
            this.appCore.showErrorMessage('Cannot delete the last property');
            return;
        }

        if (confirm('Are you sure you want to delete this property?')) {
            this.properties = this.properties.filter(p => p.id !== propertyId);
            
            if (this.currentPropertyId === propertyId) {
                this.currentPropertyId = this.properties[0]?.id || null;
            }

            this.saveProperties();
            this.renderPropertiesList();
            this.renderPropertyDetails();

            this.appCore.showSuccessMessage('Property deleted');
        }
    }

    addFeature() {
        const feature = prompt('Enter new feature:');
        if (feature && feature.trim()) {
            const property = this.properties.find(p => p.id === this.currentPropertyId);
            if (property && !property.features.includes(feature.trim())) {
                property.features.push(feature.trim());
                this.saveProperties();
                this.renderPropertyDetails();
            }
        }
    }

    removeFeature(feature) {
        const property = this.properties.find(p => p.id === this.currentPropertyId);
        if (property) {
            property.features = property.features.filter(f => f !== feature);
            this.saveProperties();
            this.renderPropertyDetails();
        }
    }

    addStaff() {
        const staff = prompt('Enter staff member name:');
        if (staff && staff.trim()) {
            const property = this.properties.find(p => p.id === this.currentPropertyId);
            if (property && !property.staff.includes(staff.trim())) {
                property.staff.push(staff.trim());
                this.saveProperties();
                this.renderPropertyDetails();
            }
        }
    }

    removeStaff(staff) {
        const property = this.properties.find(p => p.id === this.currentPropertyId);
        if (property) {
            property.staff = property.staff.filter(s => s !== staff);
            this.saveProperties();
            this.renderPropertyDetails();
        }
    }

    // Template Management
    createTemplate() {
        const currentReview = this.appCore.getState().generatedReview;
        if (!currentReview) {
            this.appCore.showErrorMessage('Generate a review first to create a template');
            return;
        }

        const name = prompt('Template name:');
        if (name && name.trim()) {
            const property = this.properties.find(p => p.id === this.currentPropertyId);
            if (property) {
                if (!property.templates) property.templates = {};
                
                property.templates[this.generateId()] = {
                    name: name.trim(),
                    content: currentReview,
                    platform: this.appCore.getState().source,
                    features: [...this.appCore.getState().selectedFeatures],
                    staff: this.appCore.getState().selectedStaff,
                    createdAt: new Date().toISOString()
                };

                this.saveProperties();
                this.renderPropertyDetails();
                this.appCore.showSuccessMessage(`Template "${name}" created`);
            }
        }
    }

    useTemplate(templateId) {
        const property = this.properties.find(p => p.id === this.currentPropertyId);
        const template = property?.templates?.[templateId];
        
        if (template) {
            // Apply template to main app
            this.appCore.state.selectedFeatures = [...template.features];
            this.appCore.state.selectedStaff = template.staff;
            this.appCore.state.personalComments = template.content;
            this.appCore.updateUI();

            this.hide();
            this.appCore.showSuccessMessage(`Template "${template.name}" applied`);
        }
    }

    deleteTemplate(templateId) {
        if (confirm('Delete this template?')) {
            const property = this.properties.find(p => p.id === this.currentPropertyId);
            if (property?.templates?.[templateId]) {
                delete property.templates[templateId];
                this.saveProperties();
                this.renderPropertyDetails();
                this.appCore.showSuccessMessage('Template deleted');
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#6b7280';
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.style.borderBottomColor = '#3b82f6';
            activeTab.style.color = '#3b82f6';
        }

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }
    }

    showAddPropertyForm() {
        const name = prompt('Property name:');
        if (!name || !name.trim()) return;

        const type = prompt('Property type (hotel/resort/bnb):', 'hotel');
        const address = prompt('Address (optional):') || '';

        const newProperty = {
            id: this.generateId(),
            name: name.trim(),
            address: address.trim(),
            type: type?.trim() || 'hotel',
            features: [...this.appCore.getConfig().features],
            staff: [...this.appCore.getConfig().staffMembers],
            templates: {},
            active: true,
            createdAt: new Date().toISOString()
        };

        this.properties.push(newProperty);
        this.currentPropertyId = newProperty.id;
        this.saveProperties();
        this.renderPropertiesList();
        this.renderPropertyDetails();

        this.appCore.showSuccessMessage(`Property "${newProperty.name}" added`);
    }

    // Utility methods
    generateId() {
        return 'prop_' + Math.random().toString(36).substr(2, 9);
    }

    show() {
        this.isVisible = true;
        this.dashboardElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        this.appCore.getServices().errorMonitor?.trackUserAction('multi_property_dashboard_opened');
    }

    hide() {
        this.isVisible = false;
        this.dashboardElement.style.display = 'none';
        document.body.style.overflow = '';
        
        this.appCore.getServices().errorMonitor?.trackUserAction('multi_property_dashboard_closed');
    }

    // Public API
    getProperties() {
        return [...this.properties];
    }

    getCurrentProperty() {
        return this.properties.find(p => p.id === this.currentPropertyId) || null;
    }

    importProperty(propertyData) {
        const property = {
            id: this.generateId(),
            ...propertyData,
            createdAt: new Date().toISOString()
        };

        this.properties.push(property);
        this.saveProperties();
        this.renderPropertiesList();
        
        return property.id;
    }

    exportProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (property) {
            const exportData = { ...property };
            delete exportData.id; // Remove ID for export
            return exportData;
        }
        return null;
    }
}
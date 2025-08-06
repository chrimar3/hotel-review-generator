/**
 * Export and Reporting Panel
 * User interface for data export and report generation
 */

export class ExportReportingPanel {
    constructor(exportService, errorMonitor) {
        this.exportService = exportService;
        this.errorMonitor = errorMonitor;
        this.isVisible = false;
        this.currentTab = 'export';
        
        this.createPanel();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'export-reporting-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10002;
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
                max-width: 1100px;
                height: 90vh;
                max-height: 750px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div class="panel-header" style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                                Export & Reporting
                            </h2>
                            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">
                                Generate reports and export your data
                            </p>
                        </div>
                        <button id="close-export-panel" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #6b7280;
                            padding: 8px;
                        ">×</button>
                    </div>
                    
                    <div class="panel-tabs" style="margin-top: 20px;">
                        <div style="display: flex; gap: 0; border-bottom: 1px solid #e5e7eb;">
                            <button class="tab-btn active" data-tab="export" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid #3b82f6;
                                color: #3b82f6;
                                font-weight: 500;
                            ">Data Export</button>
                            <button class="tab-btn" data-tab="reports" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                                color: #6b7280;
                            ">Analytics Reports</button>
                            <button class="tab-btn" data-tab="schedules" style="
                                background: none;
                                border: none;
                                padding: 12px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                                color: #6b7280;
                            ">Scheduled Reports</button>
                        </div>
                    </div>
                </div>

                <div class="panel-content" style="
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                ">
                    <div id="export-tab" class="tab-content" style="display: block;">
                        ${this.renderExportTab()}
                    </div>
                    <div id="reports-tab" class="tab-content" style="display: none;">
                        ${this.renderReportsTab()}
                    </div>
                    <div id="schedules-tab" class="tab-content" style="display: none;">
                        ${this.renderSchedulesTab()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panelElement = panel;
        this.setupEventListeners();
    }

    renderExportTab() {
        return `
            <div class="export-section">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <!-- Review Data Export -->
                    <div class="export-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 24px;
                        border-radius: 12px;
                    ">
                        <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">
                            📝 Review Data
                        </h3>
                        <p style="margin: 0 0 20px; opacity: 0.9; font-size: 14px;">
                            Export generated reviews with quality metrics and platform data
                        </p>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 12px; opacity: 0.9;">Format</label>
                            <select id="review-format" style="
                                width: 100%;
                                padding: 8px;
                                border: none;
                                border-radius: 6px;
                                font-size: 13px;
                            ">
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel (XLSX)</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 12px; opacity: 0.9;">Date Range</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <input type="date" id="review-start-date" style="
                                    padding: 8px;
                                    border: none;
                                    border-radius: 6px;
                                    font-size: 13px;
                                ">
                                <input type="date" id="review-end-date" style="
                                    padding: 8px;
                                    border: none;
                                    border-radius: 6px;
                                    font-size: 13px;
                                ">
                            </div>
                        </div>

                        <button id="export-reviews" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            padding: 10px 16px;
                            border-radius: 6px;
                            font-size: 13px;
                            cursor: pointer;
                            width: 100%;
                            font-weight: 500;
                        ">Export Reviews</button>
                    </div>

                    <!-- Property Data Export -->
                    <div class="export-card" style="
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        color: white;
                        padding: 24px;
                        border-radius: 12px;
                    ">
                        <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">
                            🏨 Property Data
                        </h3>
                        <p style="margin: 0 0 20px; opacity: 0.9; font-size: 14px;">
                            Export hotel properties with features, staff, and templates
                        </p>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 12px; opacity: 0.9;">Format</label>
                            <select id="property-format" style="
                                width: 100%;
                                padding: 8px;
                                border: none;
                                border-radius: 6px;
                                font-size: 13px;
                            ">
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel (XLSX)</option>
                            </select>
                        </div>

                        <button id="export-properties" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            padding: 10px 16px;
                            border-radius: 6px;
                            font-size: 13px;
                            cursor: pointer;
                            width: 100%;
                            font-weight: 500;
                        ">Export Properties</button>
                    </div>

                    <!-- Integration Data Export -->
                    <div class="export-card" style="
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        color: white;
                        padding: 24px;
                        border-radius: 12px;
                    ">
                        <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">
                            🔗 Integration Data
                        </h3>
                        <p style="margin: 0 0 20px; opacity: 0.9; font-size: 14px;">
                            Export CRM/PMS integration configurations and metrics
                        </p>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 12px; opacity: 0.9;">Format</label>
                            <select id="integration-format" style="
                                width: 100%;
                                padding: 8px;
                                border: none;
                                border-radius: 6px;
                                font-size: 13px;
                            ">
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                            </select>
                        </div>

                        <button id="export-integrations" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            padding: 10px 16px;
                            border-radius: 6px;
                            font-size: 13px;
                            cursor: pointer;
                            width: 100%;
                            font-weight: 500;
                        ">Export Integrations</button>
                    </div>
                </div>

                <div id="export-status" style="margin-top: 24px; display: none;"></div>
            </div>
        `;
    }

    renderReportsTab() {
        return `
            <div class="reports-section">
                <div style="margin-bottom: 32px;">
                    <h3 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827;">
                        Generate Analytics Report
                    </h3>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151;">
                                    Time Range
                                </label>
                                <select id="report-time-range" style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 13px;
                                ">
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d" selected>Last 30 days</option>
                                    <option value="90d">Last 90 days</option>
                                    <option value="1y">Last year</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #374151;">
                                    Report Format
                                </label>
                                <select id="report-format" style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    font-size: 13px;
                                ">
                                    <option value="json">JSON Report</option>
                                    <option value="pdf">PDF Report</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 12px; font-size: 13px; font-weight: 500; color: #374151;">
                                Include Sections
                            </label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-summary" checked> Summary Metrics
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-reviews" checked> Review Statistics
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-platforms" checked> Platform Performance
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-quality" checked> Quality Metrics
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-trends" checked> Trend Analysis
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                                    <input type="checkbox" id="include-charts"> Chart Data
                                </label>
                            </div>
                        </div>

                        <button id="generate-report" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Generate Report</button>
                    </div>
                </div>

                <div id="report-preview" style="margin-top: 24px;"></div>
                <div id="report-status" style="margin-top: 16px; display: none;"></div>
            </div>
        `;
    }

    renderSchedulesTab() {
        const schedules = this.exportService.getScheduledReports();
        
        return `
            <div class="schedules-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">
                        Scheduled Reports
                    </h3>
                    <button id="create-schedule" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                        font-weight: 500;
                    ">+ New Schedule</button>
                </div>

                ${schedules.length === 0 ? `
                    <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                        <h4 style="margin: 0 0 8px; font-size: 16px; color: #374151;">No Scheduled Reports</h4>
                        <p style="margin: 0; font-size: 14px;">Automate your reporting by creating scheduled exports</p>
                    </div>
                ` : `
                    <div class="schedules-list" style="space-y: 16px;">
                        ${schedules.map(schedule => this.renderScheduleCard(schedule)).join('')}
                    </div>
                `}

                <div id="schedule-form" style="display: none; margin-top: 24px;">
                    ${this.renderScheduleForm()}
                </div>
            </div>
        `;
    }

    renderScheduleCard(schedule) {
        const nextRun = new Date(schedule.nextRun).toLocaleString();
        const lastRun = schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never';
        
        return `
            <div class="schedule-card" style="
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 16px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
                            ${schedule.title || `${schedule.type} Report`}
                        </h4>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">
                            ${schedule.frequency} • ${schedule.format.toUpperCase()}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="toggle-schedule" data-id="${schedule.id}" style="
                            background: ${schedule.active ? '#10b981' : '#6b7280'};
                            color: white;
                            border: none;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 11px;
                            cursor: pointer;
                        ">${schedule.active ? 'Active' : 'Paused'}</button>
                        <button class="delete-schedule" data-id="${schedule.id}" style="
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
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; font-size: 12px; color: #6b7280;">
                    <div>
                        <strong>Next Run:</strong><br>${nextRun}
                    </div>
                    <div>
                        <strong>Last Run:</strong><br>${lastRun}
                    </div>
                </div>
            </div>
        `;
    }

    renderScheduleForm() {
        return `
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                <h4 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                    Create Scheduled Report
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
                            Report Title
                        </label>
                        <input type="text" id="schedule-title" placeholder="Monthly Analytics Report" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 13px;
                        ">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
                            Report Type
                        </label>
                        <select id="schedule-type" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 13px;
                        ">
                            <option value="analytics">Analytics Report</option>
                            <option value="reviews">Review Export</option>
                            <option value="properties">Property Export</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
                            Frequency
                        </label>
                        <select id="schedule-frequency" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 13px;
                        ">
                            <option value="daily">Daily</option>
                            <option value="weekly" selected>Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">
                            Format
                        </label>
                        <select id="schedule-format" style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            font-size: 13px;
                        ">
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="save-schedule" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Save Schedule</button>
                    <button id="cancel-schedule" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close panel
        document.getElementById('close-export-panel').addEventListener('click', () => {
            this.hide();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Export actions
        document.addEventListener('click', (e) => {
            if (e.target.id === 'export-reviews') {
                this.exportReviews();
            }
            if (e.target.id === 'export-properties') {
                this.exportProperties();
            }
            if (e.target.id === 'export-integrations') {
                this.exportIntegrations();
            }
            if (e.target.id === 'generate-report') {
                this.generateReport();
            }
            if (e.target.id === 'create-schedule') {
                this.showScheduleForm();
            }
            if (e.target.id === 'save-schedule') {
                this.saveSchedule();
            }
            if (e.target.id === 'cancel-schedule') {
                this.hideScheduleForm();
            }
            if (e.target.classList.contains('delete-schedule')) {
                this.deleteSchedule(e.target.dataset.id);
            }
        });

        // Close on backdrop click
        this.panelElement.addEventListener('click', (e) => {
            if (e.target === this.panelElement) {
                this.hide();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#6b7280';
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.style.borderBottomColor = '#3b82f6';
            activeBtn.style.color = '#3b82f6';
        }

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${tab}-tab`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        // Refresh schedules tab if needed
        if (tab === 'schedules') {
            this.refreshSchedulesTab();
        }
    }

    async exportReviews() {
        const format = document.getElementById('review-format').value;
        const startDate = document.getElementById('review-start-date').value;
        const endDate = document.getElementById('review-end-date').value;

        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        this.showExportStatus('Exporting review data...', 'info');

        try {
            const result = await this.exportService.exportReviewData(format, filters);
            
            if (result.success) {
                this.exportService.downloadData(result.data, result.filename, format);
                this.showExportStatus('Review data exported successfully!', 'success');
            } else {
                this.showExportStatus(`Export failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showExportStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    async exportProperties() {
        const format = document.getElementById('property-format').value;
        
        this.showExportStatus('Exporting property data...', 'info');

        try {
            const result = await this.exportService.exportPropertyData(format);
            
            if (result.success) {
                this.exportService.downloadData(result.data, result.filename, format);
                this.showExportStatus('Property data exported successfully!', 'success');
            } else {
                this.showExportStatus(`Export failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showExportStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    async exportIntegrations() {
        const format = document.getElementById('integration-format').value;
        
        this.showExportStatus('Exporting integration data...', 'info');

        try {
            const result = await this.exportService.exportIntegrationData(format);
            
            if (result.success) {
                this.exportService.downloadData(result.data, result.filename, format);
                this.showExportStatus('Integration data exported successfully!', 'success');
            } else {
                this.showExportStatus(`Export failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showExportStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    async generateReport() {
        const timeRange = document.getElementById('report-time-range').value;
        const format = document.getElementById('report-format').value;
        const includeCharts = document.getElementById('include-charts').checked;
        
        this.showReportStatus('Generating analytics report...', 'info');

        try {
            const result = await this.exportService.generateAnalyticsReport(timeRange, includeCharts);
            
            if (result.success) {
                this.displayReportPreview(result.report);
                this.showReportStatus('Report generated successfully!', 'success');

                // Offer download
                const reportData = await this.exportService.formatData(result.report, format);
                const filename = `analytics_report_${new Date().toISOString().split('T')[0]}.${format}`;
                
                // Add download button
                setTimeout(() => {
                    this.addDownloadButton(reportData, filename, format);
                }, 1000);
            } else {
                this.showReportStatus(`Report generation failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showReportStatus(`Report generation failed: ${error.message}`, 'error');
        }
    }

    displayReportPreview(report) {
        const preview = document.getElementById('report-preview');
        if (!preview) return;

        preview.innerHTML = `
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                    Report Preview
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 600; color: #111827;">${report.summary.totalReviews}</div>
                        <div style="font-size: 12px; color: #6b7280;">Total Reviews</div>
                    </div>
                    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 600; color: #111827;">${report.summary.averageRating}</div>
                        <div style="font-size: 12px; color: #6b7280;">Average Rating</div>
                    </div>
                    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 600; color: #111827;">${report.summary.completionRate}%</div>
                        <div style="font-size: 12px; color: #6b7280;">Completion Rate</div>
                    </div>
                    <div style="background: #f9fafb; padding: 12px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 600; color: #111827;">+${report.summary.lastWeekGrowth}%</div>
                        <div style="font-size: 12px; color: #6b7280;">Week Growth</div>
                    </div>
                </div>

                <div style="background: #fafafa; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 11px; max-height: 200px; overflow-y: auto;">
                    <pre>${JSON.stringify(report, null, 2).substring(0, 1000)}${JSON.stringify(report, null, 2).length > 1000 ? '\n... (truncated)' : ''}</pre>
                </div>
            </div>
        `;
    }

    addDownloadButton(data, filename, format) {
        const status = document.getElementById('report-status');
        if (status) {
            status.innerHTML += `
                <div style="margin-top: 12px;">
                    <button onclick="
                        const service = window.hotelReviewApp?.getAppCore()?.getServices()?.exportReporting;
                        if (service) service.downloadData('${data.replace(/'/g, "\\'")}', '${filename}', '${format}');
                    " style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Download Report</button>
                </div>
            `;
        }
    }

    showScheduleForm() {
        document.getElementById('schedule-form').style.display = 'block';
    }

    hideScheduleForm() {
        document.getElementById('schedule-form').style.display = 'none';
    }

    saveSchedule() {
        const title = document.getElementById('schedule-title').value;
        const type = document.getElementById('schedule-type').value;
        const frequency = document.getElementById('schedule-frequency').value;
        const format = document.getElementById('schedule-format').value;

        if (!title.trim()) {
            this.showReportStatus('Please enter a report title', 'error');
            return;
        }

        const scheduleConfig = {
            title: title.trim(),
            type,
            frequency,
            format,
            timeRange: '30d' // Default
        };

        const scheduleId = this.exportService.scheduleReport(scheduleConfig);
        
        if (scheduleId) {
            this.hideScheduleForm();
            this.refreshSchedulesTab();
            this.showReportStatus('Report scheduled successfully!', 'success');
        } else {
            this.showReportStatus('Failed to schedule report', 'error');
        }
    }

    deleteSchedule(scheduleId) {
        if (confirm('Delete this scheduled report?')) {
            this.exportService.removeSchedule(scheduleId);
            this.refreshSchedulesTab();
        }
    }

    refreshSchedulesTab() {
        const schedulesTab = document.getElementById('schedules-tab');
        if (schedulesTab && this.currentTab === 'schedules') {
            schedulesTab.innerHTML = this.renderSchedulesTab();
        }
    }

    showExportStatus(message, type) {
        this.showStatus('export-status', message, type);
    }

    showReportStatus(message, type) {
        this.showStatus('report-status', message, type);
    }

    showStatus(elementId, message, type) {
        const statusDiv = document.getElementById(elementId);
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
        statusDiv.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    show() {
        this.isVisible = true;
        this.panelElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.isVisible = false;
        this.panelElement.style.display = 'none';
        document.body.style.overflow = '';
    }
}
/**
 * Guest Feedback Collection Service
 * Legitimate system for collecting and managing guest feedback
 * Replaces artificial review generation with actual guest communication
 */

export class GuestFeedbackService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.feedbackRequests = new Map();
        this.responses = new Map();
        this.templates = new Map();
        
        this.config = {
            requestTiming: {
                afterCheckout: 24, // hours
                followUp: 72, // hours if no response
                maxReminders: 2
            },
            platforms: {
                email: true,
                sms: false, // Would require SMS service integration
                inApp: true
            },
            analytics: {
                trackResponseRates: true,
                trackSentiment: true,
                generateInsights: true
            }
        };

        this.initialize();
    }

    initialize() {
        this.loadStoredData();
        this.setupEmailTemplates();
        
        if (typeof console !== 'undefined') {
            console.log('[GuestFeedback] Guest feedback collection service initialized');
        }
    }

    // Guest Management
    addGuest(guestData) {
        const guestId = this.generateGuestId();
        const guest = {
            id: guestId,
            ...guestData,
            addedAt: new Date().toISOString(),
            status: 'active'
        };

        this.feedbackRequests.set(guestId, guest);
        this.saveData();
        
        this.errorMonitor?.trackUserAction('guest_added', {
            guestId,
            property: guestData.property
        });

        return guestId;
    }

    // Feedback Request Management
    scheduleFeedbackRequest(guestId, checkoutDate) {
        const guest = this.feedbackRequests.get(guestId);
        if (!guest) throw new Error('Guest not found');

        const requestTime = new Date(checkoutDate);
        requestTime.setHours(requestTime.getHours() + this.config.requestTiming.afterCheckout);

        const request = {
            guestId,
            scheduledFor: requestTime.toISOString(),
            status: 'scheduled',
            attempts: 0,
            maxAttempts: this.config.requestTiming.maxReminders + 1,
            createdAt: new Date().toISOString()
        };

        guest.feedbackRequest = request;
        this.saveData();

        // In a real implementation, this would integrate with email/SMS services
        this.simulateRequestScheduling(request);

        return request;
    }

    simulateRequestScheduling(request) {
        // Simulate scheduling system
        const delay = new Date(request.scheduledFor) - new Date();
        
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Within 24 hours
            setTimeout(() => {
                this.sendFeedbackRequest(request.guestId);
            }, Math.min(delay, 10000)); // Max 10 second delay for demo
        }
    }

    async sendFeedbackRequest(guestId) {
        const guest = this.feedbackRequests.get(guestId);
        if (!guest || !guest.feedbackRequest) return false;

        const request = guest.feedbackRequest;
        request.attempts++;
        request.lastSentAt = new Date().toISOString();
        
        try {
            // Generate personalized feedback request
            const emailContent = this.generateFeedbackEmail(guest);
            
            // In production, would send actual email
            this.simulateEmailSend(guest.email, emailContent);
            
            request.status = 'sent';
            
            // Schedule follow-up if needed
            if (request.attempts < request.maxAttempts) {
                this.scheduleFollowUp(guestId);
            }

            this.errorMonitor?.trackUserAction('feedback_request_sent', {
                guestId,
                attempt: request.attempts,
                method: 'email'
            });

            this.saveData();
            return true;
        } catch (error) {
            request.status = 'failed';
            this.errorMonitor?.trackError('feedback_request_failed', error, { guestId });
            return false;
        }
    }

    scheduleFollowUp(guestId) {
        const guest = this.feedbackRequests.get(guestId);
        const followUpTime = new Date();
        followUpTime.setHours(followUpTime.getHours() + this.config.requestTiming.followUp);
        
        guest.feedbackRequest.nextFollowUp = followUpTime.toISOString();
        
        // Schedule the follow-up
        setTimeout(() => {
            this.sendFeedbackRequest(guestId);
        }, this.config.requestTiming.followUp * 60 * 60 * 1000);
    }

    // Email Template Generation
    generateFeedbackEmail(guest) {
        const template = this.getEmailTemplate('feedback_request');
        
        return template
            .replace('{guest_name}', guest.name || 'Valued Guest')
            .replace('{property_name}', guest.property || 'our hotel')
            .replace('{checkout_date}', new Date(guest.checkoutDate).toLocaleDateString())
            .replace('{feedback_link}', this.generateFeedbackLink(guest.id))
            .replace('{unsubscribe_link}', this.generateUnsubscribeLink(guest.id));
    }

    getEmailTemplate(type) {
        const templates = {
            feedback_request: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Thank you for staying at {property_name}!</h2>
                    
                    <p>Dear {guest_name},</p>
                    
                    <p>We hope you enjoyed your stay with us on {checkout_date}. Your experience is very important to us, and we would love to hear about it.</p>
                    
                    <p>Would you mind sharing your feedback? It only takes a few minutes and helps us provide better service to all our guests.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{feedback_link}" style="
                            background: #3b82f6;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                        ">Share Your Feedback</a>
                    </div>
                    
                    <p>If you had an exceptional experience, we'd be grateful if you could also share a review on your preferred travel platform.</p>
                    
                    <p>Thank you for choosing {property_name}!</p>
                    
                    <p><small><a href="{unsubscribe_link}">Unsubscribe from feedback emails</a></small></p>
                </div>
            `,
            
            follow_up: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>We'd still love to hear from you!</h2>
                    
                    <p>Dear {guest_name},</p>
                    
                    <p>A few days ago, we reached out to ask about your recent stay at {property_name}. We haven't heard back from you yet, and we wanted to give you another opportunity to share your thoughts.</p>
                    
                    <p>Your feedback is incredibly valuable to us and helps us improve our service.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{feedback_link}" style="
                            background: #10b981;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                        ">Share Your Feedback Now</a>
                    </div>
                    
                    <p><small><a href="{unsubscribe_link}">Unsubscribe from feedback emails</a></small></p>
                </div>
            `
        };

        return templates[type] || templates.feedback_request;
    }

    generateFeedbackLink(guestId) {
        // In production, this would be a real URL to your feedback form
        return `${window.location.origin}/feedback?guest=${guestId}`;
    }

    generateUnsubscribeLink(guestId) {
        return `${window.location.origin}/unsubscribe?guest=${guestId}`;
    }

    simulateEmailSend(email, content) {
        // In production, this would use a real email service (SendGrid, Mailgun, etc.)
        if (typeof console !== 'undefined') {
            console.log(`[GuestFeedback] Email would be sent to ${email}`);
            console.log('Content preview:', content.substring(0, 200) + '...');
        }
    }

    // Feedback Response Handling
    recordFeedbackResponse(guestId, responseData) {
        const guest = this.feedbackRequests.get(guestId);
        if (!guest) throw new Error('Guest not found');

        const response = {
            guestId,
            ...responseData,
            receivedAt: new Date().toISOString(),
            processed: false
        };

        // Validate response data
        if (this.validateResponse(response)) {
            this.responses.set(this.generateResponseId(), response);
            
            // Mark guest as responded
            if (guest.feedbackRequest) {
                guest.feedbackRequest.status = 'responded';
                guest.feedbackRequest.respondedAt = response.receivedAt;
            }

            this.saveData();
            this.processResponse(response);
            
            this.errorMonitor?.trackUserAction('feedback_received', {
                guestId,
                rating: responseData.rating,
                hasComments: !!responseData.comments
            });

            return true;
        }
        
        return false;
    }

    validateResponse(response) {
        // Validate required fields
        if (!response.guestId) return false;
        if (typeof response.rating !== 'number' || response.rating < 1 || response.rating > 5) return false;
        
        // Optional: validate comment length, filter profanity, etc.
        if (response.comments && response.comments.length > 2000) {
            response.comments = response.comments.substring(0, 2000);
        }
        
        return true;
    }

    processResponse(response) {
        // Analyze sentiment
        response.sentiment = this.analyzeSentiment(response.comments || '');
        
        // Categorize feedback
        response.categories = this.categorizeFeedback(response);
        
        // Generate insights
        response.insights = this.generateInsights(response);
        
        // Mark as processed
        response.processed = true;
        
        // Trigger actions based on rating
        if (response.rating >= 4) {
            this.handlePositiveFeedback(response);
        } else if (response.rating <= 2) {
            this.handleNegativeFeedback(response);
        }
    }

    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['excellent', 'great', 'wonderful', 'amazing', 'perfect', 'fantastic', 'love', 'beautiful'];
        const negativeWords = ['terrible', 'awful', 'horrible', 'disappointing', 'worst', 'hate', 'disgusting'];
        
        const words = text.toLowerCase().split(/\W+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    categorizeFeedback(response) {
        const categories = [];
        const text = (response.comments || '').toLowerCase();
        
        // Service-related keywords
        if (text.includes('staff') || text.includes('service') || text.includes('helpful')) {
            categories.push('service');
        }
        
        // Room-related keywords
        if (text.includes('room') || text.includes('bed') || text.includes('bathroom')) {
            categories.push('accommodation');
        }
        
        // Food-related keywords
        if (text.includes('food') || text.includes('breakfast') || text.includes('restaurant')) {
            categories.push('dining');
        }
        
        // Location-related keywords
        if (text.includes('location') || text.includes('convenient') || text.includes('transport')) {
            categories.push('location');
        }
        
        return categories;
    }

    generateInsights(response) {
        const insights = [];
        
        // Rating insights
        if (response.rating === 5) {
            insights.push('Potential promoter - consider asking for online review');
        } else if (response.rating <= 2) {
            insights.push('Dissatisfied guest - requires immediate follow-up');
        }
        
        // Sentiment insights
        if (response.sentiment === 'negative' && response.rating >= 4) {
            insights.push('Mixed feedback - positive rating but negative comments');
        }
        
        return insights;
    }

    handlePositiveFeedback(response) {
        // For highly satisfied guests, suggest they leave public reviews
        const guest = this.feedbackRequests.get(response.guestId);
        if (guest && response.rating >= 4) {
            // In production, would send a follow-up email with review platform links
            this.scheduleReviewInvitation(response.guestId);
        }
    }

    handleNegativeFeedback(response) {
        // For unsatisfied guests, escalate to management
        this.createManagementAlert(response);
    }

    scheduleReviewInvitation(guestId) {
        // Schedule a polite invitation to post public reviews
        const guest = this.feedbackRequests.get(guestId);
        if (!guest) return;

        const invitation = {
            guestId,
            type: 'review_invitation',
            scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
            platforms: ['booking', 'tripadvisor', 'google'] // Suggest legitimate platforms
        };

        // In production, would integrate with email scheduling service
        setTimeout(() => {
            this.sendReviewInvitation(invitation);
        }, 2 * 60 * 60 * 1000);
    }

    sendReviewInvitation(invitation) {
        const guest = this.feedbackRequests.get(invitation.guestId);
        if (!guest) return;

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Thank you for your wonderful feedback!</h2>
                
                <p>Dear ${guest.name || 'Valued Guest'},</p>
                
                <p>We're delighted that you enjoyed your stay at ${guest.property}. Your positive feedback means the world to us!</p>
                
                <p>If you have a moment, we'd be grateful if you could share your experience with other travelers by leaving a review on one of these platforms:</p>
                
                <div style="margin: 20px 0;">
                    <p><a href="https://www.booking.com" target="_blank">Booking.com</a></p>
                    <p><a href="https://www.tripadvisor.com" target="_blank">TripAdvisor</a></p>
                    <p><a href="https://maps.google.com" target="_blank">Google Maps</a></p>
                </div>
                
                <p>Your honest review helps other travelers make informed decisions and helps us continue to improve.</p>
                
                <p>Thank you again for choosing ${guest.property}!</p>
            </div>
        `;

        this.simulateEmailSend(guest.email, emailContent);
        
        this.errorMonitor?.trackUserAction('review_invitation_sent', {
            guestId: invitation.guestId,
            platforms: invitation.platforms
        });
    }

    createManagementAlert(response) {
        const alert = {
            type: 'negative_feedback',
            guestId: response.guestId,
            rating: response.rating,
            comments: response.comments,
            sentiment: response.sentiment,
            createdAt: new Date().toISOString(),
            status: 'new'
        };

        // In production, would integrate with management notification system
        this.errorMonitor?.trackUserAction('management_alert_created', {
            alertType: alert.type,
            guestId: alert.guestId,
            rating: alert.rating
        });
    }

    // Analytics and Reporting
    generateAnalytics(timeRange = '30d') {
        const responses = Array.from(this.responses.values());
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - this.parseTimeRange(timeRange));
        
        const filteredResponses = responses.filter(response => 
            new Date(response.receivedAt) >= startDate
        );

        return {
            summary: {
                totalResponses: filteredResponses.length,
                averageRating: this.calculateAverageRating(filteredResponses),
                responseRate: this.calculateResponseRate(timeRange),
                sentimentDistribution: this.calculateSentimentDistribution(filteredResponses)
            },
            trends: this.calculateTrends(filteredResponses),
            insights: this.generateAnalyticsInsights(filteredResponses)
        };
    }

    calculateAverageRating(responses) {
        if (responses.length === 0) return 0;
        const sum = responses.reduce((acc, response) => acc + response.rating, 0);
        return (sum / responses.length).toFixed(1);
    }

    calculateResponseRate(timeRange) {
        const requests = Array.from(this.feedbackRequests.values());
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - this.parseTimeRange(timeRange));
        
        const sentRequests = requests.filter(guest => 
            guest.feedbackRequest && 
            guest.feedbackRequest.status === 'sent' &&
            new Date(guest.feedbackRequest.lastSentAt) >= startDate
        );
        
        const respondedRequests = requests.filter(guest =>
            guest.feedbackRequest &&
            guest.feedbackRequest.status === 'responded' &&
            new Date(guest.feedbackRequest.respondedAt) >= startDate
        );
        
        if (sentRequests.length === 0) return 0;
        return ((respondedRequests.length / sentRequests.length) * 100).toFixed(1);
    }

    calculateSentimentDistribution(responses) {
        const distribution = { positive: 0, neutral: 0, negative: 0 };
        
        responses.forEach(response => {
            distribution[response.sentiment] = (distribution[response.sentiment] || 0) + 1;
        });
        
        return distribution;
    }

    calculateTrends(responses) {
        // Calculate weekly trends
        const weeks = {};
        
        responses.forEach(response => {
            const week = this.getWeekKey(new Date(response.receivedAt));
            if (!weeks[week]) {
                weeks[week] = { count: 0, totalRating: 0 };
            }
            weeks[week].count++;
            weeks[week].totalRating += response.rating;
        });
        
        return Object.entries(weeks).map(([week, data]) => ({
            week,
            responses: data.count,
            averageRating: (data.totalRating / data.count).toFixed(1)
        }));
    }

    generateAnalyticsInsights(responses) {
        const insights = [];
        
        // Rating insights
        const highRatings = responses.filter(r => r.rating >= 4).length;
        const lowRatings = responses.filter(r => r.rating <= 2).length;
        
        if (highRatings > responses.length * 0.7) {
            insights.push('High satisfaction rate - consider leveraging for marketing');
        }
        
        if (lowRatings > responses.length * 0.2) {
            insights.push('Significant dissatisfaction - review service quality');
        }
        
        // Category insights
        const categoryCount = {};
        responses.forEach(response => {
            (response.categories || []).forEach(category => {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
        });
        
        const topCategory = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0];
            
        if (topCategory) {
            insights.push(`Most mentioned category: ${topCategory[0]} (${topCategory[1]} mentions)`);
        }
        
        return insights;
    }

    // Utility Methods
    parseTimeRange(timeRange) {
        const match = timeRange.match(/^(\d+)([dwm])$/);
        if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days
        
        const [, amount, unit] = match;
        const multipliers = { d: 1, w: 7, m: 30 };
        return parseInt(amount) * (multipliers[unit] || 1) * 24 * 60 * 60 * 1000;
    }

    getWeekKey(date) {
        const year = date.getFullYear();
        const week = Math.ceil(date.getDate() / 7);
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}-W${week}`;
    }

    generateGuestId() {
        return 'guest_' + Math.random().toString(36).substr(2, 9);
    }

    generateResponseId() {
        return 'response_' + Math.random().toString(36).substr(2, 9);
    }

    loadStoredData() {
        try {
            const requests = localStorage.getItem('feedback_requests');
            if (requests) {
                const data = JSON.parse(requests);
                data.forEach(([id, guest]) => {
                    this.feedbackRequests.set(id, guest);
                });
            }

            const responses = localStorage.getItem('feedback_responses');
            if (responses) {
                const data = JSON.parse(responses);
                data.forEach(([id, response]) => {
                    this.responses.set(id, response);
                });
            }
        } catch (error) {
            this.errorMonitor?.trackError('feedback_data_load_failed', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('feedback_requests', 
                JSON.stringify(Array.from(this.feedbackRequests.entries())));
            localStorage.setItem('feedback_responses', 
                JSON.stringify(Array.from(this.responses.entries())));
        } catch (error) {
            this.errorMonitor?.trackError('feedback_data_save_failed', error);
        }
    }

    setupEmailTemplates() {
        // In production, templates would be configurable
        this.templates.set('feedback_request', this.getEmailTemplate('feedback_request'));
        this.templates.set('follow_up', this.getEmailTemplate('follow_up'));
    }

    // Public API
    getGuestStats() {
        return {
            totalGuests: this.feedbackRequests.size,
            totalResponses: this.responses.size,
            pendingRequests: Array.from(this.feedbackRequests.values())
                .filter(guest => guest.feedbackRequest?.status === 'scheduled').length,
            responseRate: this.calculateResponseRate('30d')
        };
    }

    getRecentFeedback(limit = 10) {
        return Array.from(this.responses.values())
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
            .slice(0, limit);
    }

    exportFeedbackData() {
        return {
            guests: Array.from(this.feedbackRequests.values()),
            responses: Array.from(this.responses.values()),
            exportDate: new Date().toISOString()
        };
    }
}
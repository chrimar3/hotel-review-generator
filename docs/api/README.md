# Hotel Guest Communication System - API Documentation

## Overview

The Hotel Guest Communication System provides a comprehensive REST API for managing guest feedback, integrations with hotel management systems, and automated communication workflows.

**Base URL:** `https://api.hotel-guest-communication.com/v1`  
**Authentication:** API Key (Header: `X-API-Key`)  
**Content-Type:** `application/json`

## Quick Start

```bash
# Get your API key from the dashboard
export API_KEY="your-api-key-here"

# Test the API
curl -H "X-API-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     https://api.hotel-guest-communication.com/v1/health
```

## Authentication

All API requests require authentication using an API key in the request header:

```
X-API-Key: your-api-key-here
```

### Getting an API Key

1. Log into your dashboard at `/dashboard`
2. Navigate to **Settings → API Keys**  
3. Click **Generate New Key**
4. Copy and securely store your key

## Core Endpoints

### Health Check

Check system status and API availability.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "email": "healthy",
    "integrations": "healthy"
  }
}
```

### Guest Feedback API

#### Submit Guest Feedback

```http
POST /feedback
```

**Request Body:**
```json
{
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "propertyId": "hotel-001",
  "roomNumber": "501",
  "checkoutDate": "2024-01-20",
  "rating": 5,
  "feedbackText": "Excellent service and comfortable room!",
  "categories": ["service", "cleanliness", "location"],
  "metadata": {
    "source": "email",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "fb_1234567890",
  "message": "Feedback submitted successfully",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

#### Get Feedback by ID

```http
GET /feedback/{feedbackId}
```

**Response:**
```json
{
  "feedbackId": "fb_1234567890",
  "guestName": "John Doe",
  "propertyId": "hotel-001",
  "rating": 5,
  "feedbackText": "Excellent service and comfortable room!",
  "status": "processed",
  "createdAt": "2024-01-20T10:30:00Z",
  "processedAt": "2024-01-20T10:31:15Z"
}
```

#### List Feedback

```http
GET /feedback?propertyId=hotel-001&limit=50&offset=0
```

**Query Parameters:**
- `propertyId` (optional): Filter by property
- `rating` (optional): Filter by rating (1-5)
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)
- `limit` (optional): Number of results (default: 50, max: 200)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "feedback": [
    {
      "feedbackId": "fb_1234567890",
      "guestName": "John Doe",
      "rating": 5,
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Feedback Request API

#### Send Feedback Request

```http
POST /feedback-requests
```

**Request Body:**
```json
{
  "guestName": "Jane Smith",
  "guestEmail": "jane@example.com",
  "propertyId": "hotel-001",
  "propertyName": "Grand Hotel Downtown",
  "checkoutDate": "2024-01-20",
  "roomNumber": "302",
  "templateId": "standard-checkout",
  "language": "en",
  "sendAt": "2024-01-20T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1234567890",
  "scheduledAt": "2024-01-20T14:00:00Z",
  "trackingUrl": "https://feedback.hotel.com/r/req_1234567890"
}
```

#### Track Request Status

```http
GET /feedback-requests/{requestId}
```

**Response:**
```json
{
  "requestId": "req_1234567890",
  "status": "sent",
  "sentAt": "2024-01-20T14:00:15Z",
  "opened": true,
  "openedAt": "2024-01-20T14:15:30Z",
  "clicked": false,
  "responded": false
}
```

### CRM Integration API

#### Connect CRM System

```http
POST /integrations/crm
```

**Request Body:**
```json
{
  "systemType": "crm",
  "systemName": "Salesforce",
  "apiKey": "your-crm-api-key",
  "baseUrl": "https://your-org.salesforce.com",
  "webhookUrl": "https://your-webhook.com/crm-updates",
  "configuration": {
    "syncInterval": 3600,
    "dataMapping": {
      "guestEmail": "Contact.Email",
      "guestName": "Contact.Name"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "integrationId": "int_crm_1234567890",
  "status": "connected",
  "message": "Salesforce integration established successfully"
}
```

#### Sync Guest Data

```http
POST /integrations/{integrationId}/sync
```

**Response:**
```json
{
  "success": true,
  "syncId": "sync_1234567890",
  "recordsSynced": 150,
  "startedAt": "2024-01-20T10:30:00Z",
  "completedAt": "2024-01-20T10:35:00Z"
}
```

### Analytics API

#### Get Property Analytics

```http
GET /analytics/properties/{propertyId}?period=30d
```

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y`
- `metrics`: Comma-separated list of metrics to include

**Response:**
```json
{
  "propertyId": "hotel-001",
  "period": "30d",
  "metrics": {
    "totalFeedback": 245,
    "averageRating": 4.3,
    "responseRate": 0.67,
    "sentimentScore": 0.82,
    "categoryBreakdown": {
      "service": 4.5,
      "cleanliness": 4.2,
      "location": 4.1,
      "value": 3.9
    }
  },
  "trends": {
    "rating": {
      "current": 4.3,
      "previous": 4.1,
      "change": "+0.2"
    }
  }
}
```

### Export API

#### Export Feedback Data

```http
POST /exports/feedback
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "propertyId": "hotel-001",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31"
  },
  "fields": ["guestName", "rating", "feedbackText", "createdAt"],
  "deliveryMethod": "download"
}
```

**Response:**
```json
{
  "success": true,
  "exportId": "exp_1234567890",
  "downloadUrl": "https://exports.hotel.com/exp_1234567890.csv",
  "expiresAt": "2024-01-27T10:30:00Z"
}
```

## Error Handling

All API responses use consistent error formatting:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Guest email is required",
    "field": "guestEmail",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | Description | Status Code |
|------|-------------|-------------|
| `INVALID_API_KEY` | API key is missing or invalid | 401 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limits

API requests are rate-limited to ensure system stability:

- **Standard Plan:** 1,000 requests/hour
- **Professional Plan:** 5,000 requests/hour  
- **Enterprise Plan:** 25,000 requests/hour

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642680000
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Available Events

- `feedback.submitted` - New feedback received
- `feedback.processed` - Feedback analysis completed
- `request.sent` - Feedback request email sent
- `request.opened` - Guest opened feedback request
- `integration.connected` - New system integration
- `integration.sync.completed` - Data sync finished

### Webhook Payload Example

```json
{
  "event": "feedback.submitted",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "feedbackId": "fb_1234567890",
    "propertyId": "hotel-001",
    "rating": 5,
    "guestEmail": "john@example.com"
  }
}
```

## SDK and Libraries

Official SDKs are available for popular programming languages:

- **JavaScript/Node.js:** `npm install hotel-guest-comm-sdk`
- **Python:** `pip install hotel-guest-comm`
- **PHP:** `composer require hotel/guest-communication`

### JavaScript Example

```javascript
import HotelGuestComm from 'hotel-guest-comm-sdk';

const client = new HotelGuestComm({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.hotel-guest-communication.com/v1'
});

// Submit feedback
const feedback = await client.feedback.submit({
  guestName: 'John Doe',
  guestEmail: 'john@example.com',
  rating: 5,
  feedbackText: 'Great stay!'
});
```

## Support

- **Documentation:** https://docs.hotel-guest-communication.com
- **API Status:** https://status.hotel-guest-communication.com  
- **Support:** support@hotel-guest-communication.com
- **Community:** https://community.hotel-guest-communication.com

## Changelog

### v2.0.0 - Latest
- Enhanced security with AES encryption
- Improved rate limiting
- New analytics endpoints
- Webhook reliability improvements

### v1.2.0
- Added CRM integration API
- Export functionality
- Bulk operations support

### v1.1.0
- Initial feedback request automation
- Basic analytics
- Email template management
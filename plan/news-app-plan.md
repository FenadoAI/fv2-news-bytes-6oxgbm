# News App Implementation Plan

## Overview
Build an Inshorts-style news app that scrapes Indian publications, summarizes articles to 60 words using AI, and presents them in a clean, categorized interface.

## Backend Implementation

### 1. Database Schema
- Collection: `news_articles`
  - `_id`: ObjectId
  - `title`: string
  - `summary`: string (60 words)
  - `category`: enum [Technology, Business, Sports]
  - `source_url`: string
  - `source_name`: string
  - `image_url`: string (optional)
  - `published_at`: datetime
  - `created_at`: datetime

### 2. API Endpoints
- `POST /api/news/scrape` - Trigger scraping from sources
- `GET /api/news` - Get all news articles (with category filter, pagination)
- `GET /api/news/{id}` - Get single article
- `DELETE /api/news/{id}` - Delete article (admin)
- `GET /api/news/categories` - Get available categories

### 3. Core Services
- **Web Scraper**: Use requests + BeautifulSoup to extract articles
- **AI Summarizer**: Use LiteLLM (gemini-2.5-flash) to summarize to exactly 60 words
- **Category Classifier**: Use AI to categorize into Technology/Business/Sports

## Frontend Implementation

### 1. Pages
- **Home Page**: Display all news cards with category filters
- **Admin Page**: Manual scrape trigger, article management

### 2. Components
- **NewsCard**: Card showing title, summary, category tag, source
- **CategoryFilter**: Buttons to filter by category
- **NewsGrid**: Responsive grid layout for cards

### 3. Design
- Inshorts-like clean interface
- Mobile-first responsive design
- Category color coding (Tech: blue, Business: green, Sports: orange)
- Infinite scroll or pagination

## Implementation Steps

### Phase 1: Backend
1. Create MongoDB schema and models
2. Implement web scraping utility (BeautifulSoup)
3. Implement AI summarization (LiteLLM + gemini-2.5-flash)
4. Create FastAPI endpoints
5. Test APIs

### Phase 2: Frontend
1. Create NewsCard component
2. Create CategoryFilter component
3. Build Home page with news grid
4. Build Admin page
5. Add responsive styling
6. Connect to backend APIs

### Phase 3: Testing & Deployment
1. Test backend APIs
2. Test frontend UI
3. Build and reload services

## Success Criteria
- ✅ Can scrape articles from URLs
- ✅ AI summarizes articles to 60 words
- ✅ Articles categorized correctly
- ✅ Clean, responsive UI similar to Inshorts
- ✅ Category filtering works
- ✅ Mobile-friendly design

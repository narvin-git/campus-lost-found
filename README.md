# Campus Lost & Found System

A full-stack web application built using:

- Node.js
- Express.js
- MySQL
- HTML, CSS, JavaScript

## Features
- Submit lost/found reports
- View all reports
- Search and filter
- Update status
- Delete reports
- Dashboard statistics
- 404 page handling
- Performance optimization (Lighthouse 100)

## Setup Instructions

1. Install Node.js
2. Install MySQL
3. Create database `campus_lost_found`
4. Configure `.env`
5. Run:    
- cd server
- npm install
- npm run dev

## Performance

Lighthouse testing was conducted and achieved:
- Performance: 100
- Best Practices: 100
- SEO: 90+

Performance improvements implemented:
- Deferred JavaScript loading
- Static asset caching using Cache-Control headers

## Error Handling
- JSON 404 for invalid API routes
- Custom 404 HTML page for invalid browser routes

## Author
Narvinderjeet Singh Jassal
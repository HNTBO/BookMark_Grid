# Brute Bookmarks

A beautiful, self-hosted bookmark manager featuring automatic high-quality icon fetching from Wikimedia Commons, custom icon uploads, emoji icons, and category organization. Optional multi-user authentication via Clerk.

## Features

### Core Features
- **Category Organization** - Organize bookmarks into custom categories
- **Custom Naming** - Give bookmarks any name you want
- **Plus Icon Cards** - Easy bookmark addition with prominent plus cards in each category
- **Beautiful UI** - Modern gradient design with smooth animations

### Icon Management
- **Automatic Icon Fetching** - Search and download high-quality logos from Wikimedia Commons
- **Emoji Icons** - Search and use Twemoji icons for your bookmarks
- **Server-Side Caching** - Icons are downloaded once and cached on your server
- **Custom Upload** - Upload your own custom icons (with drag-and-drop support)
- **Favicon Fallback** - Automatically fetch and cache favicons for quick setup

### Data Management
- **Server-Side Storage** - Bookmark data persisted in `/data/bookmarks.json`
- **Export/Import** - Backup and restore your bookmarks as JSON
- **Delete Controls** - Easy deletion of individual bookmarks or entire categories

### Authentication (Optional)
- **Clerk Integration** - Optional multi-user authentication
- **Works Without Auth** - Runs as single-user without configuration

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js + Express
- **Image Processing**: Sharp (for icon optimization)
- **Icon Sources**: Wikimedia Commons API, Twemoji (Twitter emojis), DuckDuckGo favicons
- **Storage**: Server filesystem for icons and bookmark data
- **Auth**: Clerk (optional)
- **Deployment**: Docker, systemd, nginx

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/brute-bookmarks.git
cd brute-bookmarks

# Copy and configure environment (optional for auth)
cp .env.example .env
# Edit .env if you want Clerk authentication

# Run with Docker Compose
docker-compose up -d
```

Visit `http://localhost:3002` in your browser.

### Option 2: Local Development

```bash
# Clone and install
git clone https://github.com/yourusername/brute-bookmarks.git
cd brute-bookmarks
npm install

# Copy environment file
cp .env.example .env

# Start development server (with hot-reload)
npm run dev
```

### Option 3: VPS Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed VPS deployment with nginx and systemd.

## Icon Search Procedure

When adding a bookmark, you have four options for icons:

### 1. Use Favicon (Quick & Easy)
- Click "Use Favicon" button
- Automatically fetches the site's favicon via DuckDuckGo
- Cached on server for fast loading

### 2. Search Wikimedia Commons (High Quality)
- Click "Search Wikimedia" button
- Enter search term (e.g., "Google", "Facebook", "GitHub")
- Browse high-quality logo results
- Click to select and automatically download to server
- Icons are optimized and cached

### 3. Search Emojis (Twemoji)
- Click "Search Emojis" button
- Enter keyword (e.g., "music", "coffee", "rocket")
- Browse Twitter's open-source emoji library
- High-quality vector-based emoji icons

### 4. Upload Custom Icon
- Click "Upload Custom" or drag-and-drop image
- Supports: PNG, JPG, GIF, SVG, WebP, ICO
- Automatically optimized to 128x128px
- Stored on server

## How It Works

### Icon Workflow
1. **User searches** for icon on Wikimedia Commons
2. **Backend queries** Wikimedia Commons API
3. **Results displayed** in modal with thumbnails
4. **User selects** desired icon
5. **Backend downloads** full resolution image
6. **Sharp optimizes** to 128x128px PNG
7. **Server caches** in `/icons` directory
8. **Path stored** in bookmark data

### Benefits
- High-quality, professional logos
- No external dependencies after download
- Fast loading (local files)
- Consistent sizing and format
- Reduced bandwidth usage

## API Endpoints

All endpoints except `/api/config` require authentication when Clerk is configured.

### GET /api/config
Returns Clerk publishable key (public endpoint)
```json
{ "clerkPublishableKey": "pk_test_..." }
```

### GET /api/search-icons?query=X
Search for icons on Wikimedia Commons
```bash
GET /api/search-icons?query=github
```
Returns: `{ "icons": [{ "title", "url", "thumbUrl", "width", "height" }] }`

### POST /api/download-icon
Download and cache an icon from URL
```json
{ "url": "https://...", "source": "wikimedia" }
```
Returns: `{ "success": true, "iconPath": "/icons/abc123.png", "cached": false }`

### POST /api/upload-icon
Upload a custom icon file (multipart/form-data)
- Field: `icon` (image file)
- Returns: `{ "success": true, "iconPath": "/icons/custom_xyz.png" }`

### POST /api/get-favicon
Fetch and cache favicon for a URL
```json
{ "url": "https://github.com" }
```
Returns: `{ "success": true, "iconPath": "/icons/favicon_abc.png", "cached": false }`

### GET /api/search-emojis?query=X
Search Twemoji library
```bash
GET /api/search-emojis?query=rocket
```
Returns: `{ "emojis": [{ "code", "keyword", "url", "thumbUrl" }] }`

### POST /api/download-emoji
Download and convert emoji SVG to cached PNG
```json
{ "code": "1f680" }
```
Returns: `{ "success": true, "iconPath": "/icons/emoji_1f680.png", "cached": false }`

### GET /api/data
Get all bookmark data
Returns: Array of category objects

### POST /api/data
Save bookmark data
```json
[{ "id": "cat1", "name": "Category", "bookmarks": [...] }]
```
Returns: `{ "success": true }`

## File Structure

```
brute-bookmarks/
├── public/
│   ├── index.html          # Frontend application (single-page)
│   └── js/
│       ├── auth.js         # Clerk SDK integration
│       └── auth-fetch.js   # Token injection for API calls
├── middleware/
│   └── clerk-auth.js       # Express Clerk middleware
├── icons/                  # Cached icons (auto-created)
├── data/
│   └── bookmarks.json      # Persisted bookmark data
├── docs/                   # Additional documentation
├── server.js               # Express backend server
├── package.json            # Node.js dependencies
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose configuration
├── nginx.conf              # Nginx reverse proxy config
├── bookmarks.service       # Systemd service file
├── deploy.sh               # Automated VPS deployment
├── DEPLOYMENT.md           # Detailed VPS deployment guide
├── CLAUDE.md               # AI assistant guidance
└── README.md               # This file
```

## Configuration

### Environment Variables

Create a `.env` file from the example:
```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3002) |
| `NODE_ENV` | No | `development` or `production` |
| `CLERK_PUBLISHABLE_KEY` | No | Clerk frontend key (enables auth) |
| `CLERK_SECRET_KEY` | No | Clerk backend key (enables auth) |

### Running Without Authentication

Leave `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` empty or unset. The app runs as a single-user bookmark manager without login.

### Enabling Authentication

1. Create a [Clerk](https://clerk.com) account
2. Create an application in Clerk dashboard
3. Copy your API keys to `.env`:
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. Restart the server

See [docs/clerk-guide.md](docs/clerk-guide.md) for detailed Clerk setup.

### Custom Domain
1. Update `nginx.conf` with your domain
2. Update SSL certificate paths
3. Reload nginx: `sudo systemctl reload nginx`

## Maintenance

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Stop
docker-compose down

# Backup data and icons
docker cp brute-bookmarks:/app/data ./backup-data
docker cp brute-bookmarks:/app/icons ./backup-icons
```

### Systemd Commands (VPS)
```bash
# View logs
journalctl -u bookmarks -f

# Restart service
sudo systemctl restart bookmarks

# Check status
sudo systemctl status bookmarks
```

### Backup
```bash
# Backup data and icons (local/VPS)
tar -czf bookmarks-backup-$(date +%Y%m%d).tar.gz data/ icons/
```

### Clear Icon Cache
```bash
# Remove all cached icons
rm -rf icons/*
```

## Troubleshooting

### Icons not loading
- Check icons directory exists and is writable: `ls -la icons/`
- Verify service is running: `docker-compose ps` or `systemctl status bookmarks`
- Check logs for errors

### Wikimedia search failing
- Verify internet connectivity from server
- Check API response in logs
- Try different search terms

### Upload failing
- Check nginx `client_max_body_size` setting (if using nginx)
- Verify icons directory is writable
- Check disk space: `df -h`

### Authentication issues
- Verify Clerk keys are correct in `.env`
- Check browser console for Clerk SDK errors
- Ensure Clerk application URLs are configured correctly

## Security Notes

- All icons are processed and optimized server-side
- File uploads are restricted to image types only
- Maximum file size: 5MB (configurable in server.js)
- API endpoints protected by Clerk authentication (when configured)
- Docker runs as non-root user
- HTTPS recommended via nginx reverse proxy

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Credits

- Icon source: [Wikimedia Commons](https://commons.wikimedia.org)
- Emoji source: [Twemoji](https://github.com/twitter/twemoji) (Twitter's open-source emoji library)
- Favicon service: [DuckDuckGo](https://duckduckgo.com)
- Authentication: [Clerk](https://clerk.com)
- Inspired by: Speed Dial 2 Chrome Extension (RIP)

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for setup help
2. Review logs for error messages
3. Verify all dependencies are installed
4. Check file permissions

## Future Enhancements

- [x] Multi-user support with authentication (Clerk)
- [ ] Drag-and-drop bookmark reordering
- [ ] Bookmark tags and search
- [ ] Dark/light theme toggle
- [ ] Browser extension for quick bookmark addition
- [ ] Icon preview before download
- [ ] Bulk icon update functionality

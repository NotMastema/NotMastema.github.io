# NotMastema.github.io - Project Artifact

## Project Overview

This is a personal website and portfolio for Rafael (NotMastema), built using Jekyll and hosted on GitHub Pages. The site includes a personal homepage and a password-protected commission tracker application.

**Live URL**: https://notmastema.github.io
**Repository**: https://github.com/NotMastema/NotMastema.github.io

## Owner Information

- **Name**: Rafa (Rafael)
- **Bio**: "Just another plant hoarding, gadget tinkering, guitar attempting, tattooed and always curious human wandering the internet"
- **Location**: Somewhere
- **Contact**: rafaelsemail@gmail.com
- **GitHub**: @NotMastema

## Technology Stack

### Core Technologies
- **Jekyll**: Static site generator (GitHub Pages compatible)
- **Ruby**: Required for Jekyll
- **Minimal Mistakes Theme**: v4.26.2 (dark skin)
- **HTML/CSS/JavaScript**: For custom applications
- **GitHub Pages**: Hosting platform

### Jekyll Plugins
- jekyll-paginate
- jekyll-sitemap
- jekyll-gist
- jekyll-feed
- jekyll-include-cache

### Build Tools
- Bundler (for Ruby dependency management)
- Gemfile defines dependencies

## Project Structure

```
NotMastema.github.io/
├── _config.yml              # Jekyll configuration
├── _data/
│   └── navigation.yml       # Site navigation structure
├── _pages/
│   └── comm-tracker.html    # Password protection wrapper for commission tracker
├── assets/
│   └── images/              # Site images and assets
├── comm-tracker-app/
│   └── index.html           # Protected commission tracker application
├── index.md                 # Homepage content
├── Gemfile                  # Ruby dependencies
├── .gitignore              # Git ignore rules
└── README.md               # Basic project description
```

## Key Files Explained

### `_config.yml`
Main Jekyll configuration file containing:
- Site metadata (title, description, URL)
- Theme configuration (Minimal Mistakes dark theme)
- Author information and social links
- Plugin settings
- Default layouts for posts and pages
- Markdown processor settings

### `index.md`
Homepage content featuring:
- Welcome message
- About Me section introducing Rafael
- Placeholder for recent blog posts

### `_pages/comm-tracker.html`
Password protection portal for the commission tracker:
- Client-side password protection using SHA-256 hashing
- Session management (8-hour timeout)
- Beautiful gradient UI with lock icon
- Loads the actual tracker in an iframe after authentication
- Cookie and sessionStorage for auth state

**Security Note**: Client-side protection only - suitable for casual protection, not sensitive data.

### `comm-tracker-app/index.html`
The actual commission tracker application:
- Multi-layered access verification
- Checks for valid auth token, session time, cookie, and referrer
- Redirects to login page if unauthorized
- Protected content only renders when fully authenticated

### `_data/navigation.yml`
Site navigation structure (currently only has Home link)

## Features

### 1. Personal Portfolio Site
- Clean, minimal design using Minimal Mistakes theme
- Dark theme aesthetic
- Author profile with avatar and bio
- Social media links (GitHub, Twitter, Email)
- Blog-ready structure (posts will appear automatically)

### 2. Password-Protected Commission Tracker
- Dedicated application at `/comm-tracker/`
- Multi-layer security implementation:
  - SHA-256 password hashing
  - Session storage with time-based expiration (8 hours)
  - Cookie-based authentication
  - Referrer checking
  - Iframe isolation
- Beautiful gradient UI with modern design
- Automatic session timeout and cleanup
- Aggressive access blocking for unauthorized attempts

## Development Workflow

### Local Development
```bash
# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve

# Site will be available at http://localhost:4000
```

### Deployment
- Automatic deployment via GitHub Pages
- Push to main branch triggers rebuild
- Changes appear within minutes

### Working with Content
- **Blog posts**: Create `.md` files in `_posts/` directory (not yet created)
- **Pages**: Add files to `_pages/` directory
- **Navigation**: Edit `_data/navigation.yml`
- **Site config**: Modify `_config.yml`

## Git Branching Strategy

- **Main branch**: Production-ready code (auto-deploys to GitHub Pages)
- **Feature branches**: Use `claude/` prefix for Claude-generated branches
- Recent branches indicate active development on password protection features

## Recent Development History

Based on recent commits:
- Multiple PRs for password protection implementation
- Strengthened commission tracker access gating
- Active development on security features for protected sections

## Working with This Codebase

### Common Tasks

**Adding a new page:**
1. Create `.md` or `.html` file in `_pages/`
2. Add front matter with layout and permalink
3. Add to navigation in `_data/navigation.yml` if needed

**Modifying the commission tracker:**
- Main wrapper: `_pages/comm-tracker.html`
- Actual app: `comm-tracker-app/index.html`
- Password is hashed with SHA-256 (see hash in comm-tracker.html)

**Changing theme or styling:**
- Theme settings in `_config.yml`
- Custom CSS can be added to `assets/css/`
- Current theme: Minimal Mistakes (dark skin)

**Updating author info:**
- Edit author section in `_config.yml`
- Update bio, links, and contact information
- Avatar image at `/assets/images/IMG_0201.jpg`

### Important Notes

1. **Jekyll Processing**: Changes to `_config.yml` require server restart
2. **Include Directive**: `comm-tracker-app` is explicitly included in config
3. **Remote Theme**: Uses GitHub-hosted Minimal Mistakes theme
4. **Markdown**: Uses kramdown processor with GFM (GitHub Flavored Markdown)
5. **Permalinks**: Commission tracker is at `/comm-tracker/` permalink

## Dependencies Management

- `Gemfile` uses `github-pages` gem for compatibility
- Ensures local development matches GitHub Pages environment
- Run `bundle update` periodically to update dependencies
- Platform-specific gems for Windows/JRuby included

## Design Philosophy

- **Minimal and Clean**: Focus on content, not clutter
- **Personal Touch**: Reflects Rafael's interests and personality
- **Privacy-Conscious**: Password protection for sensitive content
- **Modern Aesthetics**: Gradient designs, rounded corners, smooth transitions
- **Mobile-Friendly**: Responsive design via Minimal Mistakes theme

## Future Expansion Possibilities

- Blog posts section (structure already in place)
- Project portfolio pages
- Additional protected sections using same auth pattern
- Custom styling beyond theme defaults
- Integration with GitHub Pages features (comments, analytics, etc.)

## Security Considerations

### Current Implementation
- **Client-Side Password Protection**: Uses SHA-256 hashing
- **Session Management**: 8-hour timeout with cookie validation
- **Multi-Layer Verification**: Token + time + cookie + referrer checks

### Limitations
- Password hash is visible in source code (client-side limitation)
- Not suitable for highly sensitive data
- Can be bypassed by determined users
- Appropriate for casual privacy, not security-critical content

### For Stronger Security
Would require:
- Server-side authentication
- Backend database
- HTTPS enforcement
- Rate limiting
- More robust session management

## Contact and Support

For questions or modifications to this project, contact:
- **Email**: rafaelsemail@gmail.com
- **GitHub**: @NotMastema
- **Site Issues**: Submit via GitHub repository issues

---

**Last Updated**: November 2025
**Jekyll Version**: Compatible with GitHub Pages
**Theme**: Minimal Mistakes 4.26.2
**License**: Not specified in repository

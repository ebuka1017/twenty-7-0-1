'# Requirements Document

## Introduction

2701 is a Reddit-native ARG (Alternate Reality Game) platform that transforms passive browsing into active community puzzle-solving through a cyberpunk vault aesthetic. Built on Devvit Web, the system generates cryptographic ciphers tied to real-world events, enables collective solving through rallying mechanics, and builds toward a grand revelation through accumulated narrative breadcrumbs. The platform creates a self-sustaining mystery game within Reddit's ecosystem, inspired by Cicada 3301's sophisticated design principles while leveraging Reddit's hive-mind collaboration capabilities. Users experience 2701 as entering a secret digital society where every cipher is a locked vault, every rally is a vote of confidence, and every breadcrumb leads toward uncovering profound truths about digital sovereignty, privacy, and the nature of reality itself.

## Glossary

- **2701_System**: The complete ARG platform including cipher generation, user interface, and community mechanics built on Reddit's Devvit Web framework
- **ARG**: Alternate Reality Game - an interactive narrative that uses the real world as a platform
- **Cipher**: A cryptographic puzzle (text, image, or audio) with specific difficulty ratings and time constraints
- **Rally**: The act of supporting a guess by clicking on it, incrementing a counter with satisfying visual feedback (green glow effect, haptic vibration, click sound), representing community consensus
- **Successful_Rally**: Supporting a guess that becomes the winning solution when the cipher expires, contributing to user reputation and title progression
- **Breadcrumb**: Narrative elements revealed through solved ciphers containing metadata (narrative_thread_id, thematic_category, connection_weight 0.1-1.0) that algorithmically connect to form larger story arcs
- **Vault**: The main dashboard interface styled as a cyberpunk command center where users view active ciphers as glowing cards, leaderboards, and personal progress with dark theme (#1a1a1a background, #00ff88 accents)
- **Master_Locksmith**: A user title earned after 10+ cipher solves AND 50%+ successful rally participation rate (rallying behind winning guesses)
- **Teaser**: A preview hint for upcoming ciphers shown exactly 15 minutes before activation with fade-in animation and countdown timer
- **Expiration**: The moment when a cipher's time limit ends (3h Easy/4h Medium/5h Hard), triggering automatic solution reveal and breadcrumb distribution
- **Hive_Mind**: The collective intelligence of Reddit users working together, measured by rally consensus and collaborative solving patterns
- **Triad**: The three thematic pillars woven into all ciphers: 18 U.S.C. §2701 (digital privacy/ECPA), PCAOB AS 2701 (financial auditing), 35 U.S.C. §154 (patent law)
- **Narrative_Thread**: Thematic groupings of breadcrumbs determined by cosine similarity matching (threshold >0.7) of embedded keywords and concepts
- **Connection_Weight**: Algorithmic score (0.1-1.0) indicating how strongly a breadcrumb relates to others in its thread, calculated via keyword overlap and thematic relevance
- **Theme_Dictionary**: Predefined keyword sets for each Triad pillar (e.g., Privacy: ["ECPA", "surveillance", "encryption"], Auditing: ["PCAOB", "SOX", "compliance"], Patents: ["USPTO", "prior art", "claims"])
- **Real-time_Sync**: Updates propagated to all clients within 2 seconds via Devvit realtime and WebSocket connections
- **KV_Store**: Reddit's key-value storage system used for persistent game state
- **Devvit_Web**: Reddit's framework for building interactive web applications within Reddit posts

## Requirements

### Requirement 1 (Priority: MUST HAVE - MVP Core)

**User Story:** As a Reddit user, I want to access an immersive ARG dashboard within Reddit posts, so that I can participate in community puzzle-solving without leaving the platform.

#### Acceptance Criteria

1. WHEN a user clicks on a 2701 post, THE 2701_System SHALL display a Devvit splash screen with cyberpunk background image (1920x1080px, <2MB), cicada-inspired app icon (512x512px), heading "A New Cipher Has Dropped", description showing cipher teaser, and "Enter the Vault" button within 3 seconds
2. WHEN a user clicks the entry button, THE 2701_System SHALL load the Vault dashboard webview from verified domain within 5 seconds on desktop, 8 seconds on mobile, with smooth fade-in transition (500ms duration)
3. THE 2701_System SHALL display the dashboard with exact CSS styling: background #1a1a1a, primary accent #00ff88, secondary accent #ff6b6b (for warnings), font-family 'JetBrains Mono', and contrast ratio ≥4.5:1 for WCAG AA compliance
4. THE 2701_System SHALL render responsively using CSS Grid with specific breakpoints: mobile (<768px, 1-column), tablet (768-1024px, 2-column), desktop (>1024px, 3-column) with touch targets ≥44px on mobile
5. WHEN user first interacts with any element (click/tap), THE 2701_System SHALL enable background audio playback (vault-synth.mp3, 30-second seamless loop, volume 0.2) with persistent mute toggle (localStorage key: '2701_audio_muted') and visual mute indicator

### Requirement 2 (Priority: MUST HAVE - MVP Core)

**User Story:** As a puzzle enthusiast, I want to see active ciphers presented as interactive cards, so that I can quickly assess difficulty and choose which puzzles to attempt.

#### Acceptance Criteria

1. THE 2701_System SHALL display active ciphers as CSS Grid cards (300x200px minimum) with maximum 6 concurrent ciphers visible
2. WHEN a new cipher drops, THE 2701_System SHALL animate card appearance using Framer Motion with 500ms fade-in and 2-second pulse effect (scale 1.0 to 1.05)
3. THE 2701_System SHALL show difficulty badges with specific colors: Easy (#4ade80), Medium (#f59e0b), Hard (#ef4444) and corresponding time limits: 3h/4h/5h
4. THE 2701_System SHALL display countdown timer (MM:SS format), current guess count (0-999+), and hint text (max 50 characters) updated every 30 seconds
5. WHEN a user hovers over a cipher card, THE 2701_System SHALL apply CSS transform scale(1.02) and box-shadow glow within 200ms transition duration

### Requirement 3 (Priority: MUST HAVE - Core Mechanic)

**User Story:** As a community solver, I want to rally behind guesses made by other users, so that I can participate in collective problem-solving even when I don't have my own solution.

#### Acceptance Criteria

1. WHEN a user clicks on a guess, THE 2701_System SHALL increment the rally counter via KV_Store ZINCRBY operation, play satisfying click sound (rally-click.mp3, 200ms), and propagate updates to all clients within 2 seconds using Devvit realtime channels
2. THE 2701_System SHALL apply visual feedback to rallied guesses: CSS glow effect (box-shadow: 0 0 15px #00ff88), scale animation (1.0 to 1.05 over 300ms), haptic feedback on mobile (navigator.vibrate([100])), and counter increment with smooth number transition
3. WHILE users are rallying, THE 2701_System SHALL synchronize counters across all connected clients using WebSocket events with fallback to 5-second polling, handling up to 100 concurrent users per cipher with real-time counter animations
4. WHEN cipher time remaining reaches exactly 10 seconds, THE 2701_System SHALL disable all rally buttons, display "LOCKED" status with pulsing red border (2px solid #ff6b6b), and show final countdown with dramatic timer styling
5. WHEN expiration occurs at 00:00, THE 2701_System SHALL freeze all interactions, determine winning guess (highest rally count, ties broken by earliest timestamp), trigger confetti animation for solvers or dramatic reveal animation for unsolved, and distribute breadcrumbs within 5 seconds

### Requirement 4 (Priority: MUST HAVE - Content Generation)

**User Story:** As an ARG participant, I want ciphers to be automatically generated based on real-world events, so that the puzzles feel relevant and grounded in current affairs.

#### Acceptance Criteria

1. THE 2701_System SHALL generate new ciphers every 60 minutes using Perplexity API (search query: "privacy OR auditing OR patents recent news") for event data and Gemini API for cipher creation, with fallback to pre-generated pool (minimum 50 ciphers) if APIs fail (timeout: 30 seconds)
2. WHEN generating ciphers, THE 2701_System SHALL incorporate at least one keyword from Theme_Dictionary sets, validate content relevance using cosine similarity (threshold ≥0.6) against Triad themes, achieve 70%+ content relevance score, and include source event timestamp and URL
3. THE 2701_System SHALL create ciphers in specific formats with exact distribution: text (60% - Caesar, Vigenère, Base64, Atbash), image (25% - steganography via HTML5 canvas, QR codes), audio (15% - Morse code, frequency analysis, spectrograms) uploaded to S3 with CDN URLs
4. THE 2701_System SHALL assign difficulty using algorithmic complexity scoring: Easy (1-2 steps, substitution ciphers), Medium (3-4 steps, polyalphabetic/book ciphers), Hard (5+ steps, RSA/multi-layer steganography), with difficulty distribution: 50%/35%/15%
5. THE 2701_System SHALL embed breadcrumb metadata in standardized JSON schema: {narrative_thread_id: string, connection_weight: float(0.1-1.0), thematic_category: enum[privacy,auditing,patents], cipher_source_event: string, unlock_threshold: integer} for algorithmic story progression

### Requirement 5 (Priority: SHOULD HAVE - Engagement)

**User Story:** As a competitive solver, I want to track my progress and earn recognition, so that I can build reputation within the community and see my improvement over time.

#### Acceptance Criteria

1. THE 2701_System SHALL maintain user profiles in KV_Store with complete schema: {user_id, solves_count, successful_rallies, total_rallies, breadcrumbs_collected[], titles[], avg_solve_time_seconds, difficulty_breakdown{easy, medium, hard}, rally_accuracy_percentage, join_timestamp, last_active}
2. WHEN a user solves a cipher or achieves successful rally participation, THE 2701_System SHALL award titles based on combined thresholds: Apprentice (1 solve), Locksmith (5 solves + 30% rally accuracy), Master_Locksmith (10 solves + 50% rally accuracy), Cipher_Sage (25 solves + 70% rally accuracy), where rally_accuracy = successful_rallies / total_rallies * 100
3. THE 2701_System SHALL display animated leaderboards with pagination (25 users per page) ranking by: total_score = (easy*1 + medium*3 + hard*5) + speed_bonus + rally_bonus, updated every 5 minutes with smooth row transitions and rank change indicators (↑↓)
4. THE 2701_System SHALL provide Reddit flair integration with custom text format: "[Title] • [Solves] solves • [Specialty]" where specialty = highest_difficulty_solved OR "Crumbmaxxer" if breadcrumbs_collected > 20, automatically updated via Reddit API
5. THE 2701_System SHALL update user statistics via KV atomic operations (HINCRBY, LPUSH) within 3 seconds of solve confirmation, broadcast rank changes via Devvit realtime events, and display achievement notifications with 2-second toast messages

### Requirement 6 (Priority: SHOULD HAVE - Administration)

**User Story:** As a Reddit moderator, I want administrative controls for content management, so that I can maintain community standards and manually upload special content when needed.

#### Acceptance Criteria

1. THE 2701_System SHALL provide admin interface accessible only to users with Reddit moderator permissions for r/2701, supporting audio file uploads to AWS S3 with formats: MP3, WAV, OGG (max 10MB, 5min duration)
2. WHEN admins upload content, THE 2701_System SHALL validate file headers, scan for malware using ClamAV API, and generate CDN URLs with 24-hour signed access tokens
3. THE 2701_System SHALL allow manual cipher creation with form fields: {title, hint, solution, difficulty, format_type, expiration_hours, breadcrumb_data} and preview functionality
4. THE 2701_System SHALL provide moderation dashboard with actions: hide_guess, ban_user_24h, flag_inappropriate with reason codes and bulk operations for spam management
5. THE 2701_System SHALL log all admin actions to KV_Store with schema: {timestamp, admin_user_id, action_type, target_id, reason} and export capability for audit trails

### Requirement 7 (Priority: COULD HAVE - Phase 2)

**User Story:** As a long-term participant, I want to see how individual ciphers connect to larger narrative arcs, so that I can understand the deeper mystery being revealed over time.

#### Acceptance Criteria

1. THE 2701_System SHALL accumulate breadcrumbs in KV_Store with complete graph structure: {breadcrumb_id, narrative_thread_id, connection_nodes[], reveal_threshold: 50, collected_timestamp, cipher_solution_hash, thematic_weight, connection_strength} and maintain real-time global progress counter with visual progress bar
2. WHEN community collects exactly 50 breadcrumbs within same narrative_thread_id (determined by cosine similarity matching of thematic_category keywords with threshold ≥0.7), THE 2701_System SHALL unlock story fragment with dramatic animated reveal (fade-in + typewriter effect) and push notification to all active users via Devvit realtime
3. THE 2701_System SHALL build toward final revelation triggered when 200 total breadcrumbs collected across all three Triad threads (privacy: 67, auditing: 67, patents: 66), activating 72-hour countdown timer with pulsing UI elements and master cipher generation using breadcrumb solutions as encryption keys
4. THE 2701_System SHALL present breadcrumb archive as searchable wiki interface with filters: narrative_thread (dropdown), date_range (calendar picker), cipher_source (text search), connection_strength (slider 0.1-1.0), and interactive D3.js force-directed graph visualization showing breadcrumb relationships
5. WHEN endgame threshold reached, THE 2701_System SHALL generate master cipher by concatenating top 20 breadcrumb solutions as Vigenère key, with difficulty automatically scaled to community average solve time (if avg < 2 hours, increase complexity by adding steganography layer), and 72-hour countdown with hourly progress notifications

### Requirement 8 (Priority: SHOULD HAVE - Mobile Experience)

**User Story:** As a mobile Reddit user, I want the full ARG experience to work seamlessly on my device, so that I can participate in time-sensitive puzzles regardless of my location or device.

#### Acceptance Criteria

1. THE 2701_System SHALL render responsively using CSS Grid and Flexbox with touch targets ≥44px, tested specifically on iOS Safari 14+, Android Chrome 90+, Reddit mobile apps (iOS/Android), with viewport meta tag and touch-action CSS properties
2. WHEN users interact on mobile devices, THE 2701_System SHALL provide touch-optimized controls with haptic feedback via navigator.vibrate([100]) for rallies, swipe gestures for cipher navigation (left/right), 300ms tap delay removal via touch-action: manipulation, and enlarged tap targets for countdown timers
3. THE 2701_System SHALL maintain Real-time_Sync across all platforms using WebSocket connections with automatic fallback to polling (5-second intervals) when WebSocket fails, displaying connection state indicators (green dot: connected, yellow: reconnecting, red: offline) in header
4. THE 2701_System SHALL optimize for mobile performance with lazy loading for cipher images, automatic WebP format conversion with JPEG fallback, total bundle size <500KB (measured via webpack-bundle-analyzer), and offline cipher caching for 24 hours using service workers with cache-first strategy
5. THE 2701_System SHALL preserve functionality with progressive enhancement: core cipher viewing works without JavaScript, audio playback requires user gesture (tap anywhere to enable), animations respect prefers-reduced-motion CSS media query by disabling transitions, and fallback text content for screen readers

### Requirement 9 (Priority: MUST HAVE - Error Handling)

**User Story:** As a user, I want the system to handle failures gracefully, so that temporary issues don't break my experience or cause data loss.

#### Acceptance Criteria

1. WHEN AI APIs fail or timeout (>30 seconds), THE 2701_System SHALL display cached fallback ciphers from pre-generated pool (minimum 50 ciphers) with clear "Backup Mode" indicator (orange banner: "Running on backup ciphers - AI services temporarily unavailable") and maintain normal cipher rotation schedule
2. WHEN KV_Store operations fail, THE 2701_System SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s), log errors to console with operation details, and display user-friendly error toast messages: "Connection issue - please try again" with retry button
3. WHEN real-time connections drop, THE 2701_System SHALL automatically reconnect within 10 seconds using exponential backoff, display "Reconnecting..." status indicator, sync missed rally updates via REST API fallback, and show "Connection restored" confirmation
4. THE 2701_System SHALL validate all user inputs with specific error messages displayed as red toast notifications: "Guess must be 1-100 characters" (length validation), "Only letters, numbers, and spaces allowed" (character validation), "Rate limit exceeded - wait 60 seconds" (rate limiting with countdown timer)
5. WHEN cipher generation produces duplicate content (checked via SHA-256 hash comparison), THE 2701_System SHALL regenerate up to 3 times with different Perplexity search terms, or select from fallback pool if all attempts fail, ensuring 100% cipher uniqueness with duplicate detection logging

### Requirement 10 (Priority: MUST HAVE - Data Validation)

**User Story:** As a system administrator, I want all data to be properly validated and sanitized, so that the platform remains secure and stable.

#### Acceptance Criteria

1. THE 2701_System SHALL sanitize all user inputs using DOMPurify library with strict configuration, rejecting HTML tags, script elements, SQL injection patterns, and XSS payloads, logging all sanitization attempts with user_id and timestamp for security monitoring
2. WHEN users submit guesses, THE 2701_System SHALL validate format using regex pattern /^[a-zA-Z0-9\s]{1,100}$/, trim whitespace, reject consecutive spaces (replace with single space), and provide immediate client-side validation feedback before server submission
3. THE 2701_System SHALL rate limit user actions with specific windows: 5 guesses per 60-second sliding window, 10 rallies per 60-second sliding window, 1 profile update per hour, enforced via KV_Store counters with TTL using keys: "rate_limit:guess:{user_id}", "rate_limit:rally:{user_id}", "rate_limit:profile:{user_id}"
4. WHEN storing breadcrumb data, THE 2701_System SHALL validate complete JSON schema with required fields: narrative_thread_id (string, UUID format), thematic_category (enum: ["privacy","auditing","patents"]), collected_timestamp (ISO 8601 format), connection_weight (float 0.1-1.0), cipher_source_hash (SHA-256), rejecting invalid data with detailed error logging
5. THE 2701_System SHALL implement CSRF protection using Reddit's built-in token validation, verify all requests contain valid Reddit authentication headers, reject unauthenticated requests with 401 status, and log all authentication failures with IP address and timestamp for security analysis

### Requirement 11 (Priority: SHOULD HAVE - Immersive Experience)

**User Story:** As an ARG participant, I want the interface to feel like entering a secret digital society, so that the experience is immersive and memorable beyond just solving puzzles.

#### Acceptance Criteria

1. THE 2701_System SHALL implement cyberpunk aesthetic with exact color palette: primary background #1a1a1a, secondary background #2d2d2d, accent green #00ff88, warning red #ff6b6b, text primary #ffffff, text secondary #a0a0a0, with all colors meeting WCAG AA contrast requirements
2. WHEN users interact with cipher cards, THE 2701_System SHALL provide satisfying feedback: hover scale transform (1.02x), click sound effect (vault-click.mp3, 150ms), subtle glow animation (0-15px green shadow over 300ms), and haptic feedback on mobile devices
3. THE 2701_System SHALL display animated elements throughout: pulsing cipher cards for new drops, typewriter effect for breadcrumb reveals (50ms per character), smooth counter increments for rallies, and particle effects for successful solves using CSS animations or Canvas API
4. WHEN background music is enabled, THE 2701_System SHALL play atmospheric audio: vault-synth.mp3 (30-second seamless loop, volume 0.2) on dashboard, tension-build.mp3 during final 60 seconds of cipher countdown, and success-chime.mp3 for solved ciphers
5. THE 2701_System SHALL use consistent typography: JetBrains Mono for all text, font weights 400 (normal) and 700 (bold), font sizes 14px (body), 18px (headings), 24px (cipher titles), with proper line-height 1.5 for readability

### Requirement 12 (Priority: COULD HAVE - Community Features)

**User Story:** As a Reddit community member, I want to engage with other solvers through comments and discussions, so that the ARG feels like a collaborative social experience.

#### Acceptance Criteria

1. THE 2701_System SHALL integrate with Reddit's comment system by automatically posting cipher solutions as comments when revealed, formatted as: "🔓 CIPHER SOLVED: [solution] | Winning guess by u/[username] with [X] rallies | Breadcrumb: [narrative_thread]"
2. WHEN users discuss ciphers in comments, THE 2701_System SHALL detect and highlight cipher-related keywords (from Theme_Dictionary) with subtle green underlines, and provide hover tooltips with definitions for cryptographic terms
3. THE 2701_System SHALL enable community-driven hint system: when a cipher remains unsolved for 75% of its duration, allow users to vote on releasing a hint (requires 10+ votes), displaying the hint with "Community Hint" label and vote count
4. THE 2701_System SHALL track and display community statistics: total ciphers solved, average solve time, most active solvers (weekly), and narrative thread completion progress as a shared achievement system visible on dashboard
5. WHEN major milestones are reached (every 25th cipher solved, narrative thread completion), THE 2701_System SHALL create celebratory Reddit posts with community achievements, solver highlights, and teaser content for upcoming story developments
#
# Non-Functional Requirements

### Performance Requirements

- **Response Time**: Dashboard loads within 5 seconds on desktop, 8 seconds on mobile (3G connection)
- **Throughput**: Support 100 concurrent users per cipher with <2 second real-time sync latency (Devvit realtime channel limit)
- **Scalability**: Handle 10,000 daily active users with horizontal scaling via Devvit infrastructure
- **Resource Usage**: KV operations <100ms, memory usage <512MB per instance, API calls <1000/hour per user

### Security Requirements

- **Authentication**: Use Reddit OAuth exclusively, no external auth systems
- **Data Privacy**: Store minimal user data, comply with Reddit's privacy policy, no PII collection beyond Reddit user ID
- **Input Validation**: Sanitize all user inputs, rate limit guess submissions (5/minute), prevent XSS/injection attacks
- **Content Security**: Validate uploaded files, scan for malware, implement CSRF protection

### Reliability Requirements

- **Availability**: 99.5% uptime during active hours (6 AM - 2 AM UTC)
- **Error Handling**: Graceful degradation when AI APIs fail, fallback to cached content, user-friendly error messages
- **Data Integrity**: Atomic KV operations, backup critical game state, prevent duplicate cipher generation
- **Recovery**: Automatic retry for failed operations, manual admin recovery tools for corrupted state

### Usability Requirements

- **Accessibility**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation, color contrast ≥4.5:1
- **Internationalization**: Support UTF-8 character sets, RTL text for Arabic ciphers, timezone-aware displays
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, Reddit mobile apps
- **Learning Curve**: New users complete first cipher interaction within 2 minutes, contextual help tooltips

## Technical Constraints

### Platform Constraints

- **Devvit Framework**: Must use Devvit Web architecture exclusively, webview domains must be HTTPS and pre-approved, no external hosting for core functionality, all data storage via Reddit's KV system
- **Reddit Integration**: All features must work within Reddit post context, respect Reddit API rate limits (60 requests/minute per OAuth app), maintain Reddit user authentication, comply with Reddit's content policy
- **KV Store Limits**: 10MB per key maximum, 1000 operations/second rate limit, 100GB total storage per app, key expiration via TTL, atomic operations for counters and sets
- **Real-time Limits**: 100 concurrent connections per Devvit realtime channel, 1MB/second message throughput, automatic connection management, fallback to polling for mobile apps
- **Audio Constraints**: S3 storage for audio files, maximum 10MB per file, 5-minute duration limit, supported formats: MP3, WAV, OGG, CDN delivery via CloudFront
- **Performance Constraints**: Webview bundle size <500KB, initial page load <5 seconds on desktop/<8 seconds on mobile, real-time updates <2 seconds latency

### External Dependencies

- **AI Services**: Perplexity API (current events), Gemini API (cipher generation), 30-second timeout, fallback required
- **Storage**: AWS S3 for audio files, CloudFront CDN, 99.9% availability SLA
- **Monitoring**: Error tracking, performance metrics, user analytics (privacy-compliant)

### Compliance Requirements

- **Reddit Policies**: Content policy compliance, no harassment/doxxing, appropriate content ratings
- **Legal**: DMCA compliance for user-generated content, COPPA compliance (13+ age requirement)
- **Data Protection**: GDPR-compliant data handling, user data deletion on request

## Assumptions and Dependencies

### Assumptions

- Users have basic cryptography knowledge or willingness to learn
- Reddit maintains stable Devvit Web platform and APIs
- Community will self-moderate inappropriate content with admin oversight
- AI services maintain consistent quality and availability

### Dependencies

- Reddit Devvit Web framework stability and feature completeness
- External AI API availability and rate limits
- AWS S3 service availability for audio content
- Community adoption and engagement for hive-mind mechanics to function

## Validation Criteria

### Functional Testing

- **Cipher Lifecycle**: Create cipher via scheduler → Display on dashboard with animations → Accept guesses with validation → Rally mechanics with real-time sync → T-10 second lockdown → Expiration with winner determination → Breadcrumb distribution → Solution reveal
- **User Journey**: First visit → Splash screen (3s load) → Dashboard load with music → Cipher card interaction → Guess submission → Rally participation → Profile update → Leaderboard display → Title progression
- **Real-time Sync**: Multiple browser tabs → Rally on one → Verify counter updates on others within 2 seconds → Test with 10+ concurrent users → Verify WebSocket fallback to polling
- **Error Scenarios**: AI API timeout (30s) → Fallback content displayed with banner, Invalid guess → Specific error toast shown, Network disconnect → Reconnection indicator → Sync missed updates, Rate limit exceeded → Countdown timer displayed
- **Mobile Testing**: Touch interactions → Haptic feedback → Responsive layout → Audio playback after gesture → Offline caching → Service worker functionality
- **Breadcrumb Testing**: Solve cipher → Breadcrumb generated → Thread connection algorithm → 50 breadcrumb threshold → Story fragment unlock → Visual graph updates → Master cipher trigger at 200 breadcrumbs

### Performance Testing

- **Load Testing**: 50 concurrent users rallying on same cipher, measure response times <2 seconds
- **Stress Testing**: Generate 100 ciphers rapidly, verify KV_Store operations remain <100ms
- **Mobile Testing**: Test on actual devices (iPhone 12, Samsung Galaxy S21) with 3G throttling

### Security Testing

- **Input Validation**: Submit malicious payloads (XSS, SQL injection), verify sanitization
- **Rate Limiting**: Exceed guess limits, verify 429 responses and temporary blocks
- **Authentication**: Test without Reddit auth, verify access denied

## Risk Assessment

### High Risk

- **AI Content Quality**: Generated ciphers may be unsolvable or inappropriate  
  *Mitigation*: Pre-generated fallback pool (50 ciphers), manual review queue for flagged content, community reporting system
- **Community Toxicity**: Harassment or inappropriate behavior  
  *Mitigation*: Automated content filtering, moderator dashboard with bulk actions, clear community guidelines with enforcement
- **Platform Changes**: Reddit/Devvit breaking changes  
  *Mitigation*: Version pinning in package.json, staging environment for testing updates, migration scripts for data

### Medium Risk

- **Performance Degradation**: High user load causing slowdowns  
  *Mitigation*: Load testing with Artillery.js, Redis caching layer, horizontal scaling via Devvit infrastructure
- **External API Failures**: AI services becoming unavailable  
  *Mitigation*: Circuit breaker pattern, multiple API providers (Perplexity + OpenAI), 72-hour fallback content cache

### Low Risk

- **User Adoption**: Low engagement affecting hive-mind mechanics  
  *Mitigation*: Soft launch in r/ARG and r/codes, gamification elements, community challenges
- **Technical Debt**: Rapid development causing maintenance issues  
  *Mitigation*: TypeScript for type safety, ESLint/Prettier for code quality, comprehensive documentation'
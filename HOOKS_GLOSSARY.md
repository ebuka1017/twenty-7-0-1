# Hooks Glossary

## What Are Hooks?

Hooks are automated assistants that monitor your development workflow and trigger intelligent actions when specific events occur. They work silently in the background to enhance your development experience by automatically handling routine tasks, preventing errors, maintaining code quality, and ensuring your project stays organized and up-to-date.

Think of hooks as your development team's automated quality assurance and productivity enhancement system - they watch for changes, anticipate needs, and take action to keep your project running smoothly without requiring manual intervention.

## Active Hooks in This Project

### 📚 Documentation & Knowledge Management

#### Auto Documentation Generator
- **Watches**: All code files (`.py`, `.js`, `.ts`, `.java`, `.cpp`, `.go`, `.rs`, etc.), config files, and build files
- **Triggers**: When any code or configuration file is modified
- **Actions**: Automatically generates comprehensive markdown documentation including API docs, usage examples, installation instructions, and deployment guides
- **Benefits**: Ensures documentation is always current and complete before deployment, prevents documentation drift

#### Client README Updater
- **Watches**: All files in `src/client/` directory
- **Triggers**: When client-side code is modified
- **Actions**: Updates the main README.md with current game description, innovative features, and play instructions
- **Benefits**: Keeps project documentation aligned with actual game functionality

#### Hooks Glossary Updater
- **Watches**: Hook configuration files in `.kiro/hooks/`
- **Triggers**: When hook configurations are modified (user-triggered)
- **Actions**: Creates or updates this HOOKS_GLOSSARY.md file with comprehensive hook documentation
- **Benefits**: Maintains transparency about automated assistance available in the project

### 🔍 Code Quality & Analysis

#### Code Cleanup Detector
- **Watches**: All code files and dependency files
- **Triggers**: When code files are modified
- **Actions**: Detects unused functions, stale code, abandoned branches, and outdated libraries; automatically removes items unused for 3+ days with reversible checkpoints
- **Benefits**: Keeps codebase clean and maintainable, prevents technical debt accumulation

#### Code Correction Learner
- **Watches**: All code files
- **Triggers**: When code files are edited
- **Actions**: Analyzes corrections to AI-generated code, updates specifications, and maintains a corrections log to prevent similar errors
- **Benefits**: Continuously improves code generation quality by learning from human corrections

#### Code Relationship Extractor
- **Watches**: Code files, configs, documentation, and schemas
- **Triggers**: When any tracked file is modified
- **Actions**: Builds and maintains a knowledge graph of relationships between files, functions, schemas, and services
- **Benefits**: Accelerates reasoning and reduces redundant searches by understanding code interconnections

### 🚀 Performance & Optimization

#### Automation Performance Tracker
- **Watches**: Hook configurations and automation files
- **Triggers**: When automation configurations are modified
- **Actions**: Monitors success ratios of automation paths, rewrites underperforming hooks, escalates only safety-critical issues
- **Benefits**: Continuously optimizes automation effectiveness while minimizing human intervention

#### Tool Performance Optimizer
- **Watches**: Tool configuration files and benchmark data
- **Triggers**: When tool configurations change
- **Actions**: Benchmarks tool options, tracks performance metrics, automatically replaces lower-performing tools
- **Benefits**: Ensures optimal tool selection for maximum development efficiency

#### Pre-Execution Simulator
- **Watches**: Configuration files, dependencies, and scripts
- **Triggers**: When config or dependency files are modified
- **Actions**: Simulates expected outcomes before task execution, generates pre-fix tasks for probable failures
- **Benefits**: Prevents idle time from predictable errors by proactively addressing issues

### 🔧 Development Workflow

#### Task Flow Manager
- **Watches**: Task status files and logs
- **Triggers**: When task-related files are modified
- **Actions**: Automatically triggers next unresolved tasks, implements retry logic with exponential backoff, maintains continuous execution
- **Benefits**: Ensures smooth workflow progression without manual task queue management

#### Context Index Auto-Reload
- **Watches**: All project files
- **Triggers**: When any file is modified
- **Actions**: Updates and maintains a comprehensive context index with all project knowledge and decisions
- **Benefits**: Ensures all project context persists and remains accessible for informed decision-making

#### Data Structure Auto-Refactor
- **Watches**: Data structure files across all languages
- **Triggers**: When data structure files are modified
- **Actions**: Identifies dependent files, applies refactoring changes system-wide, runs tests, performs performance validation
- **Benefits**: Maintains system integrity when data structures change, prevents breaking changes

### 🛠️ Platform-Specific Assistance

#### Devvit Fetch API Guide
- **Watches**: TypeScript and JavaScript files in the project
- **Triggers**: When files with potential external API calls are modified
- **Actions**: Provides guidance on Devvit's fetch capabilities, domain allowlists, and review processes
- **Benefits**: Helps developers understand and properly implement external API integrations in Devvit

#### Splash Screen Generator
- **Watches**: Game assets, client files, and styling
- **Triggers**: When game assets or main client files are updated
- **Actions**: Creates compelling splash screens for Reddit display with proper launch buttons and visual appeal
- **Benefits**: Ensures engaging entry points for players discovering the game on Reddit

#### Template Cleanup Assistant
- **Watches**: Core project files like `main.ts`, `post.ts`, README, and package.json
- **Triggers**: When template project files are significantly modified
- **Actions**: Offers to remove template code (Three.js Earth visualization) while preserving Devvit structure
- **Benefits**: Provides clean starting point for custom game development

### 🔍 Research & Discovery

#### Research Before Implementation
- **Watches**: New files being created in source directories
- **Triggers**: When new source files are created
- **Actions**: Automatically triggers research using BRAVE-SEARCH to understand implementation patterns before coding
- **Benefits**: Ensures proper implementation understanding and reduces errors from insufficient research

#### Tool Research & MCP Setup
- **Watches**: Source files, package.json, devvit.json, and Kiro settings
- **Triggers**: When development files are modified
- **Actions**: Researches and sets up MCP servers for tools that could aid development, removes unused tools
- **Benefits**: Automatically provides necessary development tools while keeping the environment clean

### 🤖 Intelligence & Automation

#### Pattern Macro Detector
- **Watches**: All code and configuration files
- **Triggers**: When files are modified
- **Actions**: Detects recurring task patterns and registers them as macros for future automation
- **Benefits**: Learns from repetitive tasks to create time-saving automation patterns

#### Unknown Command Resolver
- **Watches**: Scripts, code files, and configuration files
- **Triggers**: User-triggered when unknown commands are encountered
- **Actions**: Searches online for implementations, installs missing code, retries failed actions
- **Benefits**: Makes the system self-healing by automatically resolving missing dependencies

#### Service Failover Handler
- **Watches**: Service configuration files and API endpoint definitions
- **Triggers**: When service or API configuration files are modified
- **Actions**: Detects service issues and automatically switches to alternative endpoints or providers
- **Benefits**: Maintains continuous operation during service outages or rate limiting

#### Minimal Human Governance
- **Watches**: All files in the project
- **Triggers**: When any file is modified
- **Actions**: Analyzes changes for irreversible risk, escalates only when necessary, executes other actions autonomously
- **Benefits**: Maximizes automation while maintaining safety through intelligent risk assessment

## How Hooks Work Together

These hooks form an integrated development assistance ecosystem:

1. **Proactive Quality Assurance**: Hooks like Code Cleanup Detector and Auto Documentation Generator ensure code quality and documentation completeness without manual oversight.

2. **Intelligent Learning**: Code Correction Learner and Pattern Macro Detector continuously improve by learning from human corrections and detecting automation opportunities.

3. **Seamless Workflow**: Task Flow Manager and Context Index Auto-Reload maintain smooth development progression while preserving all project knowledge.

4. **Platform Optimization**: Devvit-specific hooks provide targeted assistance for Reddit app development, while Tool Research & MCP Setup ensures you have the right tools available.

5. **Autonomous Operation**: Minimal Human Governance and Service Failover Handler work together to maintain continuous operation with minimal interruption.

6. **Performance Focus**: Multiple hooks monitor and optimize performance at different levels - from individual tools to entire automation workflows.

The result is a development environment that anticipates needs, prevents common issues, maintains quality standards, and continuously improves its assistance capabilities while requiring minimal human intervention for routine tasks.

# Overview

This is a productivity web app called "LifeSync" that merges task management with calendar functionality. Users can organize tasks across seven themed life areas (Faith, Finance, Fitness, Family, Fortress, Fulfillment, Frivolous) and seamlessly convert tasks to calendar events through drag-and-drop. The application features a modern React frontend with Express backend, offering both task tracking and time-blocking capabilities in a unified interface.

## Recent Changes (November 2025)
- ✅ **DOCS NAVIGATION PANEL** - Added tree-like left sidebar navigation to Docs page with life area filters, note counts, and instant category filtering for organized note browsing (November 24, 2025)
- ✅ **STANDALONE NOTES FEATURE** - Created independent notes outside of tasks/events with "Taskify" button to convert notes into tasks while retaining content; notes support all life areas plus "uncategorized" category (November 24, 2025)
- ✅ **CALENDAR COLLAPSE TOGGLE** - Added hide/show calendar button to maximize Life Areas panel view; state persists across page reloads via localStorage with SSR guards (November 24, 2025)
- ✅ **DOCS SECTION** - Created centralized documentation page organizing all task/event notes by life area with inline editing and metadata (November 24, 2025)
- ✅ **TASK ARCHIVING** - Completed tasks auto-archive with timestamp tracking; accessible via Archived Tasks page from profile dropdown (November 24, 2025)
- ✅ **AUTO-SAVE COMPLETION** - Task completion checkbox saves immediately without requiring Save button click (November 24, 2025)
- ✅ **ENHANCED NATURAL LANGUAGE PROCESSING** - Fixed NLP patterns to properly detect "this friday", "next monday", etc. for automatic task scheduling (September 14, 2025)
- ✅ **AUTHENTICATION FULLY DISABLED** - Removed all authentication packages and middleware, app runs with hardcoded demo user for simplified development (September 14, 2025)
- ✅ **Unified data model architecture** - Consolidated separate task and task_event databases into single unified task model
- ✅ **Smart contextual title transformation** - "call dentist tomorrow" displays as "Call dentist sometime today" when viewed on target date
- ✅ **Seamless task-calendar integration** - Single records serve as both tasks (in sidebar) and calendar events (on calendar view)
- ✅ **Fixed flexible time event rendering** - Tasks without specific times properly appear as all-day events at top of calendar
- ✅ **Eliminated data synchronization issues** - No more separate storage preventing proper event display when navigating dates
- ✅ **Backwards compatible API** - Maintained existing endpoint structure while using unified backend storage
- ✅ **COMPLETE: All task creation sources unified** - Fixed QuickAddModal mutations to properly use parsed NLP data across all entry points (September 2, 2025)
- ✅ **Intelligent contextual title adaptation** - Task titles automatically clean temporal qualifiers when scheduled ("Call dentist tomorrow" → "Call dentist" when dragged to specific time)
- ✅ **Flexible time event drag-and-drop** - Users can drag "sometime today" events into specific time slots to schedule them
- ✅ **Complete month view implementation** - Full calendar grid with drag-and-drop, event indicators, contextual title transformations, and click-to-add functionality
- ✅ Implemented complete drag-and-drop functionality for task-to-event conversion
- ✅ Built today's calendar view with hourly time slots (6 AM - 11 PM)
- ✅ Added sample tasks for immediate testing across all 7 life areas  
- ✅ Created task event editing modal with location, notes, and completion toggle
- ✅ Fixed query parameter issues preventing events from displaying correctly
- ✅ Added visual feedback for completed tasks (strikethrough, opacity changes)
- ✅ Implemented inline checkbox functionality for task completion
- ✅ **Enhanced QuickAddModal with professional rich text editor** - TipTap-based editor with formatting, colors, links, lists, and media support
- ✅ **Immersive edge-to-edge modal design** - Expanded modal width to 95vw for better user experience
- ✅ **Collapsing life area selection** - Compact view after selection to maximize space for description
- ✅ **Natural language processing for titles** - Auto-extracts dates, times, and locations from phrases like "haircut at SuperCuts tomorrow at 10am"
- ✅ **Fixed space bar input bug** - Resolved keyboard input issue in title field when creating tasks via daily calendar view by optimizing NLP parsing timing
- ✅ **Automatic task-to-event conversion** - Tasks with dates automatically become calendar events, blurring the line between tasks and events
- ✅ **Flexible time event placement** - Tasks without specific times appear at top of daily calendar view like Google Calendar all-day events
- ✅ **Smart date detection** - "Call dentist tomorrow" from task sidebar automatically appears on tomorrow's calendar

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: React Beautiful DND for task and calendar event interactions
- **Form Handling**: React Hook Form with Zod validation integration

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with consistent error handling middleware
- **Storage Layer**: Abstract storage interface (IStorage) with in-memory implementation for development
- **Schema Validation**: Zod schemas for request/response validation
- **Development Tools**: Hot module replacement via Vite integration in development mode

## Data Storage
- **Database**: PostgreSQL configured with Drizzle ORM (in-memory storage for development)
- **Connection**: Neon Database serverless driver (@neondatabase/serverless)
- **Schema Management**: Drizzle migrations with schema definitions in shared directory
- **Unified Task Model**: Single tasks table with optional calendar fields (date, startTime, endTime, isAllDay, location, notes)
- **Architecture**: Tasks without dates appear in sidebar only; tasks with dates appear in both sidebar and calendar views
- **Benefits**: Eliminates data sync issues, enables seamless task-calendar integration, supports contextual title transformations

## Authentication & Authorization
- **Current Implementation**: Authentication fully disabled - all operations use hardcoded demo user ID "demo-user"
- **Security Model**: No user authentication or session management - simplified development setup
- **Data Access**: All data is accessible without authentication barriers

## External Dependencies
- **Database**: PostgreSQL via Neon Database serverless platform
- **UI Components**: Radix UI component primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)
- **Development**: Replit-specific plugins for error overlays and development environment integration
- **Build Tools**: ESBuild for server bundling, Vite for client bundling
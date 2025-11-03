# Ignite Client Portal (MVP)

A client-facing portal for presenting proposals and engagement experiences to prospective clients.

## Overview

This is a **front-end-only application** built with React, Vite, and Tailwind CSS. For the MVP, data is hardcoded but structured to easily integrate with the IgniteBDStack backend in the future.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **React Icons** - Icon library

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
ignite-clientportal/
├── src/
│   ├── Components/
│   │   └── Navigation.jsx          # Main navigation component
│   ├── Pages/
│   │   ├── Welcome.jsx             # Welcome/Intro page
│   │   ├── Proposal.jsx            # Proposal overview page
│   │   ├── Timeline.jsx            # Timeline & Execution page
│   │   └── HowWeWork.jsx           # How We'll Work Together page
│   ├── data/
│   │   └── mockData.js             # Hardcoded data (ready for API integration)
│   ├── App.jsx                     # Main app component with routing
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Pages

### 1. Welcome Page (`/`)
- Landing page with client greeting
- Overview of portal sections
- Navigation cards to each section
- "View Proposal" CTA button

### 2. Proposal Page (`/proposal`)
- Project details (name, description, scope)
- Deliverables list
- Pricing information
- Status badge (Draft/Submitted/Approved)
- Progress stepper (Proposal → Contract → Work Plan)
- Action buttons (Approve/Request Changes) - placeholder for future backend integration

### 3. Timeline & Execution Page (`/timeline`)
- Vertical timeline of project milestones
- Each milestone shows:
  - Title
  - Target date
  - Status (Completed/In Progress/Upcoming)
  - Duration
  - Description
- Project summary with key metrics

### 4. How We'll Work Together Page (`/how-we-work`)
- Main copy explaining portal access and collaboration
- Working Principles section (4 principles)
- Meet Your Team section with team member profiles
- Portal access reminder

## Data Structure

All mock data is located in `src/data/mockData.js`. The structure is designed to match future API responses from the IgniteBDStack backend:

- `mockClientData` - Client information
- `mockProposalData` - Proposal details
- `mockTimelineData` - Timeline and milestones
- `mockTeamData` - Team member information
- `mockWorkingPrinciples` - Working principles

## Future Integration

When ready to integrate with the IgniteBDStack backend:

1. Replace `src/data/mockData.js` with API calls
2. Use `engagementId` or `clientToken` from URL params or auth
3. Create API service files in `src/api/` (similar to gofastfrontend-demo structure)
4. Update components to use React hooks for data fetching (useState, useEffect)
5. Add loading states and error handling

## Design Notes

- Clean, professional UI with subtle gradients
- Responsive design (mobile-first approach)
- Consistent color scheme using Ignite brand colors (blue palette)
- Card-based layouts for visual hierarchy
- Status badges and progress indicators for clarity

## Notes

- All action buttons (Approve, Request Changes) currently show alerts - these are placeholders for future backend integration
- No authentication is implemented yet - this will be added when backend integration is complete
- The portal is designed to be accessible via unique engagement ID or client token in the future


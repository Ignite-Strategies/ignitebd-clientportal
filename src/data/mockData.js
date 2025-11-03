// Mock data structure - ready for future API integration
// This will be replaced with actual API calls to IgniteBDStack backend

export const mockClientData = {
  clientName: "Acme Corporation",
  engagementId: "ENG-2024-001",
  clientToken: "token-placeholder",
};

export const mockProposalData = {
  projectName: "Brand Strategy & Positioning Initiative",
  description: "A comprehensive brand strategy and positioning project to establish Acme Corporation as a market leader in the technology sector. This engagement will involve deep market research, persona development, competitive analysis, and strategic recommendations.",
  scopeSummary: "This project includes discovery workshops, market research, persona development, competitive analysis, brand positioning strategy, and delivery of strategic recommendations with implementation roadmap.",
  deliverables: [
    "Market Research Report (30+ pages)",
    "Target Persona Profiles (3-5 personas)",
    "Competitive Landscape Analysis",
    "Brand Positioning Strategy Document",
    "Implementation Roadmap & Timeline",
    "Executive Presentation Deck"
  ],
  price: 75000,
  currency: "USD",
  status: "Submitted", // Options: "Draft", "Submitted", "Approved"
  submittedDate: "2024-01-15",
};

export const mockTimelineData = {
  milestones: [
    {
      id: 1,
      title: "Discovery & Research Phase",
      targetDate: "2024-02-01",
      status: "Upcoming", // Options: "Completed", "In Progress", "Upcoming"
      description: "Initial discovery workshops, stakeholder interviews, and market research initiation. This phase sets the foundation for all strategic work.",
      duration: "2 weeks"
    },
    {
      id: 2,
      title: "Persona Development",
      targetDate: "2024-02-15",
      status: "Upcoming",
      description: "Develop detailed target personas based on research findings. Create comprehensive profiles that inform all strategic decisions.",
      duration: "1 week"
    },
    {
      id: 3,
      title: "Strategy Development",
      targetDate: "2024-03-01",
      status: "Upcoming",
      description: "Synthesize research and persona insights into a cohesive brand positioning strategy. Develop competitive differentiation framework.",
      duration: "2 weeks"
    },
    {
      id: 4,
      title: "Delivery & Presentation",
      targetDate: "2024-03-15",
      status: "Upcoming",
      description: "Final deliverables presentation, Q&A session, and handoff of all strategic materials and implementation roadmap.",
      duration: "1 week"
    }
  ],
  totalDuration: "8 weeks"
};

export const mockTeamData = {
  teamMembers: [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Strategy Lead",
      avatar: "👩‍💼",
      bio: "10+ years in brand strategy and positioning"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Research Director",
      avatar: "👨‍🔬",
      bio: "Expert in market research and competitive analysis"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Client Success Manager",
      avatar: "👩‍💻",
      bio: "Your primary point of contact for questions and coordination"
    }
  ]
};

export const mockWorkingPrinciples = [
  {
    title: "Ownership",
    description: "You own the work. We deliver strategic recommendations, and you have full visibility and control over decisions."
  },
  {
    title: "Feedback Loop",
    description: "Direct, transparent communication. If something needs to change, we address it immediately—no bureaucracy."
  },
  {
    title: "Accountability",
    description: "We move fast and transparently. This portal shows exactly where we are, what's done, and what's next."
  },
  {
    title: "Transparency",
    description: "All work, timelines, and progress are visible in this portal. No surprises, no hidden agendas."
  }
];


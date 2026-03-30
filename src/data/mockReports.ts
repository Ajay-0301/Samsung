import type { RoadReport } from "../types";

export const mockReports: RoadReport[] = [
  {
    id: "RM-1001",
    reporterName: "Anita Rao",
    issueType: "Pothole",
    description: "Deep pothole near bus stop causing two-wheeler skids.",
    locality: "MG Road, Ward 8",
    latitude: 12.9766,
    longitude: 77.5993,
    channel: "Mobile App",
    priority: "Critical",
    aiSuggestedPriority: "Critical",
    aiInsights: [
      { label: "Pothole", confidence: 0.93 },
      { label: "Surface Wear", confidence: 0.61 }
    ],
    recommendedAction: "Emergency repair within 24 hours",
    status: "Assigned",
    assignedTeam: "Central Ops Team B",
    upvotes: 12,
    reportedAt: "2026-03-19",
    slaDueDate: "2026-03-20",
    imageUrl:
      "https://images.unsplash.com/photo-1593766788305-88f8f2184a82?auto=format&fit=crop&w=900&q=60"
  },
  {
    id: "RM-1002",
    reporterName: "Rahul Menon",
    issueType: "Crack",
    description: "Long road crack expanding after recent rains.",
    locality: "Lake View Main, Ward 5",
    latitude: 12.9822,
    longitude: 77.6115,
    channel: "Web",
    priority: "High",
    aiSuggestedPriority: "High",
    aiInsights: [{ label: "Crack", confidence: 0.88 }],
    recommendedAction: "Fast-track repair within 72 hours",
    status: "In Review",
    assignedTeam: "North Zone Team A",
    upvotes: 7,
    reportedAt: "2026-03-20",
    slaDueDate: "2026-03-23",
    imageUrl:
      "https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&w=900&q=60"
  },
  {
    id: "RM-1003",
    reporterName: "Priya Nair",
    issueType: "Drainage",
    description: "Blocked drainage and waterlogging around crossing.",
    locality: "Station Road, Ward 3",
    latitude: 12.9668,
    longitude: 77.5879,
    channel: "Call Center 311",
    priority: "Medium",
    aiSuggestedPriority: "High",
    aiInsights: [{ label: "Waterlogging", confidence: 0.85 }],
    recommendedAction: "Plan repair within 3 to 5 days",
    status: "New",
    assignedTeam: "East Ward Team C",
    upvotes: 5,
    reportedAt: "2026-03-21",
    slaDueDate: "2026-03-26",
    imageUrl:
      "https://images.unsplash.com/photo-1457342813143-a1ae2748338f?auto=format&fit=crop&w=900&q=60"
  },
  {
    id: "RM-1004",
    reporterName: "Karthik Iyer",
    issueType: "Road Marking",
    description: "Pedestrian crossing paint is fully faded near school.",
    locality: "Nehru Street, Ward 2",
    latitude: 12.9721,
    longitude: 77.5802,
    channel: "Web",
    priority: "Low",
    aiSuggestedPriority: "Medium",
    aiInsights: [{ label: "Surface Wear", confidence: 0.74 }],
    recommendedAction: "Normal priority - schedule within 7 days",
    status: "Resolved",
    assignedTeam: "Rapid Response Team D",
    upvotes: 3,
    reportedAt: "2026-03-18",
    resolvedAt: "2026-03-20",
    slaDueDate: "2026-03-25",
    imageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=60",
    resolutionImageUrl:
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=60"
  }
];
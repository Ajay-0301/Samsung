export type RoadIssueType = "Pothole" | "Crack" | "Drainage" | "Road Marking" | "Streetlight";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export type SubmissionChannel = "Web" | "Mobile App" | "Call Center 311";

export type ReportStatus = "New" | "In Review" | "Assigned" | "Resolved";

export interface AIDamageInsight {
  label: "Pothole" | "Crack" | "Waterlogging" | "Surface Wear";
  confidence: number;
}

export interface RoadReport {
  id: string;
  reporterName: string;
  issueType: RoadIssueType;
  description: string;
  locality: string;
  latitude: number;
  longitude: number;
  channel: SubmissionChannel;
  priority: Priority;
  aiSuggestedPriority: Priority;
  aiInsights: AIDamageInsight[];
  recommendedAction: string;
  status: ReportStatus;
  assignedTeam: string;
  upvotes: number;
  reportedAt: string;
  resolvedAt?: string;
  slaDueDate: string;
  imageUrl: string;
  resolutionImageUrl?: string;
}
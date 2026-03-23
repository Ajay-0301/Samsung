import type { AIDamageInsight, Priority, RoadIssueType, RoadReport } from "../types";

interface DuplicateCheckInput {
  issueType: RoadIssueType;
  latitude: number;
  longitude: number;
}

interface DuplicateMatch {
  report: RoadReport;
  distanceMeters: number;
}

const criticalWords = ["accident", "injury", "hospital", "school", "bridge", "high speed"];
const highWords = ["deep", "large", "skid", "waterlogging", "traffic", "danger"];

const ISSUE_BASE_SCORE: Record<RoadIssueType, number> = {
  Pothole: 4,
  Crack: 3,
  Drainage: 3,
  "Road Marking": 2,
  Streetlight: 2
};

export function inferPriority(issueType: RoadIssueType, description: string): Priority {
  const text = description.toLowerCase();
  let score = ISSUE_BASE_SCORE[issueType];

  if (criticalWords.some((word) => text.includes(word))) {
    score += 3;
  }

  if (highWords.some((word) => text.includes(word))) {
    score += 2;
  }

  if (text.includes("night") || text.includes("rain") || text.includes("junction")) {
    score += 1;
  }

  if (score >= 8) {
    return "Critical";
  }
  if (score >= 6) {
    return "High";
  }
  if (score >= 4) {
    return "Medium";
  }
  return "Low";
}

function keywordConfidence(text: string, words: string[], base = 0.45): number {
  const matchCount = words.filter((word) => text.includes(word)).length;
  return Math.min(0.96, base + matchCount * 0.13);
}

export function simulateAIDamageInsights(
  issueType: RoadIssueType,
  description: string,
  imageName: string
): AIDamageInsight[] {
  const text = `${description} ${imageName}`.toLowerCase();
  const insights: AIDamageInsight[] = [];

  if (issueType === "Pothole" || /pothole|pit|crater|deep/.test(text)) {
    insights.push({
      label: "Pothole",
      confidence: keywordConfidence(text, ["pothole", "deep", "pit", "crater"], 0.54)
    });
  }

  if (issueType === "Crack" || /crack|split|fracture|broken/.test(text)) {
    insights.push({
      label: "Crack",
      confidence: keywordConfidence(text, ["crack", "split", "fracture", "broken"], 0.5)
    });
  }

  if (issueType === "Drainage" || /water|flood|waterlogging|drain/.test(text)) {
    insights.push({
      label: "Waterlogging",
      confidence: keywordConfidence(text, ["water", "flood", "waterlogging", "drain"], 0.49)
    });
  }

  if (insights.length === 0) {
    insights.push({
      label: "Surface Wear",
      confidence: 0.58
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
}

export function getRecommendedAction(priority: Priority): string {
  const actions: Record<Priority, string> = {
    Low: "Normal priority - schedule within 7 days",
    Medium: "Plan repair within 3 to 5 days",
    High: "Fast-track repair within 72 hours",
    Critical: "Emergency repair within 24 hours"
  };

  return actions[priority];
}

export function assignNearestTeam(locality: string, latitude: number, longitude: number): string {
  const seed = Math.abs(Math.floor(latitude * 100 + longitude * 100));
  const teams = ["North Zone Team A", "Central Ops Team B", "East Ward Team C", "Rapid Response Team D"];
  const localityBias = locality.toLowerCase();

  if (localityBias.includes("ward 8") || localityBias.includes("mg road")) {
    return "Central Ops Team B";
  }
  if (localityBias.includes("ward 3") || localityBias.includes("station")) {
    return "East Ward Team C";
  }

  return teams[seed % teams.length];
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(latitudeB - latitudeA);
  const dLon = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function findPotentialDuplicate(
  existingReports: RoadReport[],
  input: DuplicateCheckInput,
  maxDistanceMeters = 120
): DuplicateMatch | null {
  let bestMatch: DuplicateMatch | null = null;

  for (const report of existingReports) {
    if (report.issueType !== input.issueType || report.status === "Resolved") {
      continue;
    }

    const distance = haversineDistanceMeters(
      input.latitude,
      input.longitude,
      report.latitude,
      report.longitude
    );

    if (distance > maxDistanceMeters) {
      continue;
    }

    if (!bestMatch || distance < bestMatch.distanceMeters) {
      bestMatch = { report, distanceMeters: distance };
    }
  }

  return bestMatch;
}

export function countNearbyComplaints(
  existingReports: RoadReport[],
  latitude: number,
  longitude: number,
  radiusMeters = 350
): number {
  return existingReports.filter((report) => {
    if (report.status === "Resolved") {
      return false;
    }

    const distance = haversineDistanceMeters(
      latitude,
      longitude,
      report.latitude,
      report.longitude
    );

    return distance <= radiusMeters;
  }).length;
}

export function getSlaDueDate(priority: Priority): string {
  const daysByPriority: Record<Priority, number> = {
    Low: 7,
    Medium: 5,
    High: 3,
    Critical: 1
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysByPriority[priority]);
  return dueDate.toISOString().slice(0, 10);
}

export function isOverdue(status: RoadReport["status"], slaDueDate: string): boolean {
  if (status === "Resolved") {
    return false;
  }

  const today = new Date();
  const due = new Date(`${slaDueDate}T23:59:59`);
  return due.getTime() < today.getTime();
}

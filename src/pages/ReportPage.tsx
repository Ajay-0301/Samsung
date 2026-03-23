import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import type { Priority, RoadIssueType, RoadReport } from "../types";
import {
  assignNearestTeam,
  countNearbyComplaints,
  findPotentialDuplicate,
  getRecommendedAction,
  getSlaDueDate,
  inferPriority,
  simulateAIDamageInsights
} from "../utils/reportIntelligence";

interface ReportFormState {
  fullName: string;
  email: string;
  issueType: RoadIssueType;
  priority: Priority;
  emergencyMode: boolean;
  locality: string;
  landmark: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface ReportPageProps {
  existingReports: RoadReport[];
  onCreateReport: (report: RoadReport) => void;
}

const initialState: ReportFormState = {
  fullName: "",
  email: "",
  issueType: "Pothole",
  priority: "Medium",
  emergencyMode: false,
  locality: "",
  landmark: "",
  description: "",
  latitude: null,
  longitude: null
};

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  mapStyle: "road" | "satellite";
  onPick: (lat: number, lng: number) => void;
}

interface LocationSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

function RecenterMap({ latitude, longitude }: Pick<MapPickerProps, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }
    map.flyTo([latitude, longitude], 16, { duration: 0.8 });
  }, [latitude, longitude, map]);

  return null;
}

function MapClickEvents({ onPick }: Pick<MapPickerProps, "onPick">) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

function LocationPickerMap({ latitude, longitude, mapStyle, onPick }: MapPickerProps) {
  const tileConfig =
    mapStyle === "satellite"
      ? {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        }
      : {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        };

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      scrollWheelZoom
      doubleClickZoom
      className="map-surface"
    >
      <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
      <RecenterMap latitude={latitude} longitude={longitude} />
      <MapClickEvents onPick={onPick} />
      {latitude !== null && longitude !== null && (
        <CircleMarker
          center={[latitude, longitude]}
          radius={9}
          pathOptions={{ color: "#b3261e", fillColor: "#c2562d", fillOpacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}

export default function ReportPage({ existingReports, onCreateReport }: ReportPageProps) {
  const [formData, setFormData] = useState<ReportFormState>(initialState);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const [mapError, setMapError] = useState<string>("");
  const [mapStyle, setMapStyle] = useState<"road" | "satellite">("road");
  const [mapQuery, setMapQuery] = useState<string>("");
  const [mapSearching, setMapSearching] = useState<boolean>(false);
  const [mapSearchError, setMapSearchError] = useState<string>("");
  const [mapResults, setMapResults] = useState<LocationSearchResult[]>([]);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  const aiInsights = useMemo(
    () => simulateAIDamageInsights(formData.issueType, formData.description, imageName),
    [formData.issueType, formData.description, imageName]
  );

  const smartPriority = useMemo(() => {
    if (formData.emergencyMode) {
      return "Critical" as Priority;
    }
    return inferPriority(formData.issueType, formData.description);
  }, [formData.issueType, formData.description, formData.emergencyMode]);

  const smartAction = useMemo(() => getRecommendedAction(smartPriority), [smartPriority]);

  const nearbyComplaintCount = useMemo(() => {
    if (formData.latitude === null || formData.longitude === null) {
      return 0;
    }
    return countNearbyComplaints(existingReports, formData.latitude, formData.longitude);
  }, [existingReports, formData.latitude, formData.longitude]);

  const duplicateMatch = useMemo(() => {
    if (formData.latitude === null || formData.longitude === null) {
      return null;
    }

    return findPotentialDuplicate(existingReports, {
      issueType: formData.issueType,
      latitude: formData.latitude,
      longitude: formData.longitude
    });
  }, [existingReports, formData.issueType, formData.latitude, formData.longitude]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl("");
      setImageName("");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    setImageName(file.name);
  };

  const handleStartVoice = () => {
    const speechAPI = (window as Window & {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!speechAPI) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    setVoiceError("");
    const recognition = new speechAPI();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceActive(true);
    recognition.onend = () => setVoiceActive(false);
    recognition.onerror = () => {
      setVoiceActive(false);
      setVoiceError("Voice capture failed. Please try again.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setFormData((prev) => ({
          ...prev,
          description: prev.description ? `${prev.description} ${transcript}` : transcript
        }));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleOneTapFill = () => {
    setFormData((prev) => ({
      ...prev,
      issueType: "Pothole",
      description:
        prev.description ||
        "Large pothole causing traffic slowdown and safety risk near main road junction."
    }));
    handleUseCurrentLocation();
  };

  const handlePickLocation = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setMapError("");
  };

  const handleMapSearch = async () => {
    const query = mapQuery.trim();
    if (query.length < 3) {
      setMapSearchError("Enter at least 3 characters to search location.");
      setMapResults([]);
      return;
    }

    try {
      setMapSearching(true);
      setMapSearchError("");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Unable to search location now.");
      }

      const data = (await response.json()) as LocationSearchResult[];
      if (data.length === 0) {
        setMapSearchError("No location found. Try a nearby landmark or area name.");
      }
      setMapResults(data);
    } catch {
      setMapSearchError("Location search is temporarily unavailable. Please drop a pin manually.");
      setMapResults([]);
    } finally {
      setMapSearching(false);
    }
  };

  const handlePickSearchResult = (result: LocationSearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    handlePickLocation(lat, lng);
    if (!formData.locality.trim()) {
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        locality: result.display_name.split(",").slice(0, 2).join(",").trim()
      }));
    }
    setMapResults([]);
    setMapQuery(result.display_name);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapSearchError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handlePickLocation(lat, lng);
      },
      () => {
        setMapSearchError(
          "Unable to access your location. Please allow location access or use search."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.latitude === null || formData.longitude === null) {
      setMapError("Please drop a pin on the map to set exact location coordinates.");
      return;
    }

    const finalPriority = formData.emergencyMode ? "Critical" : formData.priority;
    const finalSla = getSlaDueDate(finalPriority);
    const reportId = `RM-${Math.floor(Math.random() * 9000 + 1000)}`;

    const newReport: RoadReport = {
      id: reportId,
      reporterName: formData.fullName.trim() || "Citizen Reporter",
      issueType: formData.issueType,
      description: formData.description,
      locality: formData.locality,
      latitude: formData.latitude,
      longitude: formData.longitude,
      channel: "Web",
      priority: finalPriority,
      aiSuggestedPriority: smartPriority,
      aiInsights,
      recommendedAction: smartAction,
      status: "New",
      assignedTeam: assignNearestTeam(formData.locality, formData.latitude, formData.longitude),
      upvotes: nearbyComplaintCount > 0 ? 1 : 0,
      reportedAt: new Date().toISOString().slice(0, 10),
      slaDueDate: finalSla,
      imageUrl:
        previewUrl ||
        "https://images.unsplash.com/photo-1593766788305-88f8f2184a82?auto=format&fit=crop&w=900&q=60"
    };

    onCreateReport(newReport);

    navigate("/success", {
      state: {
        id: reportId,
        issueType: formData.issueType,
        locality: `${formData.locality} (${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)})`,
        recommendedAction: smartAction
      }
    });
  };

  return (
    <section className="report-container">
      {/* HERO SECTION */}
      <section className="report-hero">
        <span className="hero-kicker">🛣️ Report Road Issues</span>
        <h1 className="report-hero-title">Submit Complaint in 3 Steps</h1>
        <p className="report-hero-subtitle">
          Help your municipality maintain safer roads. Provide details, location, and evidence.
        </p>
        <div className="quick-access-buttons">
          <button type="button" className="btn btn-quick" onClick={handleOneTapFill}>
            ⚡ One-Tap Smart Fill
          </button>
          <button type="button" className="btn btn-quick" onClick={handleStartVoice}>
            🎤 {voiceActive ? "Listening..." : "Voice Input"}
          </button>
        </div>
        {voiceError && <p className="form-warning">{voiceError}</p>}
      </section>

      <form className="report-form-organized" onSubmit={onSubmit}>
        {/* SECTION 1: YOUR DETAILS */}
        <section className="form-section">
          <h2 className="form-section-title">Step 1: Your Details</h2>
          <div className="form-section-grid">
            <label className="form-field">
              <span className="field-label">Full Name</span>
              <input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your name"
              />
            </label>

            <label className="form-field">
              <span className="field-label">Email Address</span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@email.com"
              />
            </label>
          </div>
        </section>

        {/* SECTION 2: ISSUE DETAILS */}
        <section className="form-section">
          <h2 className="form-section-title">Step 2: Issue Details</h2>
          <div className="form-section-grid-2">
            <label className="form-field">
              <span className="field-label">Issue Type</span>
              <select
                value={formData.issueType}
                onChange={(e) =>
                  setFormData({ ...formData, issueType: e.target.value as RoadIssueType })
                }
              >
                <option>Pothole</option>
                <option>Crack</option>
                <option>Drainage</option>
                <option>Road Marking</option>
                <option>Streetlight</option>
              </select>
            </label>

            <label className="form-field">
              <span className="field-label">How Urgent?</span>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
          </div>

          <label className="form-field form-field-full">
            <span className="field-label">What's the Problem?</span>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you see - size, depth, hazards, traffic impact..."
            />
          </label>

          <label className="form-field form-field-full emergency-check">
            <input
              type="checkbox"
              checked={formData.emergencyMode}
              onChange={(e) =>
                setFormData({ ...formData, emergencyMode: e.target.checked, priority: "Critical" })
              }
            />
            <span>🚨 This is an emergency (dangerous / immediate risk)</span>
          </label>
        </section>

        {/* SECTION 3: LOCATION DETAILS */}
        <section className="form-section">
          <h2 className="form-section-title">Step 3: Pinpoint Location</h2>

          <label className="form-field form-field-full">
            <span className="field-label">Locality / Street Name</span>
            <input
              required
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              placeholder="Ex: MG Road, Ward 8"
            />
          </label>

          <label className="form-field form-field-full">
            <span className="field-label">Landmark (Optional)</span>
            <input
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="Ex: Near City Bus Stop, Traffic Light"
            />
          </label>

          <div className="map-section-container">
            <div className="map-instructions">
              <p className="instruction-title">📍 Drop Location Pin on Map</p>
              <p className="instruction-text">
                Search for location, use your GPS, or click directly on the map
              </p>
            </div>

            <div className="map-controls">
              <div className="map-search">
                <input
                  value={mapQuery}
                  onChange={(e) => setMapQuery(e.target.value)}
                  placeholder="Search area name, street, or landmark..."
                />
                <button
                  type="button"
                  className="btn btn-search"
                  onClick={handleMapSearch}
                  disabled={mapSearching}
                >
                  {mapSearching ? "🔍 Searching..." : "🔍 Find"}
                </button>
              </div>

              <div className="map-options">
                <button
                  type="button"
                  className="btn btn-location"
                  onClick={handleUseCurrentLocation}
                >
                  📍 Use My Location
                </button>
                <select
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value as "road" | "satellite")}
                  className="view-toggle"
                >
                  <option value="road">🛣️ Road View</option>
                  <option value="satellite">🛰️ Satellite View</option>
                </select>
              </div>
            </div>

            {mapSearchError && <p className="alert-error">{mapSearchError}</p>}

            {mapResults.length > 0 && (
              <div className="search-results">
                <p className="results-title">Found Locations:</p>
                <ul className="results-list">
                  {mapResults.map((result) => (
                    <li key={`${result.lat}-${result.lon}`}>
                      <button
                        type="button"
                        className="result-item"
                        onClick={() => handlePickSearchResult(result)}
                      >
                        📍 {result.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="map-display">
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                mapStyle={mapStyle}
                onPick={handlePickLocation}
              />
            </div>

            <div className="coordinates-grid">
              <label className="coord-input">
                <span className="coord-label">Latitude</span>
                <input
                  value={formData.latitude?.toFixed(6) ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: e.target.value ? Number(e.target.value) : null
                    })
                  }
                  placeholder="Click map to auto-fill"
                />
              </label>

              <label className="coord-input">
                <span className="coord-label">Longitude</span>
                <input
                  value={formData.longitude?.toFixed(6) ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: e.target.value ? Number(e.target.value) : null
                    })
                  }
                  placeholder="Click map to auto-fill"
                />
              </label>
            </div>

            {mapError && <p className="alert-error">{mapError}</p>}

            {nearbyComplaintCount > 0 && (
              <p className="alert-info">
                ℹ️ {nearbyComplaintCount} similar issues already reported nearby.
              </p>
            )}

            {duplicateMatch && (
              <p className="alert-warning">
                ⚠️ Similar issue found: {duplicateMatch.report.id} ({duplicateMatch.distanceMeters.toFixed(0)}m away)
              </p>
            )}
          </div>
        </section>

        {/* SECTION 4: EVIDENCE */}
        <section className="form-section">
          <h2 className="form-section-title">Evidence & Photo</h2>

          <label className="form-field form-field-full">
            <span className="field-label">📸 Upload Road Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
          </label>

          {previewUrl && (
            <div className="image-preview-section">
              <p className="preview-label">Selected: {imageName}</p>
              <img src={previewUrl} alt="Road issue preview" className="preview-image" />
            </div>
          )}
        </section>

        {/* SECTION 5: AI ANALYSIS */}
        <section className="form-section form-section-highlight">
          <h2 className="form-section-title">🤖 AI Analysis & Smart Suggestion</h2>
          <div className="ai-insights-panel">
            <div className="ai-suggestion">
              <p className="ai-label">Suggested Priority:</p>
              <p className="ai-priority">{smartPriority}</p>
              <p className="ai-action">{smartAction}</p>
            </div>
            <div className="ai-damages">
              <p className="ai-label">Detected Issues:</p>
              <div className="chip-row">
                {aiInsights.map((insight) => (
                  <span key={insight.label} className="chip chip-neutral">
                    {insight.label} {(insight.confidence * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT SECTION */}
        <section className="form-section form-section-submit">
          <button type="submit" className="btn btn-submit">
            ✓ Submit Report
          </button>
          <p className="submit-info">
            Your report will be reviewed by local authorities and assigned to the nearest team with SLA tracking.
          </p>
        </section>
      </form>
    </section>
  );
}
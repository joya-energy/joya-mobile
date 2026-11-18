import apiClient from "../api";
import type { ClientJourneyResponse } from "./types";

export const journeyApi = {
  getJourney: async (): Promise<ClientJourneyResponse> => {
    const response = await apiClient.get<ClientJourneyResponse>(
      "/companies/me/journey",
      {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    return response.data;
  },

  markWelcomeSeen: async (): Promise<{ companyId: string | null }> => {
    const response = await apiClient.post<{ companyId: string | null }>(
      "/companies/me/welcome-seen",
    );
    return response.data;
  },

  completeFollowUp: async (): Promise<{ companyId: string; followUpCompleted: boolean }> => {
    const response = await apiClient.post<{
      companyId: string;
      followUpCompleted: boolean;
    }>("/companies/me/follow-up/complete");
    return response.data;
  },

  getFollowUpTimeline: async (): Promise<{
    companyId: string;
    followUpCompleted: boolean;
    currentStageId: number;
    stages: Array<{
      id: number;
      title: string;
      description: string;
      responsible: string;
      duration: string;
      estimated_date: string | null;
      date_editable: boolean;
      insights: string[];
      sub_steps: Array<{ label: string; status: "done" | "in_progress" | "pending" }>;
      status: "completed" | "active" | "pending";
    }>;
    dateRequests: Array<{
      _id: string;
      stage_id: number;
      requested_date: string;
      message?: string;
      status: "pending" | "approved" | "rejected";
      admin_comment?: string;
      resolved_at?: string;
    }>;
  }> => {
    const response = await apiClient.get("/companies/me/follow-up/timeline", {
      params: { _ts: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return response.data;
  },

  requestFollowUpDateChange: async (payload: {
    stageId: number;
    requestedDate: string;
    message?: string;
  }): Promise<{ ok: boolean }> => {
    const response = await apiClient.post<{ ok: boolean }>(
      "/companies/me/follow-up/date-request",
      payload,
    );
    return response.data;
  },
};

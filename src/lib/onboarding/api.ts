import apiClient from "../api";

export const onboardingApi = {
  /**
   * Étape 1 : Initialisation.
   * L'hôte réel vient du client API partagé pour que Docker, Compose et Railway
   * puissent changer d'environnement sans modifier ce fichier.
   */
  saveStep1: async (data: any) => {
    // Garder une route relative évite de recoder l'URL de l'API ici.
    const response = await apiClient.post("/companies/onboarding/step-1", data);
    return response.data; 
  },

  /**
   * Récupérer les données de l'étape 1
   */
  getStep1: async () => {
    const response = await apiClient.get("/companies/onboarding/step-1", {
      params: { _ts: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    return response.data;
  },

  /**
   * Étapes 2 à 6 : URL : /V1/companies/:companyId/onboarding/step-X
   */
  saveStep: async (stepNumber: number, companyId: string, data: any) => {
    const response = await apiClient.post(`/companies/${companyId}/onboarding/step-${stepNumber}`, data);
    return response.data;
  },

  getStepData: async (stepNumber: number, companyId: string) => {
    const response = await apiClient.get(
      `/companies/${companyId}/onboarding/step-${stepNumber}`,
      {
        params: { _ts: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );
    return response.data;
  },

  getCompletion: async (companyId: string): Promise<Record<number, boolean>> => {
    const response = await apiClient.get(
      `/companies/${companyId}/onboarding/completion`,
    );
    return response.data;
  },
};
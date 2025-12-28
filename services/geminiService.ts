import { api } from './api';

export const generateDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const response = await api.post<{ description: string }>('/ai/generate-description', { productName, category });
    return response.description;
  } catch (error: any) {
    console.error("Error generating description from backend:", error);
    throw new Error(error.message || "Failed to generate AI description. Please try again.");
  }
};

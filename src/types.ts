export interface PricingAnalysis {
  extractedJobDescription: string;
  estimatedEquipmentCost: number;
  estimatedLaborHours: number;
  recommendedPrice: number;
  equipmentMarkup: number;
  laborTotal: number;
  grossMarginPercentage: number;
  breakdown: string[];
  marketAnalysis: string;
}

export interface JobDetails {
  serviceNotes: string;
  marketContext: string;
  priceBook: string;
}

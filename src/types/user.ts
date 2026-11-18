export interface CreateLeadRequest {
  monthlyElectricityBillValue: number;
  buildingType: string;
  buildingOwnerType: string;
  energyProfile: string;
  taxId: string;
  revenue: number;
  sector: string;
  governorate: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

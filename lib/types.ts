export type MovementType = "ENTRADA" | "SAIDA" | "ESTORNO";

export interface Movement {
  id: number;
  type: MovementType;
  quantity: number;
  technician: string | null;
  destination: string | null;
  date: string;
  time: string;
  notes: string | null;
  status: "ATIVO" | "ESTORNADO";
  reversedMovementId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  stock: number;
  monthEntries: number;
  monthExits: number;
  requests: number;
  minimumStock: number;
  movements: Movement[];
  daily: { day: string; entradas: number; saidas: number }[];
  technicians: { name: string; total: number }[];
  destinations: { name: string; total: number }[];
}

export interface ReportData extends DashboardData {
  month: number;
  year: number;
  initialStock: number;
  finalStock: number;
  techniciansCount: number;
  destinationsCount: number;
  periodStart: string;
  periodEnd: string;
}

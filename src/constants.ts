export type TabType = 'main' | 'donate' | 'events' | 'admin';

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export interface PCComponent {
  name: string;
  estimatedCost: number;
  description: string;
}

export interface DonationLevel {
  amount: number;
  label: string;
  description: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  // User will fill this in
];

export const PC_COMPONENTS: PCComponent[] = [
  { name: 'GPU (Graphics Card)', estimatedCost: 2200000, description: 'Refurbished performance GPU.' },
  { name: 'CPU (Processor)', estimatedCost: 1200000, description: 'Modern multi-core processor.' },
  { name: 'Motherboard', estimatedCost: 800000, description: 'Compatible motherboard.' },
  { name: 'RAM (16GB)', estimatedCost: 600000, description: 'High-speed memory.' },
  { name: 'Storage (SSD)', estimatedCost: 400000, description: 'Fast SSD storage.' },
  { name: 'Power Supply', estimatedCost: 450000, description: 'Reliable PSU.' },
  { name: 'Case & Cooling', estimatedCost: 350000, description: 'Protective chassis.' },
];

export const DONATION_LEVELS: DonationLevel[] = [
  { amount: 500000, label: 'Starter', description: 'Covers peripherals and cables.' },
  { amount: 1500000, label: 'Key Part', description: 'Covers a major component like a CPU.' },
  { amount: 3000000, label: 'Half-Way', description: 'Covers half a refurbished build.' },
  { amount: 6000000, label: 'Hero', description: 'Covers one full PC for a student.' },
];

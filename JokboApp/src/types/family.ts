export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  gender?: 'M' | 'F';
  parentIds?: string[];
  spouseIds?: string[];
  generation?: number;
}

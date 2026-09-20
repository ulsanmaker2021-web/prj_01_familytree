export type MasterServiceTier = 'basic' | 'standard' | 'premium';

export interface ServiceTierOption {
  tier: MasterServiceTier;
  title: string;
  price: number;
  priceText: string;
  durationText: string;
  badge: string;
  description: string;
  features: string[];
}

export interface GenealogyMaster {
  id: string;
  name: string;
  hanja?: string;
  clanName: string;
  surname: string;
  organization: string;
  roleTitle: string;
  experienceYears: number;
  email: string;
  phone: string;
  photoUrl?: string;
  intro: string;
  verifiedCount: number;
  isAvailable: boolean;
  rating: number;
  specialties: string[];
}

export type MasterRequestStatus =
  | 'submitted'
  | 'reviewing'
  | 'document_verifying'
  | 'approved'
  | 'rejected';

export type PaymentMethod = 'card' | 'easy_pay' | 'vbank';

export interface MasterVerificationRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberClan: string;
  memberGender: 'M' | 'F';
  memberBirthDate?: string;
  parentInfo?: string;
  grandParentInfo?: string;
  nonHangnyeolReason: 'hangul_pure' | 'religious' | 'modern_custom' | 'other';
  reasonDetail?: string;

  masterId: string;
  masterName: string;
  masterOrganization: string;
  masterEmail: string;

  serviceTier: MasterServiceTier;
  serviceFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  paidAt?: string;

  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  requestMemo: string;
  attachedDocsSummary?: string[];

  status: MasterRequestStatus;
  submittedAt: string;
  updatedAt: string;
  completedAt?: string;

  masterReviewNote?: string;
  confirmedClanGen?: number;
  confirmedDescendantOrder?: number;
  issuedCertificateNo?: string;
}

export type Intention = 'friendship' | 'relationship' | 'outings' | 'communities';

export interface Profile {
  id: string;
  display_name: string;
  date_of_birth: string | null;
  avatar_path: string | null;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  intentions: Intention[];
  onboarding_completed: boolean;
  adult_attested: boolean;
  adult_attested_at: string | null;
  adult_attestation_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name: string;
  date_of_birth?: string;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  intentions: Intention[];
  adult_attested?: boolean;
  onboarding_completed: boolean;
}

export interface SignUpDetails {
  displayName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  adultAttested: boolean;
}

export type SocialProvider = 'google' | 'facebook';

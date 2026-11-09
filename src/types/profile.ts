export type Intention = 'friendship' | 'relationship' | 'outings' | 'communities';

export interface Profile {
  id: string;
  display_name: string;
  date_of_birth: string;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  intentions: Intention[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  display_name: string;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  intentions: Intention[];
  onboarding_completed: boolean;
}

export interface SignUpDetails {
  displayName: string;
  dateOfBirth: string;
  email: string;
  password: string;
}

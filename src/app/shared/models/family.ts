export interface FamilyMember {
  id?: number;
  name: string;
  username: string;
  email: string;
  whatsappNumber?: string;
  familyID?: string;
  familyName?: string;
}

export interface familyDetails {
  id: number;
  familyId: string;
  familyName: string;
  token?: string;
  familyMembers?: FamilyMember[];
  // Optionally present when logged in as a member
  username?: string;
  name?: string;
  email?: string;
}

export interface FamilyRegistrationPayload {
  familyName: string;
  members: FamilyMember[];
}

// A Union Type combining the possible data inputs for a generic modal
export type ModalDataType = familyDetails | FamilyRegistrationPayload | FamilyMember;
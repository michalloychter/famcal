export interface FamilyMember {
  id?: number;
  name: string;
  username: string;
  email: string;
  whatsappNumber?: string;
  familyID?: string;
  familyName?: string;
  color?: string; // HEX color for member
  isParent?: boolean; // Whether this member is a parent with admin privileges
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
  isParent?: boolean; // Whether the logged-in user is a parent
}

export interface FamilyRegistrationPayload {
  familyName: string;
  members: FamilyMember[];
}

// A Union Type combining the possible data inputs for a generic modal
export type ModalDataType = familyDetails | FamilyRegistrationPayload | FamilyMember;
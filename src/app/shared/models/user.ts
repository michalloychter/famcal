export interface FamilyMember {
  id: number;
  memberName: string;
  userID: string;
}

export interface UserDetails {
  id: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string; 
  familyMembers?: FamilyMember[]; 
}

export interface UserRegistrationPayload {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  members: string; 
}

// A Union Type combining the possible data inputs for a generic modal
export type ModalDataType = UserDetails | UserRegistrationPayload | FamilyMember;
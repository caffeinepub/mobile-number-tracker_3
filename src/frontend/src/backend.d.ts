import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ContactInput {
    id?: ContactId;
    name: string;
    mobileNumber: string;
    notes: string;
    category: string;
    tracked: boolean;
}
export type ContactId = bigint;
export type Time = bigint;
export interface Contact {
    id: ContactId;
    name: string;
    createdAt: Time;
    mobileNumber: string;
    updatedAt: Time;
    notes: string;
    category: string;
    tracked: boolean;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCallerContact(contactId: ContactId): Promise<void>;
    deleteCallerContacts(contactIds: Array<ContactId>): Promise<void>;
    getCallerContact(contactId: ContactId): Promise<Contact>;
    getCallerContactIds(): Promise<Array<ContactId>>;
    getCallerContacts(): Promise<Array<Contact>>;
    getCallerContactsByCategory(category: string): Promise<Array<Contact>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactsOfUser(user: Principal): Promise<Array<Contact>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    manageUserContact(contactInput: ContactInput): Promise<ContactId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleTrackContact(contactId: ContactId): Promise<void>;
}

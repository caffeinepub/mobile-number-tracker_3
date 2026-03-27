import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type ContactId = Nat;

  // Stored type (no `tracked` to preserve stable compatibility)
  type ContactStored = {
    id : ContactId;
    name : Text;
    mobileNumber : Text;
    category : Text;
    notes : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  // Returned type (includes computed `tracked` field)
  type Contact = {
    id : ContactId;
    name : Text;
    mobileNumber : Text;
    category : Text;
    notes : Text;
    tracked : Bool;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module Contact {
    public func compareByName(a : Contact, b : Contact) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  type ContactInput = {
    id : ?ContactId;
    name : Text;
    mobileNumber : Text;
    category : Text;
    notes : Text;
    tracked : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent state
  let contacts = Map.empty<Principal, Map.Map<ContactId, ContactStored>>();
  // Separate stable map for tracking status
  let trackedContacts = Map.empty<Principal, Map.Map<ContactId, Bool>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextContactId = 1;

  // Helper: merge stored contact with tracked status
  func withTracked(caller : Principal, c : ContactStored) : Contact {
    let isTracked = switch (trackedContacts.get(caller)) {
      case (null) { false };
      case (?m) {
        switch (m.get(c.id)) {
          case (null) { false };
          case (?v) { v };
        };
      };
    };
    {
      id = c.id;
      name = c.name;
      mobileNumber = c.mobileNumber;
      category = c.category;
      notes = c.notes;
      tracked = isTracked;
      createdAt = c.createdAt;
      updatedAt = c.updatedAt;
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Contact management
  public shared ({ caller }) func manageUserContact(contactInput : ContactInput) : async ContactId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage contacts");
    };

    if (not contacts.containsKey(caller)) {
      contacts.add(caller, Map.empty<ContactId, ContactStored>());
    };

    let contactId = getOrCreateContactId(contactInput.id);
    let stored : ContactStored = {
      id = contactId;
      name = contactInput.name;
      mobileNumber = contactInput.mobileNumber;
      category = contactInput.category;
      notes = contactInput.notes;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    let callerContacts = getCallerContactsInternal(caller);
    callerContacts.add(contactId, stored);

    // Store tracked status separately
    setTracked(caller, contactId, contactInput.tracked);
    contactId;
  };

  // Toggle tracked status
  public shared ({ caller }) func toggleTrackContact(contactId : ContactId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can track contacts");
    };
    // Ensure contact exists
    ignore getCallerContactInternal(caller, contactId);
    let current = switch (trackedContacts.get(caller)) {
      case (null) { false };
      case (?m) {
        switch (m.get(contactId)) {
          case (null) { false };
          case (?v) { v };
        };
      };
    };
    setTracked(caller, contactId, not current);
  };

  func setTracked(caller : Principal, contactId : ContactId, value : Bool) {
    if (not trackedContacts.containsKey(caller)) {
      trackedContacts.add(caller, Map.empty<ContactId, Bool>());
    };
    switch (trackedContacts.get(caller)) {
      case (null) {};
      case (?m) { m.add(contactId, value) };
    };
  };

  // Admin only
  public shared ({ caller }) func getContactsOfUser(user : Principal) : async [Contact] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users' contacts");
    };
    let userContacts = getUserContacts(user);
    userContacts.values().toArray().map(func(c) { withTracked(user, c) }).sort(Contact.compareByName);
  };

  // Users only
  public query ({ caller }) func getCallerContactIds() : async [ContactId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contact IDs");
    };
    getCallerContactsInternal(caller).keys().toArray();
  };

  public query ({ caller }) func getCallerContact(contactId : ContactId) : async Contact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    withTracked(caller, getCallerContactInternal(caller, contactId));
  };

  public query ({ caller }) func getCallerContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    getCallerContactsInternal(caller).values().toArray().map(func(c) { withTracked(caller, c) }).sort(Contact.compareByName);
  };

  public query ({ caller }) func getCallerContactsByCategory(category : Text) : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    getCallerContactsInternal(caller).values().toArray().filter(func(c) { c.category == category }).map(func(c) { withTracked(caller, c) }).sort(Contact.compareByName);
  };

  public shared ({ caller }) func deleteCallerContact(contactId : ContactId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete contacts");
    };
    if (not contacts.containsKey(caller)) {
      Runtime.trap("No contacts exist for this user");
    };
    getAndDeleteCallerContact(caller, contactId);
  };

  public shared ({ caller }) func deleteCallerContacts(contactIds : [ContactId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete contacts");
    };
    if (not contacts.containsKey(caller)) {
      Runtime.trap("No contacts exist for this user");
    };
    for ((i, id) in contactIds.enumerate()) {
      getAndDeleteCallerContact(caller, id);
    };
  };

  // Internal helper functions
  func getCallerContactsInternal(caller : Principal) : Map.Map<ContactId, ContactStored> {
    getUserContacts(caller);
  };

  func getUserContacts(user : Principal) : Map.Map<ContactId, ContactStored> {
    switch (contacts.get(user)) {
      case (null) { Map.empty<ContactId, ContactStored>() };
      case (?userContacts) { userContacts };
    };
  };

  func getOrCreateContactId(id : ?ContactId) : ContactId {
    switch (id) {
      case (null) {
        let id = nextContactId;
        nextContactId += 1;
        id;
      };
      case (?id) { id };
    };
  };

  func getCallerContactInternal(caller : Principal, contactId : ContactId) : ContactStored {
    let maybeContact = getCallerContactsInternal(caller).get(contactId);
    switch (maybeContact) {
      case (null) { Runtime.trap("Contact does not exist") };
      case (?c) { c };
    };
  };

  func getAndDeleteCallerContact(caller : Principal, contactId : ContactId) {
    ignore getCallerContactInternal(caller, contactId);
    getCallerContactsInternal(caller).remove(contactId);
  };
};

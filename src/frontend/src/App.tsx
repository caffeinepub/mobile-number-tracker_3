import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookUser,
  LogOut,
  MapPin,
  PhoneCall,
  Plus,
  Search,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Contact } from "./backend.d";
import ContactCard from "./components/ContactCard";
import ContactModal from "./components/ContactModal";
import DeleteConfirmDialog from "./components/DeleteConfirmDialog";
import LoginScreen from "./components/LoginScreen";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useDeleteContact,
  useGetCallerContacts,
  useGetCallerUserProfile,
} from "./hooks/useQueries";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "tracked", label: "Tracked" },
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

export default function App() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const { data: contacts = [], isLoading: contactsLoading } =
    useGetCallerContacts();
  const { mutateAsync: deleteContact, isPending: isDeleting } =
    useDeleteContact();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.mobileNumber.includes(q);
      const matchesCat =
        category === "all" ||
        (category === "tracked" ? c.tracked : c.category === category);
      return matchesSearch && matchesCat;
    });
  }, [contacts, search, category]);

  const trackedCount = useMemo(
    () => contacts.filter((c) => c.tracked).length,
    [contacts],
  );

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingContact(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
    } catch {
      // error handled by mutation
    }
  };

  if (!isAuthenticated && loginStatus !== "logging-in") {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-foreground text-lg leading-none">
              Mobile Tracker
            </h1>
            {trackedCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {trackedCount}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">
                  {userProfile.name}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8"
              data-ocid="header.button"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              onClick={openAdd}
              size="sm"
              className="gap-1.5 font-semibold"
              data-ocid="contact.primary_button"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="contact.search_input"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="w-full">
            {CATEGORIES.map((c) => (
              <TabsTrigger
                key={c.value}
                value={c.value}
                className="flex-1 text-xs sm:text-sm"
                data-ocid="contact.tab"
              >
                {c.value === "tracked" ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {c.label}
                  </span>
                ) : (
                  c.label
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Contact count */}
        {!contactsLoading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
            {category === "tracked"
              ? " being tracked"
              : category !== "all"
                ? ` in ${category}`
                : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
        )}

        {/* Loading */}
        {contactsLoading && (
          <div className="space-y-3" data-ocid="contact.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact List */}
        {!contactsLoading && (
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
                data-ocid="contact.empty_state"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  {category === "tracked" ? (
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <BookUser className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  {category === "tracked"
                    ? "No tracked numbers"
                    : search || category !== "all"
                      ? "No contacts found"
                      : "No contacts yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {category === "tracked"
                    ? "Tap the pin icon on any contact to start tracking."
                    : search || category !== "all"
                      ? "Try a different search or category."
                      : "Add your first contact to get started."}
                </p>
                {!search && category === "all" && (
                  <Button
                    onClick={openAdd}
                    data-ocid="contact.secondary_button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filtered.map((contact, i) => (
                  <ContactCard
                    key={contact.id.toString()}
                    contact={contact}
                    index={i}
                    onEdit={openEdit}
                    onDelete={(c) => setDeletingContact(c)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>

      {/* Profile Setup */}
      <ProfileSetupModal open={showProfileSetup} />

      {/* Contact Modal */}
      <ContactModal
        open={showModal}
        onClose={closeModal}
        contact={editingContact}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deletingContact}
        name={deletingContact?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeletingContact(null)}
        isPending={isDeleting}
      />
    </div>
  );
}

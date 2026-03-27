import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contact } from "../backend.d";
import { useManageContact } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
}

const EMPTY_FORM = {
  name: "",
  mobileNumber: "",
  category: "other",
  notes: "",
  tracked: false,
};

export default function ContactModal({ open, onClose, contact }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const { mutateAsync, isPending } = useManageContact();

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        mobileNumber: contact.mobileNumber,
        category: contact.category,
        notes: contact.notes,
        tracked: contact.tracked,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobileNumber.trim()) return;
    try {
      await mutateAsync({
        ...(contact ? { id: contact.id } : {}),
        name: form.name.trim(),
        mobileNumber: form.mobileNumber.trim(),
        category: form.category,
        notes: form.notes.trim(),
        tracked: form.tracked,
      });
      toast.success(contact ? "Contact updated!" : "Contact added!");
      onClose();
    } catch {
      toast.error("Failed to save contact");
    }
  };

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="contact.dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name *</Label>
            <Input
              id="contact-name"
              data-ocid="contact.input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-mobile">Mobile Number *</Label>
            <Input
              id="contact-mobile"
              data-ocid="contact.input"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger data-ocid="contact.select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              data-ocid="contact.textarea"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="contact.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !form.name.trim() || !form.mobileNumber.trim()
              }
              data-ocid="contact.submit_button"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

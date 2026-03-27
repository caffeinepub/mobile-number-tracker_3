import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Copy,
  Map as MapIcon,
  MapPin,
  MapPinOff,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Contact } from "../backend.d";
import { useToggleTrackContact } from "../hooks/useQueries";

const categoryConfig: Record<string, { label: string; className: string }> = {
  family: {
    label: "Family",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
  friend: {
    label: "Friend",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  work: {
    label: "Work",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  other: {
    label: "Other",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const avatarColors = [
  "bg-teal-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-emerald-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return avatarColors[hash % avatarColors.length];
}

interface Props {
  contact: Contact;
  index: number;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export default function ContactCard({
  contact,
  index,
  onEdit,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false);
  const { mutate: toggleTrack, isPending: isToggling } =
    useToggleTrackContact();
  const cat = categoryConfig[contact.category] ?? categoryConfig.other;
  const initials = contact.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const copyNumber = async () => {
    await navigator.clipboard.writeText(contact.mobileNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.mobileNumber)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card
        className={`hover:shadow-card transition-shadow duration-200 border-border ${contact.tracked ? "ring-2 ring-primary/30" : ""}`}
        data-ocid={`contact.item.${index + 1}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(contact.name)}`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-foreground truncate text-base">
                      {contact.name}
                    </h3>
                    {contact.tracked && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0"
                      >
                        Tracked
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80 font-mono">
                      {contact.mobileNumber}
                    </span>
                    <button
                      type="button"
                      onClick={copyNumber}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                      aria-label="Copy number"
                      data-ocid={`contact.toggle.${index + 1}`}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${cat.className}`}
                  >
                    {cat.label}
                  </Badge>
                  <div className="flex gap-1">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Search on Google Maps"
                      data-ocid={`contact.maps_button.${index + 1}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${contact.tracked ? "text-primary hover:bg-primary/10" : "hover:bg-accent"}`}
                      onClick={() => toggleTrack(contact.id)}
                      disabled={isToggling}
                      title={
                        contact.tracked ? "Stop tracking" : "Track this number"
                      }
                      data-ocid={`contact.track_button.${index + 1}`}
                    >
                      {contact.tracked ? (
                        <MapPin className="w-3.5 h-3.5 fill-primary" />
                      ) : (
                        <MapPinOff className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-accent"
                      onClick={() => onEdit(contact)}
                      data-ocid={`contact.edit_button.${index + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(contact)}
                      data-ocid={`contact.delete_button.${index + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

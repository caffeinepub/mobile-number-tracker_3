import { Button } from "@/components/ui/button";
import { PhoneCall, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PhoneCall className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-3">
          Mobile Number Tracker
        </h1>
        <p className="text-muted-foreground mb-10 text-base">
          Securely store and manage all your contacts in one place.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Shield, label: "Secure" },
            { icon: Users, label: "Organized" },
            { icon: PhoneCall, label: "Accessible" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          size="lg"
          className="w-full text-base font-semibold h-12"
        >
          {isLoggingIn ? "Connecting..." : "Sign In to Continue"}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Powered by Internet Identity — no passwords needed.
        </p>
      </motion.div>
    </div>
  );
}

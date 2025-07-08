import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserIcon } from "lucide-react";

export default function SignInPrompt({
  title = "Sign in to continue",
  description = "Please sign in to your account to access this feature",
  icon = <UserIcon className="h-6 w-6 text-accent" />,
  buttonText = "Sign In",
  onSignInClick,
}) {
  return (
    <Card className="border-2 border-border bg-card shadow-lg">
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="p-4 rounded-full bg-accent/10 border border-accent/20">
            {icon}
          </div>
          <div className="max-w-sm space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <Button
            onClick={onSignInClick}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-2.5 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

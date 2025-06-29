import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserIcon } from "lucide-react";

export default function SignInPrompt({
  title = "Sign in to continue",
  description = "Please sign in to your account to access this feature",
  icon = <UserIcon className="h-6 w-6 text-muted-foreground" />,
  buttonText = "Sign In",
  onSignInClick,
}) {
  return (
    <Card className="border-border bg-card backdrop-blur-sm shadow-sm">
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">{icon}</div>
          <div className="max-w-sm">
            <h3 className="text-lg font-medium mb-2 text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {description}
            </p>
          </div>
          <Button
            onClick={onSignInClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            size="lg"
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, AlertCircle, CheckCircle, MapPin, Loader2, Eye, EyeOff, Info } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = (): string | null => {
    if (!fullName.trim()) return "Full name is required";
    if (fullName.trim().length < 2) return "Full name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const getPasswordStrength = (): { strength: string; color: string; width: string } => {
    if (!password) return { strength: "", color: "", width: "0%" };
    if (password.length < 6) return { strength: "Too short", color: "bg-destructive", width: "20%" };
    if (password.length < 8) return { strength: "Weak", color: "bg-warning", width: "40%" };
    if (password.length < 12 && /[A-Za-z]/.test(password) && /\d/.test(password)) {
      return { strength: "Good", color: "bg-primary", width: "70%" };
    }
    if (/[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { strength: "Strong", color: "bg-success", width: "100%" };
    }
    return { strength: "Fair", color: "bg-warning", width: "50%" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-secondary/30">
        {/* Simple Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground leading-tight">SMC Road Watch</h1>
                <p className="text-xs text-muted-foreground">Solapur Municipal Corporation</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md mx-4 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                <p className="text-muted-foreground">
                  We've sent a verification link to{" "}
                  <strong className="text-foreground">{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to verify your account, then you can sign in.
                </p>
                <div className="pt-4 space-y-2">
                  <Button onClick={() => navigate("/login")} className="w-full">
                    Go to Login
                  </Button>
                  <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">
                    ← Back to home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="py-4 border-t border-border bg-card">
          <div className="container text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Solapur Municipal Corporation. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground leading-tight">SMC Road Watch</h1>
              <p className="text-xs text-muted-foreground">Solapur Municipal Corporation</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Staff Registration</CardTitle>
            <CardDescription>
              Create an account to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{passwordStrength.strength}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`h-11 ${confirmPassword && password !== confirmPassword ? "border-destructive" : ""}`}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-muted-foreground">
                  After registration, an admin will need to assign you a role before you can access the staff dashboard.
                </p>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Back to home
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 border-t border-border bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Solapur Municipal Corporation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Signup;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type FormErrors = {
  email?: string;
  password?: string;
  otp?: string;
};

type LoginMode = "password" | "otp-send" | "otp-verify";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mode, setMode] = useState<LoginMode>("password");
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email")) {
        setErrors({ email: error.message });
      } else if (error.message.toLowerCase().includes("password")) {
        setErrors({ password: error.message });
      } else {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      navigate("/");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrors({ email: "Please enter your email address" });
      return;
    }
    setOtpSending(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        // If user doesn't exist
        if (error.message.toLowerCase().includes("user") || error.message.toLowerCase().includes("not found") || error.message.toLowerCase().includes("signup")) {
          toast({
            title: "No account found",
            description: "This email isn't registered. Please create an account first.",
            variant: "destructive",
          });
          setErrors({ email: "No account found with this email. Please sign up." });
        } else {
          throw error;
        }
        return;
      }

      setMode("otp-verify");
      setOtp("");
      toast({ title: "Code sent!", description: "Check your email for the 6-digit login code." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit code" });
      return;
    }

    setOtpVerifying(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      setErrors({ otp: error.message || "Invalid verification code" });
      toast({ title: "Verification failed", description: error.message || "Invalid code", variant: "destructive" });
    } finally {
      setOtpVerifying(false);
    }
  };

  // OTP Verify step
  if (mode === "otp-verify") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (value.length === 6) {
                  setTimeout(() => handleVerifyOtp(value), 100);
                }
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {errors.otp && (
            <p className="text-xs text-destructive text-center">{errors.otp}</p>
          )}

          {otpVerifying && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Didn't receive the code?</p>
            <Button variant="link" onClick={handleSendOtp} disabled={otpSending} className="text-sm p-0 h-auto">
              {otpSending ? "Sending..." : "Resend code"}
            </Button>
          </div>

          <button
            onClick={() => { setMode("otp-send"); setOtp(""); }}
            className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  // OTP Send step (enter email)
  if (mode === "otp-send") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">Login with code</h3>
          <p className="text-sm text-muted-foreground">Enter your registered email and we'll send you a login code</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-email" className="text-sm font-medium text-foreground">Email address</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-11 rounded-xl ${errors.email ? "border-destructive" : ""}`}
              required
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <Button
            onClick={handleSendOtp}
            className="w-full h-11 rounded-xl text-sm font-semibold"
            disabled={otpSending}
          >
            {otpSending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending code...</>
            ) : (
              "Send Login Code"
            )}
          </Button>

          <button
            onClick={() => setMode("password")}
            className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to password login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Button first */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Login with Code button */}
      <button
        type="button"
        onClick={() => setMode("otp-send")}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Mail className="h-5 w-5 text-primary" />
        Login with Code
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">or continue with email</span>
        </div>
      </div>

      {/* Email form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-11 rounded-xl ${errors.email ? "border-destructive" : ""}`}
            required
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-11 rounded-xl pr-10 ${errors.password ? "border-destructive" : ""}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl text-sm font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Switch to signup */}
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchToSignup?.()}
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
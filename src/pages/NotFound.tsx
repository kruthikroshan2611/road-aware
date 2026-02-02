import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Home, ArrowLeft, Search, FileText } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-3 group">
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404 Graphic */}
          <div className="relative mb-8">
            <div className="text-[150px] font-bold text-primary/10 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Page Not Found
          </h1>
          
          <p className="text-muted-foreground mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <p className="text-sm text-muted-foreground mb-8">
            Requested: <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{location.pathname}</code>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Looking for something?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/report" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <FileText className="h-4 w-4" />
                Report Damage
              </Link>
              <Link to="/track" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Search className="h-4 w-4" />
                Track Complaint
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <MapPin className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 border-t border-border bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Solapur Municipal Corporation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;

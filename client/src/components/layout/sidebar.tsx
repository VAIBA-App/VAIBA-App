import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  UserPlus,
  LayoutDashboard,
  Users,
  PhoneCall,
  PlayCircle,
  PhoneOutgoing,
  Search,
  List,
  PanelLeftClose,
  PanelLeft,
  Mic,
  Settings,
  Languages,
  Moon,
  CreditCard,
  Shield,
  HelpCircle,
  User,
  Mail,
  Calendar,
  CircleDollarSign,
  Share2,
  ChevronDown,
  Phone,
  Sparkles,
  Award,
  BadgeInfo,
  LogOut,
  Building2,
  Briefcase,
  Calculator,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Image } from "@/components/ui/image";

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t } = useTranslation();
  const { logoutMutation } = useAuth();

  const toggleExpand = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ... rest of the component remains the same ...

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card",
        isCollapsed ? "w-10" : "w-44"
      )}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <Link href="/" className={cn(
          "transition-opacity duration-200 flex items-center",
          isCollapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          <Image
            src="/api/assets/logo"
            alt="VAIBA Logo"
            width={48}
            height={48}
            className={cn(
              "h-8 w-auto",
              isCollapsed ? "w-0" : "w-auto"
            )}
            onError={(e) => {
              console.error('Error loading logo:', e);
              //No change needed here. The Image component handles errors better than the img tag.
            }}
          />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 w-8 h-8 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ... rest of the component remains the same ... */}
    </aside>
  );
}

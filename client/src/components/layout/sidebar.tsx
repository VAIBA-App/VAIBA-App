import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
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
  LogOut,
  Building2, // Icon für Firma
  Briefcase, // Icon für Portfolio
  Calculator, // Icon für Preisgestaltung
  TrendingUp, // Icon für Umsatz
  Receipt, // Icon für Rechnungen
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

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

  const navItems = [
    {
      title: t("dashboard"),
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Firma",
      href: "/company",
      icon: Building2,
      subItems: [
        {
          title: "Portfolio",
          href: "/company/portfolio",
          icon: Briefcase,
        },
        {
          title: "Preisgestaltung",
          href: "/company/pricing",
          icon: Calculator,
        },
        {
          title: "Umsatz",
          href: "/company/revenue",
          icon: TrendingUp,
        },
        {
          title: "Rechnungen & Zahlungen",
          href: "/company/invoices",
          icon: Receipt,
        },
      ],
    },
    {
      title: t("clients"),
      href: "/customer-list",
      icon: Users,
      subItems: [
        {
          title: t("customerSearch"),
          href: "/customer-search",
          icon: Search,
        },
        {
          title: t("customerList"),
          href: "/customer-list",
          icon: List,
        },
      ],
    },
    {
      title: t("telephone"),
      href: "/calls",
      icon: Phone,
      subItems: [
        {
          title: t("soloCalls"),
          href: "/calls",
          icon: PhoneCall,
        },
        {
          title: t("autoCalls"),
          href: "/auto-calls",
          icon: PhoneOutgoing,
        },
      ],
    },
    {
      title: t("marketing"),
      href: "/marketing/email",
      icon: CircleDollarSign,
      subItems: [
        {
          title: t("email"),
          href: "/marketing/email",
          icon: Mail,
        },
        {
          title: t("calendar"),
          href: "/marketing/calendar",
          icon: Calendar,
        },
        {
          title: t("socialMedia"),
          href: "/marketing/social",
          icon: Share2,
        }
      ],
    },
    {
      title: t("assistant"),
      href: "/assistant",
      icon: User,
    },
    {
      title: t("voice"),
      href: "/voice/ivc",
      icon: Mic,
      subItems: [
        {
          title: "Inst. Voice Cloning",
          href: "/voice/ivc",
          icon: Sparkles,
        },
        {
          title: "Pro. Voice Cloning",
          href: "/voice/pvc",
          icon: Award,
        }
      ],
    },
    {
      title: t("simulator"),
      href: "/simulator",
      icon: PlayCircle,
    },
  ];

  const settingsItems = [
    {
      title: t("language"),
      href: "/settings/language",
      icon: Languages,
    },
    {
      title: t("theme"),
      href: "/settings/theme",
      icon: Moon,
    },
    {
      title: t("profile"),
      href: "/settings/profile",
      icon: User,
    },
    {
      title: t("subscription"),
      href: "/settings/subscription",
      icon: CreditCard,
    },
    {
      title: t("privacy"),
      href: "/settings/privacy",
      icon: Shield,
    },
    {
      title: t("help"),
      href: "/settings/help",
      icon: HelpCircle,
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card",
        isCollapsed ? "w-10" : "w-44"
      )}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <div className={cn(
          "text-lg font-semibold transition-opacity duration-200",
          isCollapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          VAIBA Sales
        </div>
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

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.subItems ? (
              <>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full flex items-center",
                    location === item.href && "bg-secondary"
                  )}
                  onClick={() => !isCollapsed && toggleExpand(item.href)}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-grow text-left">{item.title}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        expandedItems.includes(item.href) && "rotate-180"
                      )} />
                    </>
                  )}
                </Button>
                {!isCollapsed && expandedItems.includes(item.href) && (
                  <div className="mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant={location === subItem.href ? "secondary" : "ghost"}
                          className="w-full justify-start pl-6"
                        >
                          <subItem.icon className="h-4 w-4 mr-2" />
                          {subItem.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location === item.href && "bg-secondary"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        <div className={cn(
          "text-sm font-medium text-muted-foreground mb-2",
          isCollapsed && "hidden"
        )}>
          {t("settings")}
        </div>
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location === item.href && "bg-secondary"
                )}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            </Link>
          ))}

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>{t("logout")}</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
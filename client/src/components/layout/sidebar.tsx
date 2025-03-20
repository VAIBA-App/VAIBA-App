import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { logoutMutation } = useAuth();

useEffect(() => {
    const fetchLogo = async () => {
      try {
        console.log('Fetching logo...');
        const response = await fetch('/api/assets/logo-base64');

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        if (!data || typeof data.data !== 'string') {
          console.error('Invalid logo data:', data);
          throw new Error('Invalid logo data received');
        }

        console.log('Received logo data:', {
          length: data.data.length,
          preview: data.data.substring(0, 50) + '...'
        });

        setLogoData(data.data);
        setLogoError(null);
      } catch (error) {
        console.error('Error loading logo:', error);
        setLogoError(error instanceof Error ? error.message : 'Failed to load logo');
        setLogoData(null);
      }
    };

    fetchLogo();
  }, []);

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
          title: "Informationen",
          href: "/company/information",
          icon: BadgeInfo,
        },
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
          title: "Rechnungen",
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
          title: "Anrufliste",
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
      icon: UserPlus,
    },
    {
      title: t("voice"),
      href: "/voice/ivc",
      icon: Mic,
      subItems: [
        {
          title: "Instant Cloning",
          href: "/voice/ivc",
          icon: Sparkles,
        },
        {
          title: "Pro Cloning",
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
        <div className="flex-shrink-0">
          {logoError ? (
            <div className="h-8 w-8 bg-red-100 flex items-center justify-center rounded">
              <span className="text-xs text-red-500">!</span>
            </div>
          ) : logoData ? (
            <img
              src={`data:image/png;base64,${logoData}`}
              alt="VAIBA Logo"
              width={32}
              height={32}
              className={cn(
                "h-8",
                isCollapsed ? "w-0" : "w-auto"
              )}
              onError={(e) => {
                console.error('Logo rendering error:', e);
                const img = e.target as HTMLImageElement;
                console.log('Failed src length:', img.src.length);
                console.log('Failed src preview:', img.src.substring(0, 100));
                setLogoError('Failed to render logo');
              }}
            />
          ) : (
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          )}
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
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  children?: NavItem[];
  icon?: string;
}

export const MAIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: "◎" },
  { id: "agenzie", label: "Agenzie", href: "/agenzie", icon: "◫" },
  { id: "fields", label: "Fields", href: "/fields", icon: "≡" },
  { id: "quality", label: "Quality", href: "/quality", icon: "⚠" },
  { id: "competenze", label: "Competenze", href: "/competenze", icon: "◇" },
  { id: "listing", label: "Listing", href: "/listing", icon: "▦" },
  { id: "pricelist", label: "Pricelist", href: "/pricelist", icon: "€" },
  { id: "radar", label: "Radar", href: "/radar", icon: "◉" },
  { id: "agents", label: "Agents", href: "/agents", icon: "◈" },
  { id: "network", label: "Network", href: "/network", icon: "◐" },
  { id: "seo", label: "SEO", href: "/seo", icon: "↗" },
  {
    id: "crm",
    label: "CRM",
    href: "/crm",
    icon: "✉",
    children: [
      { id: "crm-dashboard", label: "Dashboard", href: "/crm" },
      { id: "crm-contacts", label: "Contatti", href: "/crm/contacts" },
      { id: "crm-deals", label: "Deals", href: "/crm/deals" },
      { id: "crm-campaigns", label: "Campagne", href: "/crm/campaigns" },
    ],
  },
  { id: "content", label: "Content", href: "/content", icon: "☰" },
];

export const FOOTER_NAV: NavItem[] = [
  { id: "settings", label: "Settings", href: "/settings", icon: "⚙" },
];

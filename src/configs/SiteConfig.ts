const name = "Osu!Feniks";

export const SiteConfig = {
    // Identity
    name,
    lang: "en",
    locale: "en_US",

    // Navigation
    nav: [
        { href: "/", label: "Home" },
        { href: "/faq", label: "FAQ" },
        // add extra links here
    ],

    // Meta
    defaultTitle: `${name} - Farmable osu! Beatmaps by Skill Bracket`, // when page passes no title
    titleTemplate: `%s | ${name}`,
    description:
        "Discover and compare osu! beatmaps ranked by players results from every skill bracket. Browse detailed difficulty stats, star ratings, mods, PP, and performance metrics for every mapset.",

    // Social previews
    ogImage: "/og-default-v1.png",
    twitterCard: "summary_large_image",
} as const;
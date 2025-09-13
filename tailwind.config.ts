import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Design system color tokens
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        muted: "hsl(var(--muted))",
        text: "hsl(var(--text))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        "accent-strong": "hsl(var(--accent-strong))",
        danger: "hsl(var(--danger))",
        
        // Sidebar specific
        "sidebar-bg": "hsl(var(--sidebar-bg))",
        "sidebar-hover": "hsl(var(--sidebar-hover))",
        "sidebar-selected": "hsl(var(--sidebar-selected))",
        
        // Legacy shadcn compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "muted-foreground": "hsl(var(--muted-foreground))",
        "accent-foreground": "hsl(var(--accent-foreground))",
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.2' }],
        'sm': ['13px', { lineHeight: '1.4' }],
        'base': ['14px', { lineHeight: '1.4' }],
        'md': ['15px', { lineHeight: '1.4' }],
        'lg': ['18px', { lineHeight: '1.2' }],
        'xl': ['20px', { lineHeight: '1.2' }],
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'pill': '9999px',
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        'card': '0 6px 18px hsl(var(--shadow) / 0.08)',
        'modal': '0 20px 40px hsl(var(--shadow) / 0.6)',
      },
      transitionDuration: {
        'fast': '120ms',
        'normal': '200ms',
        'slow': '320ms',
      },
      transitionTimingFunction: {
        'pop': 'cubic-bezier(0.2, 1, 0.35, 1)',
        'smooth': 'cubic-bezier(0.22, 0.94, 0.36, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "message-in": {
          '0%': {
            opacity: '0',
            transform: 'translateY(6px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "hover-translate": {
          "0%": {
            transform: "translateX(0px)",
          },
          "100%": {
            transform: "translateX(6px)",
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "message-in": "message-in 200ms cubic-bezier(0.22, 0.94, 0.36, 1)",
        "fade-in": "fade-in 120ms cubic-bezier(0.22, 0.94, 0.36, 1)",
        "scale-in": "scale-in 200ms cubic-bezier(0.2, 1, 0.35, 1)",
        "hover-translate": "hover-translate 120ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

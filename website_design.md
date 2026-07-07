<user_request>Build a premium, modern landing page and authentication page for VerdeIQ, the AI-powered sustainability dashboard for SMEs.

Creative Direction:

Do not use a logo or any avatar graphic.

Brand identity is delivered only by the project name "VerdeIQ" in a sophisticated, original typeface.

Avoid all stock/common UI features: No default icons, no generic buttons, and no standard cards or open-source icon packs.

All navigation, CTAs, cards, benefit sections, info panels, and illustrations must be custom-designed for this project, with a distinctive, unicorn-grade feel.

Visual style: Beautiful, minimal, modern, and premium—think luxury SaaS with clean lines, soft gradients, subtle glassmorphism/neumorphism effects, and distinctive microinteractions/animations.

Landing Page Structure:

Hero: Large project name, striking headline ("Empowering SMEs to Lead on Sustainability"), custom CTA ("Get Started with VerdeIQ").

Three custom-designed benefit sections using original iconography (not open source) and unique content layouts.

"How it Works" section with creative step-by-step illustrations (no common icons or stock images).

Placeholder for testimonials ("Trusted by SMEs worldwide").

Authentication Page:

Minimal and luxurious UX: Centered custom card (not standard), creative input fields, original states/animations.

Prominent, beautiful "VerdeIQ" name—no logo, no avatars at all.

Options for email sign-up/login, Google OAuth, and demo access.

General Design:

Fully responsive, dark/light mode support.

High accessibility (WCAG-friendly).

No default/emoji/avatar/stock iconography anywhere in the UI.

Use Material UI/Chakra UI only for utility classes and accessibility, not for design elements.

Output:

Organize as Next.js or React functional components with clean separation for landing and auth.

Include placeholder copy for all headlines and benefit sections that can easily be edited.</user_request>

<todo_list>
1. Create custom global styles with premium color palette, sophisticated typography, gradient definitions, and glassmorphism utilities in globals.css
2. Build landing page at src/app/page.tsx with hero section, three custom benefit sections with SVG illustrations, "How it Works" section, and testimonials placeholder
3. Create authentication page at src/app/auth/page.tsx with centered luxury card, custom input fields with animations, and Google OAuth/demo options
4. Implement dark/light mode toggle component with smooth transitions and theme persistence
5. Add custom animated UI components (buttons, cards, input fields) with microinteractions and premium effects to components directory
</todo_list>
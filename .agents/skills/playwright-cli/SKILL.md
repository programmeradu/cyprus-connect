---
name: playwright-cli
description: Run end-to-end browser tests, take UI snapshots, and interact with the web app via Microsoft Playwright CLI or MCP. Use when asked to test pages, verify visual layout across viewports (1440/768/390), or automate browser actions.
---

# Playwright CLI & Browser Testing

Automate browser verification, responsive testing, and UI validation using `@playwright/test` or `playwright-cli`.

## Key Commands & Capabilities

1. **Responsive Viewport Testing**:
   - Desktop (1440px / 1280px)
   - Tablet (768px)
   - Mobile (390px)

2. **Visual Snapshots & Assertions**:
   - Verify layout stability, modal alignment, focus indicators, and absence of horizontal overflow.
   - Run tests against local server `http://localhost:3000` or production staging.

3. **Playwright MCP Integration**:
   - Can run as an MCP server via `npx -y @playwright/mcp@latest` providing browser navigation, clicking, typing, taking screenshots, and inspecting accessibility snapshots.

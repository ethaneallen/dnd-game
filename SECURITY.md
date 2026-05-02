# Security Policy

## Reporting a Vulnerability

This is a client-side, browser-only project with no server, no accounts, and no
remote data collection. The realistic security surface is limited to:

- Cross-site scripting (XSS) via crafted save-game data pasted into the app
- Local-storage tampering
- Supply-chain risk from the Google Fonts CDN

If you believe you have found a security vulnerability, **please do not open a
public issue**. Instead, report it privately:

- Open a GitHub Security Advisory on this repository (Security → Advisories →
  "Report a vulnerability"), **or**
- Contact the maintainer privately through the contact channel listed in the
  repository's profile.

Please include:

1. A clear description of the issue
2. Steps to reproduce, including any crafted input or save data
3. The browser and version where you observed the behavior
4. Your assessment of impact (e.g., "executes arbitrary JS", "leaks
   localStorage", etc.)

We aim to acknowledge reports within a reasonable time. Because this is a
volunteer fan project, we cannot guarantee specific response times or bug
bounties.

## Scope

**In scope:**

- The HTML, JavaScript, and CSS files in this repository
- Save/load handling and any user-supplied input parsing
- Any future hosted demo deployed by the project maintainers

**Out of scope:**

- Vulnerabilities in third-party dependencies (Google Fonts) — please report
  those upstream
- Forks, mirrors, and unofficial deployments hosted by other parties
- Issues that require physical access to the user's device or pre-existing
  malware on the user's machine
- Social-engineering attacks against project maintainers

## Disclosure

We follow coordinated disclosure. Please give us a reasonable window to
investigate and ship a fix before public disclosure.

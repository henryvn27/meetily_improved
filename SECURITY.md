# Security policy

Meetily Improved handles sensitive local meeting data. Please do not open a public issue for a vulnerability that could expose recordings, transcripts, credentials, local files, or arbitrary command execution.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version or commit, operating system, impact, reproduction steps, and a minimal proof of concept.

Do not include real meeting content, API keys, credentials, or another person's data. Use synthetic text only when a reproduction requires content.

You should receive an acknowledgment within seven days. Please allow time for a fix and coordinated disclosure before publishing details.

## Supported versions

Until the first stable release, security fixes target the latest commit on `main`. After public releases begin, this file will list the supported release lines.

## Scope

Reports are especially useful for:

- unintended access to recordings, transcripts, summaries, recovery data, or settings;
- leakage of provider credentials or local filesystem paths;
- unsafe Tauri command boundaries or arbitrary file access;
- update, signing, packaging, or dependency-chain vulnerabilities;
- remote endpoints being used when a feature promises loopback-only or local-only behavior.

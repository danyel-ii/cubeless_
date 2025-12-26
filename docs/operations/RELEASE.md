# Release Process

## Versioning
- Use Semantic Versioning: MAJOR.MINOR.PATCH

## Pre-release checklist
1. Ensure CI passes (forge tests, solhint, slither, coverage gate).
2. Update `CHANGELOG.md` with release notes.
3. Verify `docs/security/security_audit.md` is current.
4. Verify deployment artifacts and contract addresses.

## Release steps
1. Tag the commit: `git tag vX.Y.Z`.
2. Push the tag: `git push origin vX.Y.Z`.
3. Deploy the Next.js app to Vercel.
4. Publish release notes in GitHub Releases.

## Release artifacts
- Contracts ABI and deployment metadata
- Changelog entry
- Security audit snapshot

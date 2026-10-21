# Turn On Site Planning

## Goal
Turn on the `site-planning` feature for this project by adding it to the project's migration settings.

## Status
**Ready to run.** Nothing has been changed yet. Planning mode is still on, so I can't edit files. Switch to Execute mode and I'll make the change right away.

## Current State
The migration settings file has one site entry (`trying-ema-auto`) and no `features` list yet:

```json
{
  "sites": {
    "trying-ema-auto": {
      "previewOrg": "sheetal-hablani-adobe",
      "previewSite": "trying-ema-auto",
      "contentHostUrl": "https://content.da.live/sheetal-hablani-adobe/trying-ema-auto/"
    }
  }
}
```

## Proposed Change
Add a top-level `features` list next to `sites`. Everything that's already there stays as it is:

```json
{
  "sites": {
    "trying-ema-auto": {
      "previewOrg": "sheetal-hablani-adobe",
      "previewSite": "trying-ema-auto",
      "contentHostUrl": "https://content.da.live/sheetal-hablani-adobe/trying-ema-auto/"
    }
  },
  "features": [ "site-planning" ]
}
```

## Scope & Impact
- **What changes:** only the local project settings file. No page content, block code or styles change.
- **What doesn't change:** nothing goes to Document Authoring, EDS preview or the live site, and nothing is committed or pushed to git.

## Checklist
- [ ] Add `"features": [ "site-planning" ]` at the top level of the migration project settings, keeping the existing `sites` entry the same
- [ ] Check that the file is still valid JSON
- [ ] Read the file again to confirm `site-planning` is listed in `features` and `sites` didn't change
- [ ] Tell the user that only the local workspace changed (no DA, preview or live changes, and no git commit)

## Notes
- **To make the change:** switch to Execute mode and send any message. I'll make the edit and check it.
- Some optional plugins (Commerce, Figma, Forms, Project Management) are available but not turned on. You don't need them for this change. I can turn any of them on if you want.

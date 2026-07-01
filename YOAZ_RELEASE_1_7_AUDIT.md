# YOAZ Release 1.7 — audit + fixes

## Audit
- The strongest visual direction is the current cream / black / gold hero. The structure should no longer be redesigned.
- Remaining blockers were technical: mid-width breakpoint between desktop and mobile, partial language changes, hardcoded shop/gallery labels, and unstable gallery grids.
- The language switch updated navigation but not every static element, especially hero microcopy, social label, shop/product labels and section titles.
- The desktop-to-tablet range could compress buttons/socials and crop the horse illustration.

## Changes applied
- Added a final i18n guard for FR/EN/NL/ES across hero, CTAs, social label, sections and shop labels.
- Preserved selected language in localStorage and reapplied translations after load/resize to resist older scripts.
- Stabilized the 901–1220px breakpoint: hero remains two-column, buttons do not collapse, socials wrap safely, horse no longer becomes a broken oversized block.
- Stabilized mobile: dedicated mobile hero stays active below 900px; artwork is dezoomed and the copy card remains readable.
- Stabilized personal/client galleries into predictable grids.

## Do not redesign next
Future work should be deployment QA only: open all pages, click all links, test language persistence, Lighthouse, and real domain setup.

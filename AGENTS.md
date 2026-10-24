<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All calls to the external Python parsing/matching API go through `src/lib/api.ts` (currently mocked) so real endpoints can be swapped in one place.
- Talent Check scoring lives in `src/lib/talent.ts` with tests in `src/lib/talent.test.ts`; keep the formula there, not in components.
- Cross-page flow state (selected JD, parsed resume, saved profile, results) lives in the React context in `src/lib/app-state.tsx`.
- Database tables use open demo RLS policies (no sign-in yet); tighten them when authentication is added.

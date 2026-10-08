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

- Mount AuthProvider and AdStatusProvider once in the root; all consumers share one session listener and cached profile query to keep billing reads independent of listing reads.
- Compute trial status in the shared provider and schedule only countdown-boundary updates; mount TrialWarning once to avoid duplicate notification requests across page banners.
- Use the shared plan-dialog scroll surface for both account plans and the expired-trial gate so mobile touch scrolling has one viewport-constrained owner.

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

- Keep homepage-specific editorial layout and image scrims scoped with `home-` classes in the shared stylesheet so other public and admin pages retain their layout.
- Resolve homepage social-image URLs from the server request origin and a CDN asset pointer; this keeps previews absolute without hardcoding a deployment domain.

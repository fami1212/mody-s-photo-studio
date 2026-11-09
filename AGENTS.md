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
- Resolve social-image URLs from the server request origin; use a CDN pointer for the default homepage image and stable public-media endpoints for admin-selected images, avoiding hardcoded deployment domains.
- Store only resized marketing copies in site_appearance and shooting_seo; serve selected images through a public endpoint that allow-lists marketing paths while keeping the storage bucket private.
- Generate share-sized images in the browser during admin photo selection or publication, because the server runtime cannot use native image processors.

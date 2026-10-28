# Header bar

The bar at the top of a theme page on ohtuleht.ee: 100% wide, 46 px high, a colour or a picture, with a label. It is uploaded to `b.ohtuleht.ee` and shown on the site in an iframe.

Live example: `https://b.ohtuleht.ee/html5/Ohtuleht/paised_uus/vallatud_joulud/`. Older hand-made version: `category/rubriik-4dimensioon`.

## Make one

In the generator: Content marketing, **Make this banner** on **Header bar** (or **Choose zip file** to edit one made before).

| Field | Meaning |
|---|---|
| Text on the bar | Shown in capital letters |
| Where the bar leads | Theme page. Opens in a new tab. Plain link, no ad ClickTag (it is a page, not an ad) |
| Bar colour | Fills the bar |
| Text colour | Automatic (a tint of the bar's colour, or of the picture's average colour, dark or light for contrast). Can be set by hand |
| Background picture | Optional. Shown at the left, `cover`. The bar colour shows behind it. Use a picture without text |

The preview shows the bar at 1248, 768 and 375 px wide.

## Files in the zip

| File | Content |
|---|---|
| `index.html` | `<a class="banner">` with `<span class="banner__label">`; fonts load without blocking; config embedded (`#ol-header`) so the zip can be re-opened |
| `style.css` | CSS variables (`--banner-background`, `--banner-text-color`, `--banner-background-image`...), same as the live file |
| `bg.<ext>` | The picture, when used |

Behaviour: 16 px side padding, Fira Sans Condensed 700 16 px uppercase, 6 px rounded corners at every width, page behind the bar `#f4f4f4` (`#0f0f0f` in dark mode). The live bar rounds its corners only from 1023 px wide; this tool rounds them everywhere.

## Put it on the site

1. Download the zip.
2. Upload the folder to `b.ohtuleht.ee/html5/...` (IT/ad operations).
3. Paste the folder address into the tool.
4. Copy the generated code and give it to whoever edits the page:

```html
<iframe src="https://b.ohtuleht.ee/html5/.../" width="100%" height="46px" frameborder="0" marginheight="0" marginwidth="0"></iframe>
```

The host sends `frame-ancestors` for `*.ohtuleht.ee` and a few partners, so the iframe only works on those sites.

## Open items

- Header font and size options (issue #64) would apply here too.
- Light/dark page colour behind the rounded corners is fixed to the live values.

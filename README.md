# FARMTEK09 CENTRE

FARMTEK09 CENTRE's customer storefront and catalogue admin panel.

## Website

The static website is published with GitHub Pages from the `main` branch.

- Customer storefront: https://farmtek09centre.github.io/FARMTEK09-CENTRE-STORE/
- Admin panel: https://farmtek09centre.github.io/FARMTEK09-CENTRE-STORE/admin.html

To activate the first deployment, open **Settings → Pages** in this repository and set **Build and deployment → Source** to **GitHub Actions**. The workflow in `.github/workflows/deploy-pages.yml` then publishes the site. Every push to `main` triggers a new deployment.

The deployment includes the static storefront, catalogue JSON, store settings, admin scripts, logo/assets and uploaded product images. It does not publish the Node API source as part of the Pages site.

## Updating products and store details

1. Open the admin panel.
2. Connect using a GitHub fine-grained personal access token with **Contents: Read and write** permission for this repository.
3. Edit products or store settings and save. The admin panel writes the updated files to GitHub; the Pages workflow publishes the changes.

Keep the token private. Do not paste it into source files or commit it to the repository. Avoid saving it on shared devices.

## Hosting and checkout limitations

GitHub Pages hosts static HTML, CSS, JavaScript, JSON and image files. It does not run Node.js servers or provide a private database.

The current customer page reads its product catalogue, settings and discount codes from repository files. Its checkout tools generate customer-side order details, offer WhatsApp ordering, and provide browser-based receipt printing/downloads.

The separate `server.js` file is a Node API with `/api/health` and `/api/checkout` endpoints and optional KRA eTIMS submission. It is **not** part of the GitHub Pages deployment and will not run on GitHub Pages. Any future integration that requires server-side invoice numbering, KRA eTIMS registration, or a shared order database will need a separate backend service.

## Repository layout

- `index.html` — customer storefront
- `styles.css` — storefront styles
- `admin.html` and `admin/` — catalogue administration
- `catalog/products.json` — product catalogue
- `catalog/discounts.json` — discount codes
- `store-settings.json` — public store settings
- `assets/` and `images/` — site and product images
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment
- `server.js` — separate Node API (not hosted by Pages)

# go-no-go
App designed to identify if a product belongs to a company.

## Deploying to GitHub Pages

1. Build the production bundle and prepare the `404.html` file:

   ```bash
   npm run predeploy
   ```

2. Publish the contents of the `dist/` directory to the `gh-pages` branch:

   ```bash
   npm run deploy
   ```

   The `deploy` script uses the [`gh-pages`](https://www.npmjs.com/package/gh-pages) CLI to push the built files. Ensure that the repository has a configured `origin` remote with push access before running the command.

3. In GitHub, open **Settings → Pages** and choose **Deploy from a branch**, then select the `gh-pages` branch and the `/` (root) directory.

4. After GitHub Pages finishes processing the deployment, visit <https://lrosouza.github.io/go-no-go/> to confirm that the site loads correctly.

> **Note:** The automation environment used for testing cannot push to GitHub, so `npm run deploy` stops after preparing the build when no `origin` remote is available.

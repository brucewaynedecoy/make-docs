# Releasing Make Docs

The publishable package is `@brucewaynedecoy/make-docs` in `packages/cli`. GitHub Release publication starts `.github/workflows/publish-npm.yml`. The workflow stages only this package. An npm maintainer must approve it before it becomes public.

The earlier `1.0.0-rc.1` npm release remains under Apache-2.0. New releases use the MIT license in `packages/cli/LICENSE`.

## One-time setup

1. Merge the release workflow into `main` and confirm the **PR merge gate** check is required on `main`.
2. Sign in to npmjs.com with an account that can manage `@brucewaynedecoy/make-docs`.
3. Open the package's **Settings → Trusted publishing** page. Add a **GitHub Actions** publisher with these exact values:
   - Organization or user: `brucewaynedecoy`
   - Repository: `make-docs`
   - Workflow filename: `publish-npm.yml`
   - Environment name: leave empty
   - Allowed actions: leave direct `npm publish` unchecked; `npm stage publish` is allowed
4. Save the setting. Check the values again. npm does not test this link when it saves it.

The workflow uses a GitHub-hosted runner, Node 24, npm 11.17.0, and a short-lived npm identity. It does not need an npm token in GitHub Secrets. npm also creates a provenance record for this public package.

## Each release

1. Update `packages/cli/package.json` to a new version. Update `package-lock.json` with it. Use a version that is absent from npm.
2. Review the package, license, docs, release notes, and open GitHub security alerts in a pull request. Resolve or assess high-severity findings before release. Wait for the **PR merge gate** and follow the current review rule. The repository owner can use the rule's pull-request-only review bypass. Merge the pull request to `main`.
3. Create a draft GitHub Release for tag `v<package-version>`. Point the tag at the reviewed commit on `main`. Mark a version with a hyphen, such as `2.0.3-rc.1`, as a prerelease.
4. Review the draft tag, target commit, notes, and package version. Publish the GitHub Release. Future published releases are immutable.
5. Watch the **Publish npm package** workflow. It stages the inspected package on npm. A stable version is staged with the `latest` tag. A prerelease is staged with `next`.
6. On npmjs.com, open **Staged Packages**. Review the staged version. To inspect the tarball, run `npm stage download <stage-id>`. Approve the stage with two-factor authentication to make it public. If the package is wrong, reject the stage. Do not report the npm release as complete while approval is pending.
7. Check the new version and dist tag with `npm view @brucewaynedecoy/make-docs versions dist-tags --json`. Check the npm package page for the provenance link to the GitHub workflow.

The workflow stops if the tag is not on `main`, the tag and package versions differ, the GitHub prerelease choice disagrees with the version, or the version already exists on npm. It builds and tests before it stages the inspected tarball. npm publishes that tarball only after a maintainer approves it. If a staged package is rejected, the published GitHub Release still exists. Use a new version and tag for a corrected release.

## After the first trusted publish works

On npmjs.com, open the package's **Settings → Publishing access** page. Select **Require two-factor authentication and disallow tokens**. Save the setting. Remove any old automation token that is no longer needed. Trusted staging and approval keep working with this setting.

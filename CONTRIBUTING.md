# Contributing to Sleepy Owl Theme

> Hi, and thanks for your interest in contributing to Sleepy Owl Theme!

This is an open source project, and there are several ways to contribute. The purpose of this document is to assist you in discovering how you might wish to participate in this project.

**- Topics**

-   [Feedback](#feedback)
    -   [Identify Where to Report](#identify-where-to-report)
    -   [Look For an Existing Issue](#look-for-an-existing-issue)
    -   [Writing Good Issue](#writing-good-issue)
-   [Theme Development](#theme-development)
    -   [Usage and Tips](#usage-and-tips)
    -   [Tweak Color Lightness](#tweak-color-lightness)
    -   [Tweak Color Opacity](#tweak-color-opacity)
    -   [Testing](#testing)

## Feedback

> Your suggestions and feedback are appreciated!

Have you discovered a flaw in one of our themes design? Do you have a request for a new theme alternative? We'd like to know about it! Here's how to submit your issue as quickly as possible.

### Identify Where to Report

Make sure the problem isn't with VS Code or its extensions, but with the **Sleep Owl theme**. You can try different themes to address this. The VS Code built-in themes `Dark` or `Dark+` might be used as a reference.

If you discover that the problem is caused by an extension you've installed, please report it to the extension's repository.

### Look For an Existing Issue

Please search open issues before creating a new issue to determine whether the issue or enhancement request has already been made.

Be sure to scan through the most popular requests.

If you see that your problem has already been addressed, leave pertinent comments and add your reaction. Use a reaction instead of additional comments:

-   👍 - upvote
-   👎 - downvote

If you can't find an existing issue that describes your problem or request, create a new one following the steps outlined below.

### Writing Good Issue

Before starting here's a few important points:

-   Create a new issue for each problem and theme request. Multiple bugs or suggestions should not be listed in the same issue.
-   The more detail you can offer, the more likely it is that someone will be able to reproduce the problem and discover a solution.

Please include the following information with each issue:

-   What you expected to see in comparison to what you actually saw.
-   Images, animations, or a link to a video demonstrating the problem.
-   Steps to reproduce the problem (When reporting one).
-   VSCode version (When reporting problems).
-   A code sample demonstrating the issue (When reporting about syntax highlighting).

## Theme Development

> **Sleepy Owl** theme design should bring professional and smooth contrast, as well as less vibrant colors.

Do you want to develop an theme alternative? with a different background accent color that you like? or bring support to another language? No problem, it's an simple and straigthfoward process as explained bellow:

1. Clone and open this [repo](https://github.com/santosned/vsc-sleepy-owl-theme) in VS Code.
2. Run `npm install` to install all dependencies.
3. Open `package.json` and select the theme you want as the `target-for-dev`. In the code bellow the theme `Sleepy Owl - Default` is the first objet inside `themes: [...]` making it the default theme target for development:

    ```jsonc
    "contributes": {
        "themes": [
            {
    			"label": "Sleepy Owl - Default",
    			"uiTheme": "vs-dark",
    			"path": "./themes/sleepy-owl-default-color-theme.json"
    		},
            // Other themes metadata...
        ]
    },
    ```

4. Press `F5` to start theme development. It should open a new VS Code window with the theme marked as `target-for-dev`, and it will automatically run `npm run build` to generate the latest `*-color-theme.json`.
5. Update the target theme `.yml` file inside `themes/schemas/` with the changes you want.
6. Reload the Window to rebuild the theme.

That's it, if you did everything right, now you should be able to work in the theme.

### Usage and Tips:

To update your theme you can run:

```sh
npm run build
```

or if you **don't** want to reload the window or run a command **every** time you make a change in the theme .yml file, run:

```sh
npm run start
```

When developing themes only set new colors at the base color palette in the top of your theme .yml file, or use !cast to tweak an existent color.

### Tweak Color Lightness

If you want to use different color lightness based in an specific color, you can use !cast:

```yaml
!cast &activeColor { color: 'rgb(121, 160, 232)', light: -20 }
```

The `light: -20` will decrease 20 decimal values from `rgb(121, 160, 232)` resulting in `rgb(101, 140, 212)` which will be generated in the `*-color-theme.json` file as a hexrgb color `#658CD4`.

### Tweak Color Opacity

If you want to change the opacity of an specific color, you can also use !cast:

```yaml
!cast &activeColor { color: 'rgb(121, 160, 232)', light: -20, alpha: 90 }
```

The `alpha: 90` will override the opacity of `rgb(121, 160, 232)` to 90% resulting in `rgb(121, 160, 232, 0.9)` which will be generate in the `*-color-theme.json` file as a hexrgb color `#658CD4E5`.

### Testing

> Notice: To make sure the themes follows an standard and mitigate possible common mistakes testing the themes is a must as mentioned bellow.

After finishing the development of an theme and identify possible mistakes, the test script was created to verify if the name of the theme matches, if its values and tokens are valid, and more.

To test, run the following script:

```sh
npm test
```

### Build Extension

After finishing updating the theme and debugging it you can package the theme and do the final test.

```sh
npm run package
```

This will generate a `sleepy-owl.vsix` file inside `themes/release` which you can right-click on it while in VS Code and then click in install to test your changes before releasing it.

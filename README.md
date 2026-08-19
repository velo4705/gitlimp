<div align="center">

<img src="assets/logo.png" alt="GitLiMP" width="150" height="150">

# GitLiMP

Live Markdown preview that matches GitHub — no pushes, no setup, one binary.

![LICENSE](https://img.shields.io/github/license/velo4705/gitlimp?color=yellow)
![Latest Release](https://img.shields.io/github/v/release/velo4705/gitlimp?label=Latest%20Release&color=success)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS%20%7C%20Flatpak-informational)

<a href="https://www.producthunt.com/products/gitlimp?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-gitlimp" target="_blank" rel="noopener noreferrer"><img alt="GitLiMP - Preview Markdown exactly as GitHub renders it | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1224706&amp;theme=dark&amp;t=1787123156067"></a>

**[🌐 Try GitLiMP in Browser](https://velo4705.github.io/gitlimp/)**

<img src="assets/screenshot-main.png" alt="GitLiMP Main Preview" width="800">

</div>

---

## How to Use it?

**Simple.** Just open a **Markdown file** from any project you're working on. GitLiMP tracks changes in real-time as you edit and save. It even has a Split View feature that lets you compare two documents **side-by-side**.

This software is solely made to **preview markdown files live** while editing in your preferred editor, while applying **GitHub-rich rendering** to provide what you see on GitHub without having to keep pushing changes to GitHub just because of the Markdown file.

The **Recent Files** feature allows you to quickly switch between recently opened files... and can be **cleared** if its cluttered.

**GitLiMP** is ideal for the following things: **Markdown-only repositories** where the main purpose is on Curations/Lists, and **Styling the README** to further provide info about the project, without "pushing" a lot of commits just to Preview the README on GitHub.

### Key Features

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="assets/screenshot-split.png" alt="Split View" width="380"><br><b>Split View</b></td>
      <td align="center"><img src="assets/screenshot-dark.png" alt="Dark Mode Rendering" width="380"><br><b>Dark Mode Rendering</b></td>
    </tr>
  </table>
</div>

## Keybinds

| Action | Key |
|-----|--------|
| Open Files | `Ctrl+O` |
| Toggle Split View | `Ctrl+\` |


## Installation

### Currently Available Platforms
- **Windows** [Portable .EXE or installer]
- **macOS** [Portable .app bundle]
- **Linux** [Portable Binary or .DEB/RPM installer]
- **AppImage**
- **Flatpak**

You can get the Binaries from the [GitHub Releases](https://github.com/velo4705/gitlimp/releases) page.

### Windows Installation Issues

> [!IMPORTANT]
> Some third-party antivirus software (e.g., McAfee, Norton) may flag GitLiMP as "unknown" because the binaries aren't code-signed. This is a **false positive** — the source is open as well as downloadable from the Main page, or the [Releases](https://github.com/velo4705/gitlimp/releases) page. Windows Defender does not flag it. If your AV/SmartScreen warns, allow the app through or run it via "More info → Run anyway".

### AppImage Installation Issues

> [!NOTE]
> AppImages require FUSE. Install it with:
> ```
> sudo apt install fuse libfuse2          # Debian/Ubuntu
> sudo dnf install fuse fuse-libs         # Fedora/RHEL
> ```
> If you can't install FUSE, extract and run instead:
> ```
> ./gitlimp-1.0.0-x86_64.AppImage --appimage-extract
> cd squashfs-root && ./AppRun
> ```

### Flatpak Installation

> [!NOTE]
> Flathub support is not added yet, so installing this Flatpak package requires this command:
> ```bash
> flatpak install gitlimp-X.X.X-x86_64.flatpak  # Where X.X.X is version name.
> ```

## Contributing

Check out the [contributing guide](CONTRIBUTING.md) to learn how to contribute to GitLiMP.
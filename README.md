<div align="center">

<img src="assets/logo.png" alt="GitLiMP" width="150" height="150">

# GitLiMP

*An ordinary **Git**Hub **Li**ve **M**arkown **P**reviewer.*

Preview Markdown files live without having to constantly push commits to GitHub.

Currently Available for Windows, Linux (DEB/RPM/AppImage), macOS, and Flatpak.

![Latest Release](https://img.shields.io/github/v/release/velo4705/gitlimp?label=Latest%20Release&color=informational)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS%20%7C%20Flatpak-informational)

**[→ Try GitLiMP in Browser ←](https://velo4705.github.io/gitlimp/)** &nbsp;

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

### AppImage Installation Issues

Download the latest AppImage from the [GitHub Releases](https://github.com/velo4705/gitlimp/releases) page.

> **Note:** AppImages require FUSE. Install it with:
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

Download the latest Flatpak package from the [GitHub Releases](https://github.com/velo4705/gitlimp/releases) page.

> **Note:** Installing a Flatpak package requires this command:
> ```bash
> flatpak install gitlimp-X.X.X-x86_64.flatpak  # Where X.X.X is version name.
> ```

## Contributing

Check out the [contributing guide](CONTRIBUTING.md) to learn how to contribute to GitLiMP.
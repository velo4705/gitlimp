Name:           gitlimp
Version:        0.1.0
Release:        1%{?dist}
Summary:        Live Markdown Previewer

License:        MIT
URL:            https://github.com/velo4705/gitlimp
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  libgtk-3-devel
BuildRequires:  webkit2gtk4.1-devel
BuildRequires:  pkgconfig
BuildRequires:  golang
BuildRequires:  nodejs

Requires:       webkit2gtk4.1
Requires:       gtk3

%description
Preview markdown files live with GitHub-rich rendering, without
having to push changes to GitHub.

%prep
%setup -q

%build
cd frontend && npm install && cd ..
wails build -trimpath -ldflags "-s -w"

%install
install -d %{buildroot}%{_bindir}
install -m 755 build/bin/gitlimp %{buildroot}%{_bindir}/gitlimp

%files
%{_bindir}/gitlimp

%changelog
* Fri Aug 15 2026 velo4705 <velocity4293@gmail.com> - 0.1.0-1
- Initial release

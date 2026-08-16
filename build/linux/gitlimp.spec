Name:           gitlimp
Version:        1.0.0
Release:        1%{?dist}
Summary:        Live Markdown Previewer

%define debug_package %{nil}

License:        MIT
URL:            https://github.com/velo4705/gitlimp
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  gtk3-devel
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
echo "{\"version\":\"%{version}\"}" > version.json
cd frontend && npm install && cd ..
wails build -trimpath -ldflags "-s -w" -tags webkit2_41

%install
install -d %{buildroot}%{_bindir}
install -m 755 build/bin/gitlimp %{buildroot}%{_bindir}/gitlimp

%files
%{_bindir}/gitlimp

%changelog
* Sat Aug 15 2026 velo4705 <velocity4293@gmail.com> - 1.0.0-1
- Initial release

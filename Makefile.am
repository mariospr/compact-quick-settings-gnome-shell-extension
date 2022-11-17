EXT_NAME = Compact Quick Settings
EXT_ID = $(PACKAGE_NAME)
EXT_VERSION = $(PACKAGE_VERSION)
EXT_URL = https://github.com/mariospr/compact-quick-settings-gnome-shell-extension
EXT_UUID = $(EXT_ID)@gnome-shell-extensions.mariospr.org

topextensiondir = $(datadir)/gnome-shell/extensions
extensiondir = $(topextensiondir)/$(EXT_UUID)

dist_extension_DATA = extension.js
nodist_extension_DATA = metadata.json

metadata.json: metadata.json.in Makefile
	@sed \
	  -e "s|@NAME@|$(EXT_NAME)|" \
	  -e "s|@UUID@|$(EXT_UUID)|" \
	  -e "s|[@]VERSION@|$(EXT_VERSION)|" \
	  -e "s|@URL@|$(EXT_URL)|" \
	  -e "s|[@]GETTEXT_DOMAIN@|$(GETTEXT_PACKAGE)|" \
	< $< > $@

zip-file: all
	-rm -fR $(builddir)/_build
	$(MKDIR_P) $(builddir)/_build; \
	$(MAKE) install DESTDIR="$(abs_builddir)/_build"; \
	mv "$(builddir)/_build$(topextensiondir)/$(EXT_UUID)" "$(builddir)/_build/"; \
	cp -r "$(builddir)/_build$(datadir)/locale" "$(builddir)/_build/$(EXT_UUID)"; \
	(cd "$(builddir)/_build/$(EXT_UUID)"; \
		zip -qr "$(abs_builddir)/$(EXT_UUID).shell-extension.zip" .; \
	);
	-rm -fR $(builddir)/_build

localprefix = $(HOME)/.local/share/gnome-shell/extensions

local-install: zip-file
	zip_file="$(abs_builddir)/$(EXT_UUID).shell-extension.zip"; \
	if [ -d "$(localprefix)/$(EXT_UUID)" ]; then \
		rm -fR "$(localprefix)/$(EXT_UUID)"; \
	fi; \
	$(MKDIR_P) $(localprefix)/$(EXT_UUID); \
	(cd $(localprefix)/$(EXT_UUID); \
		unzip -q $${zip_file}; \
	);

EXTRA_DIST = \
	metadata.json.in \
	$(NULL)

CLEANFILES = \
	metadata.json \
	$(NULL)

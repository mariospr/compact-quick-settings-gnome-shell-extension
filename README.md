# Compact Quick Settings extension for GNOME Shell

Simple extension that reduces the width of the new quick settings popup menu
introduced in GNOME 43, by using only one column instead of two.

This is how the popup menu from the top panel currently looks:

![Screenshot](/screenshot.png)

### How to install

Clone the repository:

    $ git clone git://github.com/mariospr/compact-quick-settings-gnome-shell-extension compact-quick-settings
    $ cd compact-quick-settings

And type the following to install it under /usr (or any other prefix):

    $ ./autogen.sh --prefix=/usr
    $ make install

If all you want is install it under your `$HOME` directory, you can simply do this:

    $ ./autogen.sh
    $ make local-install

Once installed, the extension can be enabled using the `gnome-shell-extension-prefs`
command or the GNOME Tweak Tool application.

### Contributing

Contributions are welcome via any way, although the preferred method is via GitHub,
by forking the repository and using Pull Requests to integrate your changes.

### License

This extension is released under the terms of the MIT/X11 license.

See the `LICENSE` file for more details.

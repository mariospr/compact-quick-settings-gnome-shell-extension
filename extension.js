// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
//
// Copyright (C) 2022 Mario Sanchez Prada
//
// Author: Mario Sanchez Prada <mario@mariospr.org>
//
// Implementation of this extension is (heavily) based on the code from GNOME
// Shell 43, which is distributed under the terms of the GNU General Public
// License, version 2 or later. See https://wiki.gnome.org/Projects/GnomeShell.
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of version 2 of the GNU General Public
// License as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, see <http://www.gnu.org/licenses/>

const { GObject, Shell, St } = imports.gi;
const { QuickSettingsItem, QuickSettingsMenu } = imports.ui.quickSettings;
const Config = imports.misc.config;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const SoundSettingsItem = GObject.registerClass(
class SoundSettingsItem extends QuickSettingsItem {
    _init() {
        super._init({
            style_class: 'icon-button',
            can_focus: true,
            icon_name: 'org.gnome.Settings-sound-symbolic',
            visible: !Main.sessionMode.isGreeter,
        });

        this.connect('clicked', () => {
            const app = Shell.AppSystem.get_default().lookup_app('gnome-sound-panel.desktop');
            Main.overview.hide();
            Main.panel.closeQuickSettings();
            app.activate();
        });
    }
});

const UnsafeModeIndicator = GObject.registerClass(
class UnsafeModeIndicator extends imports.ui.quickSettings.SystemIndicator {
    _init() {
        super._init();
        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'channel-insecure-symbolic';
        global.context.bind_property('unsafe-mode',
            this._indicator, 'visible',
            GObject.BindingFlags.SYNC_CREATE);
    }
});

var CompactQuickSettings = GObject.registerClass(
class CompactQuickSettings extends PanelMenu.Button {
    _init() {
        super._init(0.0, C_('System menu in the top bar', 'System'), true);

        this._indicators = new St.BoxLayout({
            style_class: 'panel-status-indicators-box',
        });
        this.add_child(this._indicators);

        this.setMenu(new QuickSettingsMenu(this));

        if (Config.HAVE_NETWORKMANAGER)
            this._network = new imports.ui.status.network.Indicator();
        else
            this._network = null;

        if (Config.HAVE_BLUETOOTH)
            this._bluetooth = new imports.ui.status.bluetooth.Indicator();
        else
            this._bluetooth = null;

        this._system = new imports.ui.status.system.Indicator();

        // Replace the Screenshot item with a direct access to Sound settings.
        this._system._systemItem.child.replace_child(
            this._system._systemItem.child.get_child_at_index(2),
            new SoundSettingsItem());

        this._volume = new imports.ui.status.volume.Indicator();
        this._brightness = new imports.ui.status.brightness.Indicator();
        this._remoteAccess = new imports.ui.status.remoteAccess.RemoteAccessApplet();
        this._location = new imports.ui.status.location.Indicator();
        this._thunderbolt = new imports.ui.status.thunderbolt.Indicator();
        this._nightLight = new imports.ui.status.nightLight.Indicator();
        this._darkMode = new imports.ui.status.darkMode.Indicator();
        this._powerProfiles = new imports.ui.status.powerProfiles.Indicator();
        this._rfkill = new imports.ui.status.rfkill.Indicator();
        this._autoRotate = new imports.ui.status.autoRotate.Indicator();
        this._unsafeMode = new UnsafeModeIndicator();

        this._indicators.add_child(this._brightness);
        this._indicators.add_child(this._remoteAccess);
        this._indicators.add_child(this._thunderbolt);
        this._indicators.add_child(this._location);
        this._indicators.add_child(this._nightLight);
        if (this._network)
            this._indicators.add_child(this._network);
        this._indicators.add_child(this._darkMode);
        this._indicators.add_child(this._powerProfiles);
        if (this._bluetooth)
            this._indicators.add_child(this._bluetooth);
        this._indicators.add_child(this._rfkill);
        this._indicators.add_child(this._autoRotate);
        this._indicators.add_child(this._volume);
        this._indicators.add_child(this._unsafeMode);
        this._indicators.add_child(this._system);

        this._addItems(this._system.quickSettingsItems);
        this._addItems(this._volume.quickSettingsItems);
        this._addItems(this._brightness.quickSettingsItems);

        this._addItems(this._remoteAccess.quickSettingsItems);
        this._addItems(this._thunderbolt.quickSettingsItems);
        this._addItems(this._location.quickSettingsItems);
        if (this._network)
            this._addItems(this._network.quickSettingsItems);
        if (this._bluetooth)
            this._addItems(this._bluetooth.quickSettingsItems);
        this._addItems(this._powerProfiles.quickSettingsItems);
        this._addItems(this._nightLight.quickSettingsItems);
        this._addItems(this._darkMode.quickSettingsItems);
        this._addItems(this._rfkill.quickSettingsItems);
        this._addItems(this._autoRotate.quickSettingsItems);
        this._addItems(this._unsafeMode.quickSettingsItems);
    }

    _addItems(items, colSpan = 1) {
        items.forEach(item => this.menu.addItem(item, colSpan));
    }
});

let originalQuickSettings = null;

function init() {
}

function enable() {
    // Save and hide the original QuickSettings before replacing it.
    originalQuickSettings = Main.panel.statusArea.quickSettings;
    originalQuickSettings.container.hide();

    // Replace it with the QuickSettings with our compact version.
    Main.panel.statusArea.quickSettings = null;
    Main.panel.addToStatusArea('quickSettings',
                               new CompactQuickSettings(),
                               Main.panel.find_child_by_name("panelRight").get_children().length);
}

function disable() {
    // Destroy our custom QuickSettings menu.
    Main.panel.statusArea.quickSettings.destroy()

    // Finally, show and restore the original one.
    originalQuickSettings.container.show();
    Main.panel.statusArea.quickSettings = originalQuickSettings;
    originalQuickSettings = null;
}

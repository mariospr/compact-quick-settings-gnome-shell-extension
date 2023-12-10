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

import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import {QuickSettingsItem, QuickSettingsMenu, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import * as RemoteAccessStatus from 'resource:///org/gnome/shell/ui/status/remoteAccess.js';
import * as PowerProfileStatus from 'resource:///org/gnome/shell/ui/status/powerProfiles.js';
import * as RFKillStatus from 'resource:///org/gnome/shell/ui/status/rfkill.js';
import * as CameraStatus from 'resource:///org/gnome/shell/ui/status/camera.js';
import * as VolumeStatus from 'resource:///org/gnome/shell/ui/status/volume.js';
import * as BrightnessStatus from 'resource:///org/gnome/shell/ui/status/brightness.js';
import * as SystemStatus from 'resource:///org/gnome/shell/ui/status/system.js';
import * as LocationStatus from 'resource:///org/gnome/shell/ui/status/location.js';
import * as NightLightStatus from 'resource:///org/gnome/shell/ui/status/nightLight.js';
import * as DarkModeStatus from 'resource:///org/gnome/shell/ui/status/darkMode.js';
import * as BacklightStatus from 'resource:///org/gnome/shell/ui/status/backlight.js';
import * as ThunderboltStatus from 'resource:///org/gnome/shell/ui/status/thunderbolt.js';
import * as AutoRotateStatus from 'resource:///org/gnome/shell/ui/status/autoRotate.js';
import * as BackgroundAppsStatus from 'resource:///org/gnome/shell/ui/status/backgroundApps.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

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
class UnsafeModeIndicator extends SystemIndicator {
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
    constructor() {
        super(0.0, C_('System menu in the top bar', 'System'), true);

        this._indicators = new St.BoxLayout({
            style_class: 'panel-status-indicators-box',
        });
        this.add_child(this._indicators);

        this.setMenu(new QuickSettingsMenu(this));
        this._setupIndicators().catch(error =>
            logError(error, 'Failed to setup quick settings'));
    }

    async _setupIndicators() {
        if (Config.HAVE_NETWORKMANAGER) {
            const NetworkStatus = await import('resource:///org/gnome/shell/ui/status/network.js');
            this._network = new NetworkStatus.Indicator();
        } else {
            this._network = null;
        }

        if (Config.HAVE_BLUETOOTH) {
            const BluetoothStatus = await import('resource:///org/gnome/shell/ui/status/bluetooth.js');
            this._bluetooth = new BluetoothStatus.Indicator();
        } else {
            this._bluetooth = null;
        }

        this._system = new SystemStatus.Indicator();

        // Replace the Screenshot item with a direct access to Sound settings.
        this._system._systemItem.child.replace_child(
            this._system._systemItem.child.get_child_at_index(2),
            new SoundSettingsItem());

        this._camera = new CameraStatus.Indicator();
        this._volumeOutput = new VolumeStatus.OutputIndicator();
        this._volumeInput = new VolumeStatus.InputIndicator();
        this._brightness = new BrightnessStatus.Indicator();
        this._remoteAccess = new RemoteAccessStatus.RemoteAccessApplet();
        this._location = new LocationStatus.Indicator();
        this._thunderbolt = new ThunderboltStatus.Indicator();
        this._nightLight = new NightLightStatus.Indicator();
        this._darkMode = new DarkModeStatus.Indicator();
        this._backlight = new BacklightStatus.Indicator();
        this._powerProfiles = new PowerProfileStatus.Indicator();
        this._rfkill = new RFKillStatus.Indicator();
        this._autoRotate = new AutoRotateStatus.Indicator();
        this._unsafeMode = new UnsafeModeIndicator();
        this._backgroundApps = new BackgroundAppsStatus.Indicator();

        // add privacy-related indicators before any external indicators
        let pos = 0;
        this._indicators.insert_child_at_index(this._remoteAccess, pos++);
        this._indicators.insert_child_at_index(this._camera, pos++);
        this._indicators.insert_child_at_index(this._volumeInput, pos++);
        this._indicators.insert_child_at_index(this._location, pos++);

        // append all other indicators
        this._indicators.add_child(this._brightness);
        this._indicators.add_child(this._thunderbolt);
        this._indicators.add_child(this._nightLight);
        if (this._network)
            this._indicators.add_child(this._network);
        this._indicators.add_child(this._darkMode);
        this._indicators.add_child(this._backlight);
        this._indicators.add_child(this._powerProfiles);
        if (this._bluetooth)
            this._indicators.add_child(this._bluetooth);
        this._indicators.add_child(this._rfkill);
        this._indicators.add_child(this._autoRotate);
        this._indicators.add_child(this._volumeOutput);
        this._indicators.add_child(this._unsafeMode);
        this._indicators.add_child(this._system);

        // add our quick settings items before any external ones
        const sibling = this.menu.getFirstItem();
        this._addItemsBefore(this._system.quickSettingsItems, sibling);
        this._addItemsBefore(this._volumeOutput.quickSettingsItems, sibling);
        this._addItemsBefore(this._volumeInput.quickSettingsItems, sibling);
        this._addItemsBefore(this._brightness.quickSettingsItems, sibling);

        this._addItemsBefore(this._camera.quickSettingsItems, sibling);
        this._addItemsBefore(this._remoteAccess.quickSettingsItems, sibling);
        this._addItemsBefore(this._thunderbolt.quickSettingsItems, sibling);
        this._addItemsBefore(this._location.quickSettingsItems, sibling);
        if (this._network)
            this._addItemsBefore(this._network.quickSettingsItems, sibling);
        if (this._bluetooth)
            this._addItemsBefore(this._bluetooth.quickSettingsItems, sibling);
        this._addItemsBefore(this._powerProfiles.quickSettingsItems, sibling);
        this._addItemsBefore(this._nightLight.quickSettingsItems, sibling);
        this._addItemsBefore(this._darkMode.quickSettingsItems, sibling);
        this._addItemsBefore(this._backlight.quickSettingsItems, sibling);
        this._addItemsBefore(this._rfkill.quickSettingsItems, sibling);
        this._addItemsBefore(this._autoRotate.quickSettingsItems, sibling);
        this._addItemsBefore(this._unsafeMode.quickSettingsItems, sibling);

        // append background apps
        this._backgroundApps.quickSettingsItems.forEach(
            item => this.menu.addItem(item));
    }

    _addItemsBefore(items, sibling, colSpan = 1) {
        items.forEach(item => this.menu.insertItemBefore(item, sibling, colSpan));
    }
});

export default class CompactQuickSettingsExtension extends Extension {
    enable() {
        // Save and hide the original QuickSettings before replacing it.
        this.originalQuickSettings = Main.panel.statusArea.quickSettings;
        this.originalQuickSettings.container.hide();

        // Replace it with the QuickSettings with our compact version.
        Main.panel.statusArea.quickSettings = null;
        Main.panel.addToStatusArea('quickSettings',
                                new CompactQuickSettings(),
                                Main.panel.find_child_by_name("panelRight").get_children().length);
    }

    disable() {
        if (this.originalQuickSettings !== null) {
            // Destroy our custom QuickSettings menu.
            Main.panel.statusArea.quickSettings.destroy()

            // Finally, show and restore the original one.
            this.originalQuickSettings.container.show();
            Main.panel.statusArea.quickSettings = this.originalQuickSettings;
            this.originalQuickSettings = null;
        }
    }
}

// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const { GObject, St } = imports.gi;
const { QuickSettingsMenu, SystemIndicator } = imports.ui.quickSettings;
const Config = imports.misc.config;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

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

var QuickSettings = GObject.registerClass(
class QuickSettings extends PanelMenu.Button {
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

        this._indicators.add_child(this._system);
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

function init() {
}

function enable() {
    quickSettingsButton = new QuickSettings(Main.panel);;
    buttonPosition = Main.panel.find_child_by_name("panelRight").get_children().length;
    Main.panel.addToStatusArea('compactQuickSettings', quickSettingsButton, buttonPosition);
    Main.panel.statusArea['quickSettings'].container.hide()
}

function disable() {
    Main.panel.statusArea['quickSettings'].container.show()
    Main.panel.statusArea['compactQuickSettings'].container.destroy()
    Main.panel.statusArea['compactQuickSettings'] = null;
}

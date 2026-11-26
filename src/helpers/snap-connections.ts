import type { SnapConnections, SnapInterface } from 'src/types';

import { i18n } from 'boot/i18n';
import { copyToClipboard } from 'quasar';
import {
  getSnapConnectCommand,
  SNAP_MANUAL_INTERFACES,
} from 'src/constants/snap';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useAppSettingsStore } from 'stores/app-settings';

// What each interface lets M³ do, in the reminder, when it's the only one.
const INTERFACE_MESSAGE_KEYS: Record<SnapInterface, string> = {
  'password-manager-service': 'snap-connect-password-manager-service',
  'removable-media': 'snap-connect-removable-media',
};

// The interfaces already checked this session (and brought up if they
// weren't connected): once is enough.
const checkedThisSession = new Set<SnapInterface>();

/**
 * The interfaces worth checking: needed (password-manager-service only
 * matters when OBS Studio is on, since only its password is encrypted), not
 * turned down by the user, and not checked yet this session.
 */
const getInterfacesToCheck = (obsEnabled: boolean) => {
  const { snapConnectReminderDismissed } = useAppSettingsStore();
  return SNAP_MANUAL_INTERFACES.filter(
    (plug) =>
      (obsEnabled || plug !== 'password-manager-service') &&
      !snapConnectReminderDismissed[plug] &&
      !checkedThisSession.has(plug),
  );
};

/** The interfaces snapctl says aren't connected. */
const getUnconnected = (plugs: SnapInterface[], connections: SnapConnections) =>
  plugs.filter((plug) => connections[plug] === false);

const getReminderMessage = (plugs: SnapInterface[]) => {
  const [onlyPlug] = plugs;
  if (plugs.length === 1 && onlyPlug) {
    return i18n.global.t(INTERFACE_MESSAGE_KEYS[onlyPlug]);
  }
  return i18n.global.t('snap-connect-both');
};

const copyCommand = async (command: string) => {
  try {
    await copyToClipboard(command);
    createTemporaryNotification({
      group: 'snap-connect-copied',
      message: i18n.global.t('snap-connect-command-copied'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'copySnapConnectCommand' } },
    });
  }
};

/**
 * Tells the user of M³'s snap how to connect the interfaces that the Snap
 * Store doesn't connect by itself, with the exact command to run in a
 * terminal (see SNAP_MANUAL_INTERFACES): removable-media for folders on USB
 * drives and other disks, and password-manager-service, when OBS Studio is
 * on, to encrypt its password (Electron only picks the keyring up when it
 * starts, hence the restart). Each interface comes up once a session, until
 * the user turns its reminder off. Does nothing outside the snap.
 * @param options.obsEnabled Whether the current profile uses OBS Studio.
 */
export const remindToConnectSnapInterfaces = async ({
  obsEnabled,
}: {
  obsEnabled: boolean;
}) => {
  if (globalThis.electronApi?.appStore !== 'snap-store') return;
  try {
    const toCheck = getInterfacesToCheck(obsEnabled);
    if (!toCheck.length) return;
    for (const plug of toCheck) checkedThisSession.add(plug);

    const connections = await globalThis.electronApi.getSnapConnections();
    if (!connections) return;
    const plugs = getUnconnected(toCheck, connections);
    if (!plugs.length) return;

    const command = plugs
      .map((plug) => getSnapConnectCommand(plug))
      .join(' && ');
    const needsRestart = plugs.includes('password-manager-service');
    createTemporaryNotification({
      actions: [
        {
          color: 'white',
          handler: () => {
            const appSettings = useAppSettingsStore();
            for (const plug of plugs) {
              appSettings.snapConnectReminderDismissed[plug] = true;
            }
          },
          label: i18n.global.t('snap-connect-dont-remind'),
        },
        {
          color: 'white',
          handler: () => {
            void copyCommand(command);
          },
          label: i18n.global.t('snap-connect-copy'),
        },
        { color: 'white', icon: 'close', round: true },
      ],
      caption: i18n.global.t(
        needsRestart ? 'snap-connect-command-restart' : 'snap-connect-command',
        { command },
      ),
      deferWhileDialogOpen: true,
      group: 'snap-connect',
      message: getReminderMessage(plugs),
      protect: true,
      timeout: 30_000,
      type: 'warning',
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'remindToConnectSnapInterfaces' } },
    });
  }
};

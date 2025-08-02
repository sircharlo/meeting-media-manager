// Import all dialog components
import DialogAbout from 'components/dialog/DialogAbout.vue';
import DialogAddDivider from 'components/dialog/DialogAddDivider.vue';
import DialogAudioBible from 'components/dialog/DialogAudioBible.vue';
import DialogBackgroundMusicPopup from 'components/dialog/DialogBackgroundMusicPopup.vue';
import DialogCacheClear from 'components/dialog/DialogCacheClear.vue';
import DialogCongregationLookup from 'components/dialog/DialogCongregationLookup.vue';
import DialogCustomSectionEdit from 'components/dialog/DialogCustomSectionEdit.vue';
import DialogDisplayPopup from 'components/dialog/DialogDisplayPopup.vue';
import DialogDownloadsPopup from 'components/dialog/DialogDownloadsPopup.vue';
import DialogFileImport from 'components/dialog/DialogFileImport.vue';
import DialogJwPlaylist from 'components/dialog/DialogJwPlaylist.vue';
import DialogObsPopup from 'components/dialog/DialogObsPopup.vue';
import DialogPublicTalkMediaPicker from 'components/dialog/DialogPublicTalkMediaPicker.vue';
import DialogRemoteVideo from 'components/dialog/DialogRemoteVideo.vue';
import DialogSongPicker from 'components/dialog/DialogSongPicker.vue';
import DialogStudyBible from 'components/dialog/DialogStudyBible.vue';
import { Dialog } from 'quasar';
import { useDialogStateStore } from 'stores/dialog-state';

// Dialog component registry
const dialogComponents = {
  DialogAbout,
  DialogAddDivider,
  DialogAudioBible,
  DialogBackgroundMusicPopup,
  DialogCacheClear,
  DialogCongregationLookup,
  DialogCustomSectionEdit,
  DialogDisplayPopup,
  DialogDownloadsPopup,
  DialogFileImport,
  DialogJwPlaylist,
  DialogObsPopup,
  DialogPublicTalkMediaPicker,
  DialogRemoteVideo,
  DialogSongPicker,
  DialogStudyBible,
} as const;

type DialogComponentName = keyof typeof dialogComponents;

interface DialogOptions {
  component: DialogComponentName;
  dialogOptions?: {
    autoClose?: boolean;
    fullHeight?: boolean;
    fullWidth?: boolean;
    maximized?: boolean;
    noBackdropDismiss?: boolean;
    noEscDismiss?: boolean;
    persistent?: boolean;
    seamless?: boolean;
    transitionHide?: string;
    transitionShow?: string;
  };
  props?: Record<string, unknown>;
}

export class DialogPlugin {
  private static instance: DialogPlugin;
  private dialogStore = useDialogStateStore();

  static getInstance(): DialogPlugin {
    if (!DialogPlugin.instance) {
      DialogPlugin.instance = new DialogPlugin();
    }
    return DialogPlugin.instance;
  }

  /**
   * Close all open dialogs
   */
  closeAllDialogs(): void {
    this.dialogStore.closeAllDialogs();
  }

  /**
   * Get the count of open dialogs
   */
  getOpenDialogCount(): number {
    return this.dialogStore.openDialogCount;
  }

  /**
   * Check if any dialog is currently open
   */
  isAnyDialogOpen(): boolean {
    return this.dialogStore.isAnyDialogOpen;
  }

  /**
   * Check if a specific dialog is open
   */
  isDialogOpen(dialogId: string): boolean {
    return this.dialogStore.isDialogOpen(dialogId);
  }

  /**
   * Open a dialog using the Dialog Plugin
   */
  open<T = unknown>(options: DialogOptions): Promise<T> {
    const { component, dialogOptions = {}, props = {} } = options;
    const dialogId = `${component}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Register the dialog as open in our store
    this.dialogStore.openDialog(dialogId, component, props);

    return new Promise((resolve, reject) => {
      Dialog.create({
        component: dialogComponents[component],
        componentProps: {
          ...props,
          dialogId,
        },
        ...dialogOptions,
      })
        .onOk((result: T) => {
          this.dialogStore.closeDialog(dialogId);
          resolve(result);
        })
        .onCancel(() => {
          this.dialogStore.closeDialog(dialogId);
          reject(new Error('Dialog cancelled'));
        })
        .onDismiss(() => {
          this.dialogStore.closeDialog(dialogId);
          reject(new Error('Dialog dismissed'));
        });
    });
  }
}

// Export a singleton instance
export const dialogPlugin = DialogPlugin.getInstance();

// Convenience functions
export const openDialog = <T = unknown>(options: DialogOptions): Promise<T> => {
  return dialogPlugin.open<T>(options);
};

export const isAnyDialogOpen = (): boolean => {
  return dialogPlugin.isAnyDialogOpen();
};

export const getOpenDialogCount = (): number => {
  return dialogPlugin.getOpenDialogCount();
};

export const closeAllDialogs = (): void => {
  dialogPlugin.closeAllDialogs();
};

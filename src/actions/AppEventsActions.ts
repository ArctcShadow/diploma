import actionCreatorFactory,
       { Action }             from 'typescript-fsa';
import { AppConfig,
         ConfirmDialogProps,
         AppEventsState }     from '../types';


// інтерфейс дій
export interface AppEventsActions {
    showAlertDialog: (v: ConfirmDialogProps) =>
        Action<ConfirmDialogProps>;
    closeAlertDialog: () =>
        Action<void>;

    updateAppConfig: (v: AppConfig) =>
        Action<AppConfig>;
    resetApplication: () =>
        Action<void>;
}

//методи для створення дій додатку
const actionCreator = actionCreatorFactory();


const updateAppConfig =
    actionCreator.async<AppConfig, AppEventsState, Error>('ACTIONS_UPDATE_APP_CONFIG');
const resetApplication =
    actionCreator.async<void, AppEventsState, Error>('ACTIONS_RESET_APPLICATION');

//опис функцій додатку та всі можливі дії
export const appEventsActions = {
    showAlertDialog: actionCreator<ConfirmDialogProps>('ACTIONS_SHOW_ALERT_DIALOG'),
    closeAlertDialog: actionCreator<void>('ACTIONS_CLOSE_ALERT_DIALOG'),

    startUpdateAppConfig: updateAppConfig.started,
    doneUpdateAppConfig: updateAppConfig.done,
    failedUpdateAppConfig: updateAppConfig.failed,

    startResetApplication: resetApplication.started,
    doneResetApplication: resetApplication.done,
    failedResetApplication: resetApplication.failed,
};

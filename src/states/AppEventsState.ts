import { reducerWithInitialState,
         ReducerBuilder }         from 'typescript-fsa-reducers';
import { AppEventsState }         from '../types';
import { appEventsActions }       from '../actions/AppEventsActions';
import { getLocalConfigDb,
         getLocalDb,
         setRemoteDb }            from '../lib/db';
import { getConstructedAppStore } from '../store';



let appEventsReducer: ReducerBuilder<AppEventsState, AppEventsState> = null as any;
//обробка станів додатку/бд/конфігу
export async function getAppEventsReducer() {
    if (!appEventsReducer) {
        const confDb = getLocalConfigDb();
        const db = getLocalDb();

        
        let resp: PouchDB.Core.AllDocsResponse<{}> = null as any;

        resp = await confDb.allDocs({
            include_docs: true,
        });

        if (resp.rows.length === 0) {
            await confDb.post({
                type: 'appConfig',
                remoteDbUrl: '',
                remoteDbUser: '',
                remoteDbPassword: '',
            }, {});

            resp = await confDb.allDocs({
                include_docs: true,
            });
        }

        const initialState: AppEventsState = {
            alertDialog: {
                open: false,
                title: '',
                message: '',
                onClose: () => void 0,
            },
            appConfig: {
                ...resp.rows[0].doc,
            } as any,
        };

        if (initialState.appConfig.remote && initialState.appConfig.remote.endpointUrl) {
            setRemoteDb(
                initialState.appConfig.remote.endpointUrl,
                initialState.appConfig.remote.user || '',
                initialState.appConfig.remote.password || '',
            )
            .then(() => {
                //
            })
            .catch(err => {
                alert('Помилка підключення до віддаленої бази даних: ' + err.message);
            });
        } else {
            setRemoteDb('', '', '')
            .then(() => {
                //
            })
            .catch(err => {
                alert('Помилка підключення до віддаленої бази даних: ' + err.message);
            });
        }

        appEventsReducer = reducerWithInitialState(initialState)
            .case(appEventsActions.showAlertDialog, (state, payload) => {
                return Object.assign({}, state, {
                    alertDialog: payload,
                });
            })
            .case(appEventsActions.closeAlertDialog, (state) => {
                return Object.assign({}, state, {
                    alertDialog: initialState,
                });
            })

            //оновлення конфігу асинхронно
            .case(appEventsActions.startUpdateAppConfig, (state, payload) => {
                const newConf = Object.assign({}, state.appConfig,
                    payload.remote && payload.remote.endpointUrl ?
                        payload :
                        {
                            remote: {
                                endpointUrl: '',
                                user: '',
                                password: '',
                            }
                        },
                );

                confDb.put(newConf, {})
                .then(v => {
                    newConf._id = v.id;
                    newConf._rev = v.rev;

                    getConstructedAppStore().dispatch(appEventsActions.doneUpdateAppConfig({
                        params: payload,
                        result: Object.assign({}, state, { appConfig: newConf }),
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Done',
                            message: 'Налаштування збережено успішно.',
                            singleButton: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);

                    if (newConf.remote.endpointUrl) {
                        setRemoteDb(
                            newConf.remote.endpointUrl,
                            newConf.remote.user,
                            newConf.remote.password,
                        )
                        .then(() => {
                            //
                        })
                        .catch(err => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Error',
                                message: 'Помилка підключення до віддаленої бази даних: ' + err.message,
                                singleButton: true,
                                colorIsSecondary: true,
                                onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                            }));
                        });
                    }
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(appEventsActions.failedUpdateAppConfig({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Помилка оновлення налаштувань: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(appEventsActions.doneUpdateAppConfig, (state, arg) => {
                return arg.result;
            })
            .case(appEventsActions.failedUpdateAppConfig, (state, arg) => {
                return state;
            })

            // Асинхронний перезапуск додатку та всіх данних
            .case(appEventsActions.startResetApplication, (state) => {
                (async () => {
                    try {
                        try {
                            await setRemoteDb('', '', '');
                        } catch (e) {
                            alert(e);
                        }
                        try {
                            await db.destroy({});
                        } catch (e) {
                            alert(e);
                        }
                        try {
                            await confDb.destroy({});
                        } catch (e) {
                            alert(e);
                        }

                        alert('Усі дані знищено, перезавантажте сторінку.');

                        getConstructedAppStore().dispatch(appEventsActions.doneResetApplication({
                            result: state,
                        }));
                    } catch (e) {
                        alert(e);
                        getConstructedAppStore().dispatch(appEventsActions.failedResetApplication({
                            error: e,
                        }));
                    }
                })();

                return state;
            })
            .case(appEventsActions.doneUpdateAppConfig, (state, arg) => {
                return arg.result;
            })
            .case(appEventsActions.failedUpdateAppConfig, (state, arg) => {
                return state;
            })
            ;
    }
    return appEventsReducer;
}

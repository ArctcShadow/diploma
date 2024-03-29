import { reducerWithInitialState,
         ReducerBuilder }         from 'typescript-fsa-reducers';
import { push }                   from 'connected-react-router';
import { KanbanBoardState,
         KanbanBoardInitialData,
         DocumentWithContents,
         KanbanBoardDbRecord,
         KanbanBoardDbRecordUserData,
         KanbanBoardRecord,
         KanbanRecord }           from '../types';
import { appEventsActions }       from '../actions/AppEventsActions';
import { kanbanBoardActions }     from '../actions/KanbanBoardActions';
import { restartSync,
         getLocalDb }             from '../lib/db';
import { formatDate }             from '../lib/datetime';
import { getConstructedAppStore } from '../store';
import { initialData }            from '../data/initial-data';



let kanbanBoardReducer: ReducerBuilder<KanbanBoardState, KanbanBoardState> = null as any;

export async function getKanbanBoardReducer() {
    if (!kanbanBoardReducer) {
        const db = getLocalDb();

        
        let resp: PouchDB.Core.AllDocsResponse<DocumentWithContents> = null as any;

        resp = await db.allDocs({
            include_docs: true,
        });

        if (resp.rows.length === 0) {
            const data: KanbanBoardInitialData = initialData as any;

            const postRespBoards = await db.bulkDocs([
                ...data.boards,
            ], {});

            const now = new Date();
            for (const rec of data.records) {
                rec.dueDate = formatDate(now);
                rec.boardId = postRespBoards[0].id as string;
            }
            await db.bulkDocs([
                ...data.records,
            ], {});

            resp = await db.allDocs({
                include_docs: true,
            });
        }

        const boards: KanbanBoardRecord[] = resp.rows
            .filter(x => x.doc && x.doc.type === 'kanbanBoard')
            .map(x => x.doc)
            .sort((a: any, b: any) =>
                String(a.name).toLocaleLowerCase() >= String(b.name).toLocaleLowerCase() ?
                (String(a.name) === String(b.name) ? 0 : 1) : -1) as any;
        for (const board of boards) {
            const records: KanbanRecord[] = resp.rows
                .filter(x => x.doc && x.doc.type === 'kanban' &&
                    (x.doc as KanbanRecord).boardId === board._id)
                .map(x => x.doc) as any;
            board.records = records;
        }

        const initialState: KanbanBoardState = {
            activeBoard: boards[0],
            boards: boards,
            activeBoardId: boards[0]._id,
            activeBoardIndex: 0,
        };

        kanbanBoardReducer = reducerWithInitialState(initialState)
            //Додати дошку асинхронно
            .case(kanbanBoardActions.startAddBoard, (state, payload) => {
                const data: KanbanBoardInitialData = initialData as any;
                const board: KanbanBoardDbRecordUserData = {
                    type: 'kanbanBoard',
                    name: payload.boardName,
                    taskStatuses: data.boards[0].taskStatuses,
                    teamOrStories: data.boards[0].teamOrStories,
                    tags: data.boards[0].tags,
                    displayBarcode: data.boards[0].displayBarcode,
                    displayMemo: data.boards[0].displayMemo,
                    displayFlags: data.boards[0].displayFlags,
                    displayTags: data.boards[0].displayTags,
                    preferArchive: data.boards[0].preferArchive,
                    boardStyle: data.boards[0].boardStyle,
                    calendarStyle: data.boards[0].calendarStyle,
                };
                db.post(board, {})
                .then(v => {
                    const saved: KanbanBoardRecord = board as any;
                    saved._id = v.id;
                    saved._rev = v.rev;
                    saved.records = [];
                    state.boards = state.boards.concat([saved]);
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneAddBoard({
                        params: payload,
                        result: Object.assign({}, state, { activeBoardId: v.id, activeBoard: saved }),
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(push(`/kanban/${v.id}`));
                    }, 30);
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedAddBoard({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Неможливо додати дошку: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });
                return state;
            })
            .case(kanbanBoardActions.doneAddBoard, (state, arg) => {
                setTimeout(() => {
                    restartSync()
                    .then(() => {
                        //
                    }).catch(err => {
                        alert(err.message);
                    })
                }, 1500);
                return arg.result;
            })
            .case(kanbanBoardActions.failedAddBoard, (state, arg) => {
                return state;
            })

            //Змінити активну дошку асинхронно
            .case(kanbanBoardActions.startChangeActiveBoard, (state, payload) => {
                (async () => {
                    try {
                        const board = await db.get<KanbanBoardRecord>(payload.boardId, {});
                        if (! board) {
                            return state;
                        }
                        const records: KanbanRecord[] = (await db.find({selector: {
                            type: 'kanban',
                            boardId: board._id,
                        }})).docs as any;

                        board.records = records;
                        const index = state.boards.findIndex(x => x._id === board._id);
                        const boards = state.boards.slice(0, index).concat(
                            [board],
                            state.boards.slice(index + 1),
                        );

                        getConstructedAppStore().dispatch(kanbanBoardActions.doneChangeActiveBoard({
                            params: payload,
                            result: Object.assign({}, state, {
                                boards,
                                activeBoardId: board._id,
                                activeBoard: board,
                            }),
                        }));
                    } catch (e) {
                        getConstructedAppStore().dispatch(kanbanBoardActions.failedChangeActiveBoard({
                            params: payload,
                            error: e,
                        }));
                        setTimeout(() => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Error',
                                message: 'Помилка зміни дошки: ' + e.message,
                                singleButton: true,
                                colorIsSecondary: true,
                                onClose: () => {
                                    getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog());
                                    setTimeout(() => {
                                        getConstructedAppStore().dispatch(push(`/kanban/`));
                                    }, 500);
                                },
                            }));
                        }, 30);
                    }
                })();
                return state;
            })
            .case(kanbanBoardActions.doneChangeActiveBoard, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedChangeActiveBoard, (state, arg) => {
                return state;
            })

            //Змінити назву дддошки асинхронно
            .case(kanbanBoardActions.startUpdateBoardName, (state, payload) => {
                (async () => {
                    try {
                        const dbBoard = await db.get<KanbanBoardRecord>(payload.boardId);
                        if (! dbBoard) {
                            return state;
                        }
                        const records: KanbanRecord[] = (await db.find({selector: {
                            type: 'kanban',
                            boardId: dbBoard._id,
                        }})).docs as any;

                        const change = Object.assign({}, dbBoard, { name: payload.boardName });
                        const saved = await db.put(change, {});

                        change.records = records;
                        change._id = saved.id;
                        change._rev = saved.rev;

                        const index = state.boards.findIndex(x => x._id === payload.boardId);
                        const board = Object.assign({}, state.boards[index] || {}, change);

                        const boards = index >= 0 ?
                            state.boards.slice(0, index).concat(
                                [board],
                                state.boards.slice(index + 1),
                            ) : state.boards;

                            getConstructedAppStore().dispatch(kanbanBoardActions.doneUpdateBoardName({
                            params: payload,
                            result: Object.assign({}, state, {
                                boards,
                                activeBoardId: board._id,
                                activeBoard: board,
                            }),
                        }));
                    } catch (e) {
                        getConstructedAppStore().dispatch(kanbanBoardActions.failedUpdateBoardName({
                            params: payload,
                            error: e,
                        }));
                        setTimeout(() => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Error',
                                message: 'Помилка призмінні назви дошки: ' + e.message,
                                singleButton: true,
                                colorIsSecondary: true,
                                onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                            }));
                        }, 30);
                    }
                })();
                return state;
            })
            .case(kanbanBoardActions.doneUpdateBoardName, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedUpdateBoardName, (state, arg) => {
                return state;
            })

            //Видалити дошку асинхронно
            .case(kanbanBoardActions.startDeleteBoard, (state, payload) => {
                (async () => {
                    try {
                        if (state.boards.length <= 1) {
                            return state;
                        }
                        const dbBoard = await db.get<KanbanBoardDbRecord>(payload.boardId);
                        if (! dbBoard) {
                            return state;
                        }

                        const records: KanbanRecord[] = (await db.find({selector: {
                            type: 'kanban',
                            boardId: payload.boardId,
                        }})).docs as any;

                        for (const record of records) {
                            await db.remove(record, {});
                        }

                        await db.remove(dbBoard, {});

                        const index = state.boards.findIndex(x => x._id === payload.boardId);
                        const boards = index >= 0 ?
                            state.boards.slice(0, index).concat(
                                state.boards.slice(index + 1),
                            ) : state.boards;
                        let activeBoard = state.activeBoard;
                        let activeBoardId = state.activeBoardId;
                        if (activeBoardId === payload.boardId) {
                            activeBoard = boards[0];
                            activeBoardId = boards[0]._id;
                        }

                        setTimeout(() => {
                            getConstructedAppStore().dispatch(kanbanBoardActions.doneDeleteBoard({
                                params: payload,
                                result: Object.assign({}, state, {
                                    boards,
                                    activeBoardId,
                                    activeBoard,
                                }),
                            }));
                            setTimeout(() => {
                                getConstructedAppStore().dispatch(push(`/kanban/${activeBoardId}`));
                                setTimeout(() => {
                                    getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                        open: true,
                                        title: 'Done',
                                        message: 'Успішно видалено',
                                        singleButton: true,
                                        onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                                    }));
                                }, 30);
                            }, 30);
                        }, 30);
                    } catch (e) {
                        getConstructedAppStore().dispatch(kanbanBoardActions.failedDeleteBoard({
                            params: payload,
                            error: e,
                        }));
                        setTimeout(() => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Error',
                                message: 'Помилка при видаленні дошки: ' + e.message,
                                singleButton: true,
                                colorIsSecondary: true,
                                onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                            }));
                        }, 30);
                    }
                })();
                return state;
            })
            .case(kanbanBoardActions.doneDeleteBoard, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedDeleteBoard, (state, arg) => {
                return state;
            })

            // Додати картку асинхронно
            .case(kanbanBoardActions.startAddStikey, (state, payload) => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const change: KanbanRecord = {
                    type: 'kanban',
                    dueDate: formatDate(today),
                    description: '# Без назви',
                    barcode: '',
                    memo: '',
                    flags: [],
                    tags: [],
                    boardId: state.activeBoardId,
                    taskStatus: state.activeBoard.taskStatuses[0].value,
                    teamOrStory: state.activeBoard.teamOrStories[0].value,
                } as any;

                const records = state.activeBoard.records.concat([change]);
                const activeBoard = Object.assign({}, state.activeBoard, { records });

                db.post(change, {})
                .then(v => {
                    change._id = v.id;
                    change._rev = v.rev;
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneAddStikey({
                        params: payload,
                        result: Object.assign({}, state, { activeBoard }),
                    }));
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedAddStikey({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Неможливо додати завдання: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(kanbanBoardActions.doneAddStikey, (state, arg) => {
                setTimeout(() => {
                    restartSync()
                    .then(() => {
                        //
                    }).catch(err => {
                        alert(err.message);
                    })
                }, 1500);
                return arg.result;
            })
            .case(kanbanBoardActions.failedAddStikey, (state, arg) => {
                return state;
            })

            //Оновлення картки асинхронно
            .case(kanbanBoardActions.startUpdateStikey, (state, payload) => {
                const index = state.activeBoard.records.findIndex(x => x._id === payload._id);
                if (index < 0) {
                    return state;
                }

                const change = Object.assign({}, state.activeBoard.records[index], {
                    dueDate: payload.dueDate,
                    description: payload.description,
                    barcode: payload.barcode,
                    memo: payload.memo,
                    tags: payload.tags,
                    flags: payload.flags,
                    taskStatus: payload.taskStatus,
                    teamOrStory: payload.teamOrStory,
                });

                const records = state.activeBoard.records.slice(0, index).concat(
                    [change],
                    state.activeBoard.records.slice(index + 1),
                );
                const activeBoard = Object.assign({}, state.activeBoard, { records });

                db.put(change, {})
                .then(v => {
                    change._id = v.id;
                    change._rev = v.rev;
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneUpdateStikey({
                        params: payload,
                        result: Object.assign({}, state, { activeBoard }),
                    }));
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedUpdateStikey({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Помилка при збереженні : ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(kanbanBoardActions.doneUpdateStikey, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedUpdateStikey, (state, arg) => {
                return state;
            })

            //Оновлення таблиці асинхронно
            .case(kanbanBoardActions.startUpdateStikeyLanes, (state, payload) => {
                const index = state.activeBoard.records.findIndex(x => x._id === payload.kanbanId);
                if (index < 0) {
                    return state;
                }

                const change = Object.assign({}, state.activeBoard.records[index], {
                    taskStatus: payload.taskStatusValue,
                    teamOrStory: payload.teamOrStoryValue,
                });

                const records = state.activeBoard.records.slice(0, index).concat(
                    [change],
                    state.activeBoard.records.slice(index + 1),
                );
                const activeBoard = Object.assign({}, state.activeBoard, { records });

                db.put(change, {})
                .then(v => {
                    change._id = v.id;
                    change._rev = v.rev;
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneUpdateStikeyLanes({
                        params: payload,
                        result: Object.assign({}, state, { activeBoard }),
                    }));
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedUpdateStikeyLanes({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Помилка при збереженні: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(kanbanBoardActions.doneUpdateStikeyLanes, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedUpdateStikeyLanes, (state, arg) => {
                return state;
            })

            //Архівування асинхронно
            .case(kanbanBoardActions.startArchiveStikey, (state, payload) => {
                const index = state.activeBoard.records.findIndex(x => x._id === payload.kanbanId);
                if (index < 0) {
                    return state;
                }

                const change = Object.assign({}, state.activeBoard.records[index]);
                change.flags = (change.flags || []).filter(x => x !== 'Archived');
                change.flags.push('Archived');

                const records = state.activeBoard.records.slice(0, index).concat(
                    [change],
                    state.activeBoard.records.slice(index + 1),
                );
                const activeBoard = Object.assign({}, state.activeBoard, { records });

                db.put(change, {})
                .then(v => {
                    change._id = v.id;
                    change._rev = v.rev;
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneArchiveStikey({
                        params: payload,
                        result: Object.assign({}, state, { activeBoard }),
                    }));
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedArchiveStikey({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Помилка при архівуванні: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(kanbanBoardActions.doneArchiveStikey, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedArchiveStikey, (state, arg) => {
                return state;
            })

            //Видалення таски асинхронно
            .case(kanbanBoardActions.startDeleteStikey, (state, payload) => {
                const index = state.activeBoard.records.findIndex(x => x._id === payload.kanbanId);
                if (index < 0) {
                    return state;
                }

                const change = state.activeBoard.records[index];

                const records = state.activeBoard.records.slice(0, index).concat(
                    state.activeBoard.records.slice(index + 1),
                );
                const activeBoard = Object.assign({}, state.activeBoard, { records });

                db.remove(change, {})
                .then(v => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.doneDeleteStikey({
                        params: payload,
                        result: Object.assign({}, state, { activeBoard }),
                    }));
                })
                .catch(err => {
                    getConstructedAppStore().dispatch(kanbanBoardActions.failedDeleteStikey({
                        params: payload,
                        error: err,
                    }));
                    setTimeout(() => {
                        getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                            open: true,
                            title: 'Error',
                            message: 'Помилка при видаленні: ' + err.message,
                            singleButton: true,
                            colorIsSecondary: true,
                            onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                        }));
                    }, 30);
                });

                return state;
            })
            .case(kanbanBoardActions.doneDeleteStikey, (state, arg) => {
                return arg.result;
            })
            .case(kanbanBoardActions.failedDeleteStikey, (state, arg) => {
                return state;
            })

            //Зміна дошки асинхронно
            .case(kanbanBoardActions.startEditBoardAndStikeys, (state, payload) => {
                (async () => {
                    try {
                        const index = state.boards.findIndex(x => x._id === payload._id);
                        if (index < 0) {
                            return state;
                        }

                        const change = Object.assign({}, state.boards[index], {
                            name: payload.name || 'Untitled',
                            taskStatuses: payload.taskStatuses || initialState.activeBoard.taskStatuses,
                            teamOrStories: payload.teamOrStories || initialState.activeBoard.teamOrStories,
                            tags: payload.tags || initialState.activeBoard.tags,
                            displayBarcode: !!payload.displayBarcode,
                            displayMemo: !!payload.displayMemo,
                            displayFlags: !!payload.displayFlags,
                            displayTags: !!payload.displayTags,
                            preferArchive: !!payload.preferArchive,
                            boardStyle: payload.boardStyle || initialState.activeBoard.boardStyle,
                            calendarStyle: payload.calendarStyle || initialState.activeBoard.calendarStyle,
                        });

                        const v = await db.put(change, {});
                        change._id = v.id;
                        change._rev = v.rev;

                        const boards = state.boards.slice(0, index).concat(
                            [change],
                            state.boards.slice(index + 1),
                        );
                        let activeBoard = change._id === state.activeBoard._id ? change : state.activeBoard;

                   
                        const records: KanbanRecord[] = (await db.find({selector: {
                            type: 'kanban',
                            boardId: change._id,
                        }})).docs as any;

                        const recordsNew: KanbanRecord[] = [];
                        for (const rec of payload.records || []) {
                            const recDb = records.find(x => x._id === rec._id);
                            let recNew: KanbanRecord = null as any;
                            if (recDb) {
                                recNew = Object.assign({}, rec, { type: 'kanban', boardId: change._id, _rev: recDb._rev });
                                const resp = await db.put(recNew, {});
                                recNew._id = resp.id;
                                recNew._rev = resp.rev;
                            } else {
                                recNew = Object.assign({}, rec, { type: 'kanban', boardId: change._id });
                                delete recNew._id;
                                delete recNew._rev;
                                const resp = await db.post(recNew, {});
                                recNew._id = resp.id;
                                recNew._rev = resp.rev;
                            }
                            recordsNew.push(recNew);
                        }
                        for (const recDb of records) {
                            const recNew = recordsNew.find(x => x._id === recDb._id);
                            if (! recNew) {
                                await db.remove(recDb, {});
                            }
                        }
                        change.records = recordsNew;

                        getConstructedAppStore().dispatch(kanbanBoardActions.doneEditBoardAndStikeys({
                            params: payload,
                            result: Object.assign({}, state, {
                                boards,
                                activeBoardId: activeBoard._id,
                                activeBoard: activeBoard,
                            }),
                        }));
                        setTimeout(() => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Done',
                                message: 'Успішно збережено',
                                singleButton: true,
                                onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                            }));
                        }, 30);
                    } catch (e) {
                        getConstructedAppStore().dispatch(kanbanBoardActions.failedEditBoardAndStikeys({
                            params: payload,
                            error: e,
                        }));
                        setTimeout(() => {
                            getConstructedAppStore().dispatch(appEventsActions.showAlertDialog({
                                open: true,
                                title: 'Error',
                                message: 'Помилка при збереженні: ' + e.message,
                                singleButton: true,
                                colorIsSecondary: true,
                                onClose: () => getConstructedAppStore().dispatch(appEventsActions.closeAlertDialog()),
                            }));
                        }, 30);
                    }
                })();

                return state;
            })
            .case(kanbanBoardActions.doneEditBoardAndStikeys, (state, arg) => {
                setTimeout(() => {
                    restartSync()
                    .then(() => {
                        //
                    }).catch(err => {
                        alert(err.message);
                    })
                }, 1500);
                return arg.result;
            })
            .case(kanbanBoardActions.failedEditBoardAndStikeys, (state, arg) => {
                return state;
            })
            ;
    }
    return kanbanBoardReducer;
}

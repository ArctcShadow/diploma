import { KanbanBoardRecord,
         KanbanRecord,
         AppConfig }       from '../types';


//валідація
export function pickEditableStikeyProps(stikey: KanbanRecord) {
    return (Object.assign(stikey._id ? { _id: stikey._id } : {}, {
        dueDate: stikey.dueDate || '',
        taskStatus: stikey.taskStatus || '',
        teamOrStory: stikey.teamOrStory || '',
        flags: stikey.flags || [],
        tags: stikey.tags || [],
        description: stikey.description || '',
        barcode: stikey.barcode || '',
        memo: stikey.memo || '',
    }));
}


export function pickEditableBoardProps(board: KanbanBoardRecord) {
    return ({
        name: board.name || '',
        taskStatuses: board.taskStatuses || [],
        teamOrStories: board.teamOrStories || [],
        tags: board.tags || [],
        displayBarcode: !!board.displayBarcode,
        displayMemo: !!board.displayMemo,
        displayFlags: !!board.displayFlags,
        displayTags: !!board.displayTags,
        preferArchive: !!board.preferArchive,
        boardStyle: board.boardStyle || '',
        calendarStyle: board.calendarStyle || '',
        records: (board.records && board.records.map(x => pickEditableStikeyProps(x))) || [],
    });
}


export function validateStikeyProps(stikey: KanbanRecord) {
    if (typeof stikey.dueDate !== 'string') {
        throw new Error('потрібна текстова змінна "dueDate".');
    }
    if (typeof stikey.taskStatus !== 'string') {
        throw new Error('потрібна текстова змінна"taskStatus".');
    }
    if (typeof stikey.teamOrStory !== 'string') {
        throw new Error('потрібна текстова змінна"teamOrStory".');
    }
    if (stikey.flags && Array.isArray(stikey.flags)) {
        stikey.flags.forEach(x => {
            if (typeof x !== 'string') {
                throw new Error('змінна "flags[x]" повинна бути текстовою.');
            }
        });
    } else {
        throw new Error('потрібен масив змінних "flags".');
    }
    if (stikey.tags && Array.isArray(stikey.tags)) {
        stikey.tags.forEach(x => {
            if (typeof x !== 'string') {
                throw new Error('змінна"tags[x]" повинна бути текстовою.');
            }
        });
    } else {
        throw new Error('потрібен масив змінних "tags".');
    }
    if (typeof stikey.description !== 'string') {
        throw new Error('потрібна текстова змінна "description".');
    }
    if (typeof stikey.barcode !== 'string') {
        throw new Error('потрібна текстова змінна "barcode".');
    }
    if (typeof stikey.memo !== 'string') {
        throw new Error('потрібна текстова змінна "memo".');
    }
    return stikey;
}


export function validateBoardProps(board: KanbanBoardRecord) {
    if (typeof board.name !== 'string') {
        throw new Error('потрібна текстова змінна "name".');
    }
    if (board.taskStatuses && Array.isArray(board.taskStatuses)) {
        board.taskStatuses.forEach(x => {
            if (x.caption !== null && x.caption !== void 0 && typeof x.caption !== 'string') {
                throw new Error('змінна"taskStatuses[x].caption" повинна бути текстовою.');
            }
            if (x.className !== null && x.className !== void 0 && typeof x.className !== 'string') {
                throw new Error('змінна "taskStatuses[x].className" повинна бути текстовою.');
            }
            if (x.completed !== null && x.completed !== void 0 && typeof x.completed !== 'boolean') {
                throw new Error('змінна "taskStatuses[x].completed" повинна бути типу bool.');
            }
            if (typeof x.value !== 'string') {
                throw new Error('потрібна текстова змінна "taskStatuses[x].value".');
            }
        });
    } else {
        throw new Error('потрібен масив значень "taskStatuses".');
    }
    if (board.teamOrStories && Array.isArray(board.teamOrStories)) {
        board.teamOrStories.forEach(x => {
            if (x.caption !== null && x.caption !== void 0 && typeof x.caption !== 'string') {
                throw new Error('змінна "teamOrStories[x].caption" повинна бути текстовою.');
            }
            if (x.className !== null && x.className !== void 0 && typeof x.className !== 'string') {
                throw new Error('змінна "teamOrStories[x].className" повинна бути текстовою.');
            }
            if (typeof x.value !== 'string') {
                throw new Error('потрібна текстова змінна "teamOrStories[x].value".');
            }
        });
    } else {
        throw new Error('потрібен масив змінних "teamOrStories".');
    }
    if (board.tags && Array.isArray(board.tags)) {
        board.tags.forEach(x => {
            if (x.className !== null && x.className !== void 0 && typeof x.className !== 'string') {
                throw new Error('змінна "tags[x].className" повинна бути текстовою.');
            }
            if (typeof x.value !== 'string') {
                throw new Error('потрібна текстова змінна "tags[x].value".');
            }
        });
    } else {
        throw new Error('потрібен масив змінних "tags".');
    }
    if (typeof board.displayBarcode !== 'boolean') {
        throw new Error('потрібна змінна типу bool "displayBarcode".');
    }
    if (typeof board.displayMemo !== 'boolean') {
        throw new Error('потрібна змінна типу bool "displayMemo".');
    }
    if (typeof board.displayFlags !== 'boolean') {
        throw new Error('потрібна змінна типу bool "displayFlags".');
    }
    if (typeof board.displayTags !== 'boolean') {
        throw new Error('потрібна змінна типу bool "displayTags".');
    }
    if (typeof board.preferArchive !== 'boolean') {
        throw new Error('потрібна змінна типу bool "preferArchive".');
    }
    if (typeof board.boardStyle !== 'string') {
        throw new Error('потрібна текстова змінна "boardStyle".');
    }
    if (typeof board.calendarStyle !== 'string') {
        throw new Error('потрібна текстова змінна "calendarStyle".');
    }

    if (board.records && Array.isArray(board.records)) {
        board.records.forEach(x => validateStikeyProps(x));
    } else {
        throw new Error('потрібен масив змінних "records".');
    }

    return board;
}


export function pickEditableConfigProps(conf: AppConfig) {
    return ({
        remote: {
            endpointUrl: conf.remote && conf.remote.endpointUrl ?
                conf.remote.endpointUrl : '',
            user: conf.remote && conf.remote.user ?
                conf.remote.user : '',
            password: conf.remote && conf.remote.password ?
                conf.remote.password : '',
        }
    });
}


export function validateConfigProps(conf: AppConfig) {
    if (! conf.remote) {
        throw new Error('потрібне значення "remote".');
    }
    if (typeof conf.remote.endpointUrl !== 'string') {
        throw new Error('потрібно текстове значення "remote.endpointUrl".');
    }
    if (typeof conf.remote.user !== 'string') {
        throw new Error('потрібно текстове значення "remote.user".');
    }
    if (typeof conf.remote.password !== 'string') {
        throw new Error('потрібно текстове значення "remote.password".');
    }
    return conf;
}

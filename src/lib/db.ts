import PouchDB     from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';


//назва бази
const dbBaseName = window.location.pathname.replace(/\//g, '_');
//плагін надсилання запитів
PouchDB.plugin(PouchDBFind);
//змінні синхронізації з віддаленою базою
let remoteDb: PouchDB.Database | null = null;
let rep: PouchDB.Replication.Sync<{}> | null = null;
//локальна база
const localDb = new PouchDB(`kanban-board-v1@${dbBaseName}`, { auto_compaction: true });
const localConfigDb = new PouchDB(`kanban-board-config-v1@${dbBaseName}`, { auto_compaction: true });

//функція синхронізації локальної та віддаленої
async function startSync() {
    if (remoteDb) {
        const localDocs = await localDb.allDocs({});
        const remoteDocs = remoteDb ? await remoteDb.allDocs({}) : null;
        const idSet = new Set<string>();
        for (const doc of localDocs.rows) {
            idSet.add(doc.id);
        }
        if (remoteDocs) {
            for (const doc of remoteDocs.rows) {
                idSet.add(doc.id);
            }
        }

        rep = localDb.sync(remoteDb, {
            live: true,
            retry: true,
            doc_ids: Array.from(idSet.values()),
        })
        .on('change', change => {
            
        })
        .on('paused', info => {
            
        })
        .on('active' as any, info => {
            
        })
        .on('complete', info => {
            
        })
        .on('error', err => {
            
        });
    }
}

//перезапуск
export async function restartSync() {
    if (rep) {
        try {
            rep.cancel();
        } catch (e) {
            
        }
        rep = null;
    }

    await startSync();
}

//Встановлення віддаленої бази
export async function setRemoteDb(url: string, user: string, password: string) {
    if (rep) {
        try {
            rep.cancel();
        } catch (e) {
            
        }
        rep = null;
    }
    if (remoteDb) {
        try {
            await remoteDb.close();
        } catch (e) {
            
        }
        remoteDb = null;
    }

    if (url && url.match(/^https?:\/\//)) {
        remoteDb = new PouchDB(url, {
            auth: {
                username: user,
                password: password,
            },
        });

        await startSync();
    }
}

//база даних
export function getLocalDb() {
    return localDb;
}
//конфіг
export function getLocalConfigDb() {
    return localConfigDb;
}



import { createStore,
         combineReducers, 
         applyMiddleware,
         compose,
         Store,
         AnyAction }             from 'redux';
import { createHashHistory }     from 'history';
import { connectRouter,
         routerMiddleware }      from 'connected-react-router';
import { AppState }              from './types';
import { getKanbanBoardReducer } from './states/KanbanBoardState';
import { getCalendarReducer }    from './states/CalendarState';
import { getAppEventsReducer }   from './states/AppEventsState';


// Створено новий HashHistory
export const history = createHashHistory({
    hashType: 'slash',
});

//Ініціалізація
let store: Store<AppState, AnyAction> = null as any;

//Функція для отримання сховища додатку
export function getConstructedAppStore() {
    return store;
}

// Отримання асинхронно
export default async function getAppStore() {
    //Створення нового сховища
    if (!store) {
        store = createStore(
            //Підключення усіх змінних
            combineReducers<AppState>({
                router: connectRouter(history),
                appEvents: await getAppEventsReducer(),
                kanbanBoard: await getKanbanBoardReducer(),
                calendar: await getCalendarReducer(),
            }),
            compose(
                applyMiddleware(
                    routerMiddleware(history), //Надсилання дій маршрутизатора
                ),
            ),
        );
    }
    return store;
}

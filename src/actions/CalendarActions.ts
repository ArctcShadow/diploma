import actionCreatorFactory,
       { Action }             from 'typescript-fsa';
import { KanbanRecord,
         ConfirmDialogProps } from '../types';


//інтерфейс дій додатку
export interface CalendarActions {
    showToday: () =>
        Action<void>;
    showNextMonth: () =>
        Action<void>;
    showPreviousMonth: () =>
        Action<void>;
    showNextYear: () =>
        Action<void>;
    showPreviousYear: () =>
        Action<void>;

    // дії з дошкою на полотні календаря
    changeActiveBoard: (id: string) =>
        Action<{boardId: string}>;
    updateBoardName: (v: {boardId: string, boardName: string}) =>
        Action<{boardId: string, boardName: string}>;
    updateStikey: (v: KanbanRecord) =>
        Action<KanbanRecord>;
    archiveStikey: (kanbanId: string) =>
        Action<{kanbanId: string}>;
    deleteStikey: (kanbanId: string) =>
        Action<{kanbanId: string}>;

    // дії з сповіщеннями на полотні календаря
    showAlertDialog: (v: ConfirmDialogProps) =>
        Action<ConfirmDialogProps>;
    closeAlertDialog: () =>
        Action<void>;
}

//методи для створення дій додатку, їх опис
const actionCreator = actionCreatorFactory();

export const calendarActions = {
    showToday: actionCreator<void>('ACTIONS_SHOW_TODAY'),
    showNextMonth: actionCreator<void>('ACTIONS_SHOW_NEXT_MONTH'),
    showPreviousMonth: actionCreator<void>('ACTIONS_SHOW_PREVIOUS_MONTH'),
    showNextYear: actionCreator<void>('ACTIONS_SHOW_NEXT_YEAR'),
    showPreviousYear: actionCreator<void>('ACTIONS_SHOW_PREVIOUS_YEAR'),
};

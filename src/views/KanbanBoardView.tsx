import React                      from 'react';
import { connect }                from 'react-redux';
import { RouteComponentProps }    from 'react-router-dom';
import { makeStyles,
         useTheme }               from '@material-ui/core/styles';
import Typography                 from '@material-ui/core/Typography';
import IconButton                 from '@material-ui/core/IconButton';
import AddBoxIcon                 from '@material-ui/icons/AddBox';
import clsx                       from 'clsx';
import marked                     from 'marked';
import { Qr }                     from 'red-agate-barcode';
import { LaneDef,
         StatusLaneDef,
         KanbanRecord,
         KanbanBoardState, 
         KanbanBoardRecord }      from '../types';
import gensym                     from '../lib/gensym';
import { parseISODate }           from '../lib/datetime';
import { isDark }                 from '../lib/theme';
import { mapDispatchToProps,
         mapStateToProps,
         KanbanBoardActions }     from '../dispatchers/KanbanBoardDispatcher';
import KanbanDialog               from '../components/KanbanDialog';
import TextInputDialog            from '../components/TextInputDialog';
import { getConstructedAppStore } from '../store';
import                                 './KanbanBoardView.css';


//картки
type StikeysProps = KanbanBoardActions & {
    records: KanbanRecord[],
    taskStatus: StatusLaneDef,
    teamOrStory: LaneDef,
    taskStatuses: StatusLaneDef[],
    teamOrStories: LaneDef[],
    board: KanbanBoardRecord,
};

type StikeyProps = KanbanBoardActions & {
    record: KanbanRecord,
    taskStatus: StatusLaneDef,
    teamOrStory: LaneDef,
    taskStatuses: StatusLaneDef[],
    teamOrStories: LaneDef[],
    board: KanbanBoardRecord,
};

type KanbanBoardViewProps = KanbanBoardState & KanbanBoardActions & RouteComponentProps<{id: string}> & {
}; //Властивості дошки, стан, дії, маршрут


const useStyles = makeStyles(theme => ({
    root: {},
    smallIcon: {
        width: '20px',
        height: '20px',
    },
}));


const mapNeverStateToProps = () => ({}); //маппер

const agent = window.navigator.userAgent.toLowerCase();
const firefox = (agent.indexOf('firefox') !== -1);


const Stikey_: React.FC<StikeyProps> = (props) => {
    const [open, setOpen] = React.useState(false);
    // змінні для роботи з датою при відкритті діалогу
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = props.record.dueDate ? parseISODate(props.record.dueDate) : null;
    const expired = (! props.taskStatus.completed) &&
        (dueDate ? dueDate < today : false);
    //дані для drag-методу
    function handleOnDragStart(ev: React.DragEvent) {
        ev.dataTransfer.setData('elId', (ev.target as any).id);
    }
    //оновлення
    function handleEditApply(rec: KanbanRecord) {
        props.updateStikey(rec);
        setOpen(false);
    }
    //архівування
    function handleArchive(id: string) {
        props.archiveStikey(id);
        setOpen(false);
    }
    //видалення
    function handleDelete(id: string) {
        props.deleteStikey(id);
        setOpen(false);
    }
    //зміна
    function handleEditCancel() {
        setOpen(false);
    }
    // сторінка ділогового вікна 
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
                id={gensym()}
                data-record-id={props.record._id || ''}
                className="KanbanBoardView-sticky-link"
                draggable
                onClick={ev => setOpen(true)}
                onDragStart={handleOnDragStart}>
                <div
                    className={'KanbanBoardView-sticky-note' + (expired ? ' expired' : '')} >
                    {props.board.displayTags && props.record.tags.length ?
                        <ul className="KanbanBoardView-sticky-tags">{
                            props.record.tags.map((x, index) => {
                                const tags = props.board.tags || [];
                                const matched = tags.find(q => q.value === x);
                                return (
                                    <li key={props.record._id + '-tag-' + index}
                                        className={matched ? matched.className : ''}>{x}</li>
                                );
                            })
                        }</ul> :
                        <></>
                    }
                    <div
                        className="KanbanBoardView-sticky-description"
                        dangerouslySetInnerHTML={{__html: marked(props.record.description)}} />
                    {props.board.displayBarcode && props.record.barcode ?
                        <div className="KanbanBoardView-sticky-barcode"
                            dangerouslySetInnerHTML={{__html: new Qr({
                            fill: true,
                            fillColor: isDark ? '#fff' : '#000',
                            cellSize: 2,
                            unit: 'px',
                            data: props.record.barcode,
                        }).toImgTag()}} />
                        : <></>
                    }
                    {props.record.flags.includes('Marked') ?
                        <div className="marked">{'📍'}</div> :
                        <></>
                    }
                    {props.record.dueDate ?
                        <div className="due-date">{(expired ? '🔥' : '⏳' ) + props.record.dueDate}</div> :
                        <></>
                    }
                </div>
            </a> 
            {open ? //обробка запитів
                <KanbanDialog
                    open={true}
                    record={props.record}
                    teamOrStories={props.teamOrStories}
                    taskStatuses={props.taskStatuses}
                    board={props.board}
                    onApply={handleEditApply}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onCancel={handleEditCancel} /> : <></>
            }
        </>
    );
}//підключення
const Stikey = connect(mapNeverStateToProps, mapDispatchToProps)(Stikey_);

//оновлення даних при перенесені наліпки на інше місце та видалення
const Stikeys_: React.FC<StikeysProps> = (props) => {
    function handleOnDragOver(ev: React.DragEvent) {
        ev.preventDefault();
    }

    function handleOnDrop(ev: React.DragEvent) {
        try {
            const elId = ev.dataTransfer.getData('elId');
            const el = document.getElementById(elId);
            props.updateStikeyLanes({
                kanbanId: (el as any).dataset.recordId,
                taskStatusValue: props.taskStatus.value,
                teamOrStoryValue: props.teamOrStory.value,
            })
        } catch (e) {
            alert(e.message);
        }
        ev.preventDefault();
    }

    return (
        <div
            className={
                'KanbanBoardView-sticky-wrap ' + 
                (props.teamOrStory.className || '') + ' ' +
                (props.taskStatus.className || '')}
            data-status={props.taskStatus.value}
            data-team-or-story={props.teamOrStory.value}
            onDragOver={handleOnDragOver}
            onDrop={handleOnDrop}
            >
            {props.records.filter(x => !x.flags || !x.flags.includes('Archived')).map(record => (
                <Stikey
                    key={record._id || gensym()}
                    teamOrStory={props.teamOrStory}
                    taskStatus={props.taskStatus}
                    teamOrStories={props.teamOrStories}
                    taskStatuses={props.taskStatuses}
                    board={props.board}
                    record={record}/>
            ))}{
                
                firefox ? <>&nbsp;</> : <></>
            }
        </div>
    );
}
const Stikeys = connect(mapNeverStateToProps, mapDispatchToProps)(Stikeys_);


const KanbanBoardView: React.FC<KanbanBoardViewProps> = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [textInputOpen, setTextInputOpen] = React.useState({
        open: false,
        title: '',
        message: '',
        fieldLabel: '',
        value: '',
        validator: (value: string) => value.trim().length <= 0,
        onClose: handleCloseDialogEditBoardName,
    });
    //зміна назви
    function handleClickEditBoardName() {
        const currentState = getConstructedAppStore().getState();
        setTextInputOpen(Object.assign({}, textInputOpen, {
            open: true,
            title: 'Змінити назву дошки',
            message: '',
            fieldLabel: 'Назва',
            value: currentState.kanbanBoard.activeBoard.name,
        }));
    }
    //закриття діалогу
    function handleCloseDialogEditBoardName(apply: boolean, value?: string) {
        setTextInputOpen(Object.assign({}, textInputOpen, { open: false }));
        if (apply && value) {
            const currentState = getConstructedAppStore().getState();
            props.updateBoardName({ boardId: currentState.kanbanBoard.activeBoardId, boardName: value });
        }
    }
    //перевірка чи дошка існує в пошуковому рядку
    if (props.match.params.id) {
        if (props.activeBoard._id !== props.match.params.id) {
            const index = props.boards.findIndex(x => x._id === props.match.params.id);
            props.changeActiveBoard(props.match.params.id);
            return (
                <div className="KanbanBoardView-content">
                    {index < 0 ?
                        <>
                            <Typography
                                style={{marginTop: theme.spacing(10)}}
                                variant="h4" align="center">
                                Не знайдено.
                            </Typography>
                            <Typography
                                style={{marginTop: theme.spacing(5), cursor: 'pointer', textDecoration: 'underline'}}
                                variant="body1" align="center"
                                onClick={ev => {props.history.push('/')}} >
                                Нажміть сюди для основної дошки.
                            </Typography>
                        </> :
                        <></>
                    }
                </div>
            );
        }
    }
    //сторінка
    return (
        <div className="KanbanBoardView-content">
            <style dangerouslySetInnerHTML={{__html: props.activeBoard.boardStyle}}></style>
            <Typography
                variant="h6" align="center" style={{cursor: 'pointer'}}
                onClick={handleClickEditBoardName} >{props.activeBoard.name}</Typography>
            <table className="KanbanBoardView-board">
                <thead>
                    <tr>
                        <th className="KanbanBoardView-header-cell-add-stikey">
                            <IconButton style={{margin: 0, padding: 0}}
                                        onClick={ev => props.addStikey()}>
                                <AddBoxIcon className={clsx(classes.smallIcon)} />
                            </IconButton>
                        </th>
                        {props.activeBoard.taskStatuses.map(taskStatus => (
                            <th key={taskStatus.value}
                                className={
                                    'KanbanBoardView-header-cell-task-statuses ' +
                                    (taskStatus.className || '')}>
                                {taskStatus.caption || taskStatus.value}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.activeBoard.teamOrStories.map(teamOrStory => (
                        <tr key={teamOrStory.value}>
                            <th className={
                                'KanbanBoardView-header-cell-team-or-stories ' +
                                (teamOrStory.className || '')}>
                                {teamOrStory.caption || teamOrStory.value}
                            </th>
                            {props.activeBoard.taskStatuses.map(taskStatus => (
                                <td key={taskStatus.value}
                                    className={
                                        (teamOrStory.className || '') + ' ' +
                                        (taskStatus.className || '')}>
                                    <Stikeys
                                        teamOrStory={teamOrStory}
                                        taskStatus={taskStatus}
                                        teamOrStories={props.activeBoard.teamOrStories}
                                        taskStatuses={props.activeBoard.taskStatuses}
                                        board={props.activeBoard}
                                        records={props.activeBoard.records.filter(
                                            x => x.teamOrStory === teamOrStory.value &&
                                                 x.taskStatus  === taskStatus.value)} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {textInputOpen.open ?
                <TextInputDialog
                    open={true}
                    title={textInputOpen.title}
                    message={textInputOpen.message}
                    fieldLabel={textInputOpen.fieldLabel}
                    value={textInputOpen.value}
                    validator={textInputOpen.validator}
                    onClose={textInputOpen.onClose} /> :
                <></>
            }
        </div>
    );
}
export default connect(mapStateToProps, mapDispatchToProps)(KanbanBoardView);

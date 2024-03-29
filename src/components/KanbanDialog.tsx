import React                      from 'react';
import                                 'date-fns';
import DateFnsUtils               from '@date-io/date-fns';
import { MaterialUiPickersDate }  from '@material-ui/pickers/typings/date';
import { MuiPickersUtilsProvider,
         KeyboardDatePicker }     from '@material-ui/pickers';
import Button                     from '@material-ui/core/Button';
import TextField                  from '@material-ui/core/TextField';
import Select                     from '@material-ui/core/Select';
import MenuItem                   from '@material-ui/core/MenuItem';
import InputLabel                 from '@material-ui/core/InputLabel';
import FormControl                from '@material-ui/core/FormControl';
import Dialog                     from '@material-ui/core/Dialog';
import DialogActions              from '@material-ui/core/DialogActions';
import DialogContent              from '@material-ui/core/DialogContent';
import DialogTitle                from '@material-ui/core/DialogTitle';
import Typography                 from '@material-ui/core/Typography';
import Fab                        from '@material-ui/core/Fab';
import ArchiveIcon                from '@material-ui/icons/Archive';
import DeleteIcon                 from '@material-ui/icons/Delete';
import CheckIcon                  from '@material-ui/icons/Check';
import CancelIcon                 from '@material-ui/icons/Cancel';
import { makeStyles,
         useTheme }               from '@material-ui/core/styles';
import clsx                       from 'clsx';
import gensym                     from '../lib/gensym';
import { KanbanDialogProps }      from '../types';
import { formatDate,
         parseISODate }           from '../lib/datetime';
import ConfirmDialog              from '../components/ConfirmDialog';
import { parse as parseCsv }      from '../lib/csv';


//стилі дошки
const useStyles = makeStyles(theme => ({
    formControl: {
        minWidth: 220,
    },
    icon: {
        margin: theme.spacing(1),
        fontSize: 26,
    },
    fabDelete: {
        position: 'absolute',
        margin: theme.spacing(1),
        right: theme.spacing(1),
        top: theme.spacing(1),
    },
}));

//змінні для роботи з картками на дошці
const KanbanDialog: React.FC<KanbanDialogProps> = (props) => {
    const classes = useStyles();
    const theme = useTheme();

    const [open, setOpen] = React.useState(props.open);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [description, setDescription] = React.useState(props.record.description);
    const [barcode, setBarcode] = React.useState(props.record.barcode);
    const [memo, setMemo] = React.useState(props.record.memo);
    const [tags, setTags] = React.useState(props.record.tags ?
        props.record.tags.map(x => x.includes(',') ? `"${x.replace(/"/g, '""')}"` : x).join(', ') : '');
    const [flags, setFlags] = React.useState(props.record.flags ?
        props.record.flags.map(x => x.includes(',') ? `"${x.replace(/"/g, '""')}"` : x).join(', ') : '');
    const [dueDate, setDueDate] = React.useState<MaterialUiPickersDate>(parseISODate(props.record.dueDate));
    const [taskStatus, setTaskStatus] = React.useState(props.record.taskStatus);
    const [teamOrStory, setTeamOrStory] = React.useState(props.record.teamOrStory);

    const formDialogTitleId = gensym();
    const taskStatusesId = gensym();
    const teamOrStoryId = gensym();
        //кнопка відміни
    function handleCancelClick() {
        setOpen(false);
        props.onCancel();
    }
    //кнопка підтвердження
    function handleApplyClick() {
        setOpen(false);

        const tagsTrimmed = tags.trim();
        const tagsParsed = tagsTrimmed ? parseCsv(tagsTrimmed) : [];

        const flagsTrimmed = flags.trim();
        const flagsParsed = flagsTrimmed ? parseCsv(flagsTrimmed) : [];

        props.onApply(Object.assign({}, props.record, {
            description,
            barcode,
            memo,
            tags: (tagsParsed[0] || []).map(x => x.trim()).filter(x => x.length > 0),
            flags: (flagsParsed[0] || []).map(x => x.trim()).filter(x => x.length > 0),
            dueDate: (dueDate && !Number.isNaN(dueDate.getTime())) ? formatDate(dueDate) : '',
            taskStatus,
            teamOrStory,
        }));
    }
    //архівувати/видалити
    function handleArchiveOrDeleteClick() {
        setConfirmOpen(true);
    }
    //зміна опису
    function handleDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setDescription(event.target.value);
    }
    //зміна дати
    function handleDueDateChange(date: MaterialUiPickersDate) {
        setDueDate(date);
    }
    //зміна статусу
    function handleTaskStatusChange(event: React.ChangeEvent<{name?: string, value: unknown}>) {
        if (! event.target.name) {
            return;
        }
        setTaskStatus(event.target.value as string);
    }
    //зміна команди
    function handleTeamOrStoryChange(event: React.ChangeEvent<{name?: string, value: unknown}>) {
        if (! event.target.name) {
            return;
        }
        setTeamOrStory(event.target.value as string);
    }
    //зміна тегів
    function handleTagsChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setTags(event.target.value);
    }
    //зміна міток
    function handleFlagsChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setFlags(event.target.value);
    }

    function handleBarcodeChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setBarcode(event.target.value);
    }
    //зміна нотаток
    function handleMemoChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setMemo(event.target.value);
    }
    //архівування
    function handleConfirmArchiving(apply: boolean) {
        setConfirmOpen(false);
        if (apply) {
            setOpen(false);
            props.onArchive(props.record._id);
        }
    }
    //видалення
    function handleConfirmDeleting(apply: boolean) {
        setConfirmOpen(false);
        if (apply) {
            setOpen(false);
            props.onDelete(props.record._id);
        }
    }
    //верстка сторінки
    return (
        <>
            <Dialog open={open} onClose={handleCancelClick} aria-labelledby={formDialogTitleId}>
                <DialogTitle id={formDialogTitleId} style={{paddingBottom: '0'}}>
                    Змінити завдання
                    <Button
                        className={clsx(classes.fabDelete)}
                        variant="outlined"
                        color="default"
                        onClick={handleArchiveOrDeleteClick} >
                        {props.board.preferArchive ? <ArchiveIcon /> : <DeleteIcon color="secondary" />}
                        <Typography variant="body1" color={props.board.preferArchive ? 'initial' : 'secondary'}
                            style={{marginLeft: theme.spacing(1)}} >
                            {props.board.preferArchive ? 'Архівувати' : 'Видалити'}
                        </Typography>
                    </Button>
                </DialogTitle>
                <DialogContent>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div>
                            <TextField
                                margin="dense"
                                label="Опис"
                                multiline
                                rows={4}
                                rowsMax={16}
                                fullWidth
                                value={description}
                                onChange={handleDescriptionChange}
                                helperText="Mожна використовувати Markdown"
                                />
                        </div>
                        <div>
                            <KeyboardDatePicker
                                margin="dense"
                                label="Кінцева дата"
                                format="yyyy-MM-dd"
                                KeyboardButtonProps={{
                                    'aria-label': 'change date',
                                }}
                                value={dueDate}
                                onChange={handleDueDateChange}
                                />
                        </div>
                        <div>
                            <FormControl className={clsx(classes.formControl)} style={{marginTop: '5px'}}>
                                <InputLabel htmlFor={taskStatusesId}>Статус</InputLabel>
                                <Select
                                    value={taskStatus}
                                    onChange={handleTaskStatusChange}
                                    inputProps={{
                                        name: 'taskStatus',
                                        id: taskStatusesId,
                                    }}
                                    >
                                    {props.taskStatuses.map(x => (
                                        <MenuItem key={x.value} value={x.value}>{x.caption || x.value}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl className={clsx(classes.formControl)} style={{marginLeft: theme.spacing(1), marginTop: '5px'}}>
                                <InputLabel htmlFor={teamOrStoryId}>Команда / Категорія</InputLabel>
                                <Select
                                    value={teamOrStory}
                                    onChange={handleTeamOrStoryChange}
                                    inputProps={{
                                        name: 'teamOrStory',
                                        id: teamOrStoryId,
                                    }}
                                    >
                                    {props.teamOrStories.map(x => (
                                        <MenuItem key={x.value} value={x.value}>{x.caption || x.value}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                        {props.board.displayTags && props.board.displayFlags ?
                            <div>
                                <FormControl className={clsx(classes.formControl)} style={{marginTop: '5px'}}>
                                    <TextField
                                        margin="dense"
                                        label="Позначки"
                                        value={tags}
                                        onChange={handleTagsChange}
                                        helperText="Розділяти комами (CSV синтакс)"
                                        />
                                </FormControl>
                                <FormControl className={clsx(classes.formControl)} style={{marginLeft: theme.spacing(1), marginTop: '5px'}}>
                                    <TextField
                                        margin="dense"
                                        label="Мітки"
                                        value={flags}
                                        onChange={handleFlagsChange}
                                        helperText="Розділяти комами (CSV синтакс)"
                                        />
                                </FormControl>
                            </div> :
                            <></>
                        }
                        {props.board.displayTags && !props.board.displayFlags ?
                            <div>
                                <TextField
                                    margin="dense"
                                    label="Мітки"
                                    fullWidth
                                    value={tags}
                                    onChange={handleTagsChange}
                                    helperText="Розділяти комами (CSV синтакс)"
                                    />
                            </div> :
                            <></>
                        }
                        {props.board.displayFlags && !props.board.displayTags ?
                            <div>
                                <TextField
                                    margin="dense"
                                    label="Мітки"
                                    fullWidth
                                    value={flags}
                                    onChange={handleFlagsChange}
                                    helperText="Розділяти комами (CSV синтакс)"
                                    />
                            </div> :
                            <></>
                        }
                        {props.board.displayBarcode ?
                            <div>
                                <TextField
                                    margin="dense"
                                    label="QR-код"
                                    multiline
                                    rows={1}
                                    rowsMax={16}
                                    fullWidth
                                    value={barcode}
                                    onChange={handleBarcodeChange}
                                    />
                            </div> :
                            <></>
                        }
                        {props.board.displayMemo ?
                            <div>
                                <TextField
                                    margin="dense"
                                    label="Нотатки"
                                    multiline
                                    rows={1}
                                    rowsMax={16}
                                    fullWidth
                                    value={memo}
                                    onChange={handleMemoChange}
                                    />
                            </div> :
                            <></>
                        }
                    </MuiPickersUtilsProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelClick} variant="outlined" color="default">
                        <CancelIcon /><span style={{marginLeft: theme.spacing(1)}} />Відмінити
                    </Button>
                    <Button onClick={handleApplyClick} variant="contained" color="primary">
                        <CheckIcon /><span style={{marginLeft: theme.spacing(1)}} />Підтвердити
                    </Button>
                </DialogActions>
            </Dialog>
            {confirmOpen ?
                <ConfirmDialog
                    open={true}
                    title={props.board.preferArchive ? 'Архівувати' : 'Видалити'}
                    message={`Ви впевнені, що хочете ${props.board.preferArchive ? 'архівувати' : 'видалити'} завдання?`}
                    colorIsSecondary={props.board.preferArchive ? false : true}
                    applyButtonCaption={props.board.preferArchive ? 'Архівувати' : 'Видалити'}
                    fab={props.board.preferArchive ?
                        <Fab size="large" variant="round" aria-label="archive" style={{margin: 'auto'}}>
                            <ArchiveIcon />
                        </Fab> :
                        <Fab size="large" variant="round" aria-label="delete" color="secondary" style={{margin: 'auto'}}>
                            <DeleteIcon />
                        </Fab>
                    }
                    onClose={props.board.preferArchive ?
                        handleConfirmArchiving:
                        handleConfirmDeleting} /> :
                <></>
            }
        </>
    );
}
export default KanbanDialog;

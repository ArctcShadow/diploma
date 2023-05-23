export const boardStyle =
`/* per-board customized styles */
/*
.KanbanBoardView-sticky-note {width: 200px}
.KanbanBoardView-header-cell-task-statuses {min-width: 210px}
table.KanbanBoardView-board tbody th {
    padding: 10px;
    white-space: nowrap;
}
*/
table.KanbanBoardView-board thead th.status-backlog {
    background-color: var(--weak-header-bg-color);
}
table.KanbanBoardView-board td.status-backlog {
    background-color: var(--weak-data-bg-color);
}
table.KanbanBoardView-board thead th.status-done {
    background-color: var(--weak-header-bg-color);
}
table.KanbanBoardView-board td.status-done {
    background-color: var(--weak-data-bg-color);
}
.team-or-story-team-b .KanbanBoardView-sticky-note {
    background-color: var(--sticky-blue-color);
}
.status-done .KanbanBoardView-sticky-note {
    background-color: var(--sticky-green-color);
}
.KanbanBoardView-sticky-tags .tag-bug {
    color: white;
    background-color: red;
}
`;


export const calendarStyle =
`/* per-board customized styles */
div.CalendarView-item-chip.status-done {
    background-color: var(--sticky-green-color);
}
`;


export const initialData = {
    "boards": [{
        "type": "kanbanBoard",
        "name": "Вітальна дошка",
        "taskStatuses": [{
            "value": "Backlog",
            "caption": "Backlog",
            "className": "status-backlog"
        }, {
            "value": "ToDo",
            "caption": "To do",
            "className": "status-todo"
        }, {
            "value": "InProgress",
            "caption": "In Progress",
            "className": "status-inprogress"
        }, {
            "value": "Review",
            "caption": "Review",
            "className": "status-review"
        }, {
            "value": "Done",
            "caption": "Done",
            "className": "status-done",
            "completed": true
        }],
        "teamOrStories": [{
            "value": "Team A",
            "caption": "Команда A",
            "className": "team-or-story-team-a"
        }, {
            "value": "Team B",
            "caption": "Команда Б",
            "className": "team-or-story-team-b"
        }, {
            "value": "Team C",
            "caption": "Команда В",
            "className": "team-or-story-team-c"
        }],
        "tags": [{
            "value": "bug",
            "className": "tag-bug"
        }],
        "displayBarcode": true,
        "displayMemo": true,
        "displayFlags": true,
        "displayTags": true,
        "preferArchive": false,
        "boardStyle": boardStyle,
        "calendarStyle": calendarStyle
    }],
    "records": [{
        "type": "kanban",
        "dueDate": "",
        "description":
        "# Ласкаво прошу до додатку!\n" +
        "* Це картка з завданням.\n" +
        "* Пишіть одне завдання для однієї картки.\n" +
        "* Щоб додати картку на дошку, натисніть на іконку "+" у верхньому лівому кутку дошки.\n" +
        "* Натисніть або клацніть по завданню для редагування.\n" +
        "* Перетягніть завдання, щоб змінити його статус.",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "Backlog"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "* Дошка та завдання зберігаються у локальній індексованій браузерній базі даних.\n" +
            "* Ви можете використовувати віддалений сервер [`CouchDB`](https://couchdb.apache.org) для синхронізації дошок декількох пристроїв\n" +
            "* Або як альтернативу безкоштовну версію керованого серверу від IBM: [“IBM Cloudant®” from IBM Cloud](https://www.ibm.com/cloud/cloudant).\n",
            
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "ToDo"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "# Для встановлення -> [Налаштування](#/config/)\n\n" +
            "----\n\n" +
            "* `remote.endpointUrl`: посиланян на Cloudant `External Endpoint` разом з назвою БД\n" +
            "  * приклад: `https://???-bluemix.cloudant.com/mydb`\n" +
            "* `remote.user`: Cloudant `API Key`\n" +
            "* `remote.password`: пароль Cloudant `API Key`",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "ToDo"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "* Ви можете налаштувати вигляд і поведінку дошки та завдань у вікні редактора конфігурації.\n\n\n" + "\n\n\n" + "\n\n\n" + "\n\n\n"+
            "----\n\n" +
            "# Перейдіть в [Редактор](#/edit/) для налаштування",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "InProgress"
    }, {
        "type": "kanban",
        "dueDate": "2030-01-01",
        "description":
            "### Привіт, користувачу! !\n\n" +
            "* ~aaa~\n" +
            "  * **bbb**\n" +
            "* *ccc*\n\n" +
            "----\n\n",
           
        "barcode": "12345",
        "memo": "memo",
        "flags": ["Marked"],
        "tags": ["PR", "bug"],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "Staging"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team C",
        "taskStatus": "Backlog"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team C",
        "taskStatus": "Backlog"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "# Початок роботи з Cloudant в IBM Cloud\n" +
            "https://developer.ibm.com/clouddataservices/docs/cloudant/get-started/",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team C",
        "taskStatus": "ToDo"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "# Зареєструйтеся в IBM Cloud\n" +
            "https://cloud.ibm.com/registration",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team C",
        "taskStatus": "ToDo"
    }, {
        "type": "kanban",
        "dueDate": "",
        "description":
            "",
        "barcode": "",
        "memo": "",
        "flags": [],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team A",
        "taskStatus": "Done"
    }, {
        "type": "kanban",
        "dueDate": "2030-01-01",
        "description": "Цей запис архівовано.",
        "barcode": "",
        "memo": "",
        "flags": ["Archived"],
        "tags": [],
        "boardId": "",
        "teamOrStory": "Team B",
        "taskStatus": "Backlog"
    }]
}

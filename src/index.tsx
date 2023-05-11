import React                    from 'react';
import ReactDOM                 from 'react-dom';
import { Provider }             from 'react-redux';
import { ConnectedRouter }      from 'connected-react-router'
import { getLocalDb }           from './lib/db'
import                               './index.css';
import App                      from './App';
import * as serviceWorker       from './serviceWorker';
import getAppStore,
       { history }              from './store';



(async () => {
    getLocalDb(); //БД
    //Запуск усіх компонентів
    ReactDOM.render(
        <Provider store={await getAppStore()}>
            <ConnectedRouter history={history}>
                <App /> 
            </ConnectedRouter>
        </Provider>,
        document.getElementById('root')); //html рендер

   

    serviceWorker.unregister();
    // serviceWorker.register();
})();

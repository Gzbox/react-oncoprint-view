import { OncoKbAPI } from 'oncokb-ts-api-client';
import eventBus from '../events/eventBus';

const client = new OncoKbAPI();

client.addErrorHandler(err => {
    const siteError = 'error'

    try {

    } catch (ex) {
        // fail silent
    }

    eventBus.emit('error', null, siteError);
});

export default client;

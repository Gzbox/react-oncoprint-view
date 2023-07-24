import * as React from 'react';
import { observer } from 'mobx-react';
import OncoprinterStore from './OncoprinterStore';
import Oncoprinter from './Oncoprinter';
import { action, observable, makeObservable } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { data } from './mockData';

@observer
export default class OncoprinterTool extends React.Component {
    private store = new OncoprinterStore();

    @observable dataInputOpened = true;
    @observable geneticHelpOpened = false;
    @observable clinicalHelpOpened = false;
    @observable heatmapHelpOpened = false;

    // help
    @observable helpOpened = false;

    // input
    @observable geneticDataInput = '';
    @observable clinicalDataInput = '';
    @observable heatmapDataInput = '';
    @observable geneOrderInput = '';
    @observable sampleOrderInput = '';

    constructor(props) {
        super(props);
        makeObservable(this);
        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        // Load posted data, if it exists
        const postData = getBrowserWindow().clientPostedData;
        if (postData) {
            this.geneticDataInput = postData.genetic;
            this.clinicalDataInput = postData.clinical;
            this.heatmapDataInput = postData.heatmap;
            this.doSubmit(
                this.geneticDataInput,
                this.clinicalDataInput,
                this.heatmapDataInput
            );
            getBrowserWindow().clientPostedData = null;
        }
    }

    @action.bound
    public onGeneticDataInputChange(e: any) {
        this.geneticDataInput = e.currentTarget.value;
    }

    @action private doSubmit(
        geneticDataInput: string,
        clinicalDataInput: string,
        heatmapDataInput: string
    ) {
        this.store.setInput(
            geneticDataInput,
            clinicalDataInput,
            heatmapDataInput,
            this.geneOrderInput,
            this.sampleOrderInput
        );

        if (this.store.parseErrors.length === 0) {
            this.dataInputOpened = false;
        }
    }

    componentWillMount(): void {
        this.doSubmit(
            data.geneticDataInput,
            data.clinicalDataInput,
            data.heatmapDataInput
        );
    }

    render() {
        return <Oncoprinter divId="oncoprinter" store={this.store} />;
    }
}

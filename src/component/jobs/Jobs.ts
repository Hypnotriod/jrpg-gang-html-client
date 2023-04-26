import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_CONFIGURATOR, JOBS_LIST_CONTAINER } from '../../constants/Components';
import { EmploymentStatus, PlayerJob } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { JobStatusData, Response } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import Job from './Job';

@injectable()
@singleton()
export default class Jobs extends Component implements ServerCommunicatorHandler {
    @component(BUTTON_CONFIGURATOR, Button)
    private readonly configuratorButton: Button;
    private jobs: Job[] = [];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        // @ts-ignore
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.configuratorButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([RequestType.JOBS_STATUS, RequestType.APPLY_FOR_A_JOB, RequestType.COMPLETE_JOB, RequestType.QUIT_JOB], this);
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.unitConfigurator.show();
    }

    public show(): void {
        super.show();
        this.communicator.sendMessage(RequestType.JOBS_STATUS);
    }

    handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.JOBS_STATUS:
                this.update(response.data as JobStatusData);
                break;
        }
    }

    protected update(jobsStatus: JobStatusData): void {
        const employment: EmploymentStatus = jobsStatus.employment;
        this.jobs.forEach(job => job.destroy());
        employment.availableJobs = employment.availableJobs.filter(j => j.code !== employment.currentJob?.code);
        this.jobs = [];
        this.configuratorButton.enabled = !employment.isComplete && !employment.isInProgress;
        if (employment.currentJob) {
            this.jobs.push(this.createJob(employment.currentJob, employment));
        }
        this.jobs = this.jobs.concat(employment.availableJobs.map(jobConfig => this.createJob(jobConfig, employment)));
    }

    protected createJob(jobConfig: PlayerJob, employment: EmploymentStatus): Job {
        const job: Job = Job.createJob(this, JOBS_LIST_CONTAINER)!;
        job.update(jobConfig, employment);
        job.enabled = !employment.isComplete && !employment.isInProgress;
        return job;
    }

    handleConnectionLost(): void {
        this.hide();
    }
}
